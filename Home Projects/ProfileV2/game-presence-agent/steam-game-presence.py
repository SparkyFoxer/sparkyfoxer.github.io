#!/usr/bin/env python3
"""Report the currently running Steam game to Sparky's game-history Worker."""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

REPORT_INTERVAL_SECONDS = 15
REQUEST_TIMEOUT_SECONDS = 10
RUNTIME_NAMES = (
    "steam linux runtime",
    "steamworks common redistributables",
    "proton ",
)


def log(message: str) -> None:
    print(message, flush=True)


def steam_app_id(value: str) -> int | None:
    try:
        number = int(value.strip())
    except (TypeError, ValueError):
        return None

    if number > 0xFFFFFFFF:
        number &= 0xFFFFFF

    if number <= 0 or number == 769:
        return None

    return number


def process_environment(pid: str) -> dict[str, str]:
    try:
        raw = Path("/proc", pid, "environ").read_bytes()
    except (FileNotFoundError, PermissionError, ProcessLookupError, OSError):
        return {}

    values: dict[str, str] = {}

    for entry in raw.split(b"\0"):
        if b"=" not in entry:
            continue

        key, value = entry.split(b"=", 1)
        values[key.decode("utf-8", "replace")] = value.decode(
            "utf-8", "replace"
        )

    return values


def boot_time_seconds() -> float:
    try:
        for line in Path("/proc/stat").read_text(encoding="utf-8").splitlines():
            if line.startswith("btime "):
                return float(line.split()[1])
    except (OSError, ValueError, IndexError):
        pass

    return time.time() - time.monotonic()


def process_started_at_ms(pid: str, boot_time: float) -> int | None:
    try:
        stat = Path("/proc", pid, "stat").read_text(encoding="utf-8")
        closing_parenthesis = stat.rfind(")")
        fields_after_name = stat[closing_parenthesis + 2 :].split()
        start_ticks = int(fields_after_name[19])
        clock_ticks = os.sysconf("SC_CLK_TCK")
    except (FileNotFoundError, PermissionError, OSError, ValueError, IndexError):
        return None

    return round((boot_time + start_ticks / clock_ticks) * 1000)


def decode_vdf_string(value: str) -> str:
    return value.replace(r"\"", '"').replace(r"\\", "\\")


def base_steam_directories() -> list[Path]:
    home = Path.home()
    candidates = [
        home / ".local/share/Steam",
        home / ".steam/steam",
        home / ".var/app/com.valvesoftware.Steam/data/Steam",
    ]

    return [path for path in candidates if path.exists()]


def steamapps_directories() -> list[Path]:
    directories: list[Path] = []

    for steam_root in base_steam_directories():
        default_steamapps = steam_root / "steamapps"
        if default_steamapps.is_dir():
            directories.append(default_steamapps)

        library_file = default_steamapps / "libraryfolders.vdf"

        try:
            library_text = library_file.read_text(
                encoding="utf-8", errors="replace"
            )
        except OSError:
            continue

        for match in re.finditer(r'"path"\s+"((?:\\.|[^"])*)"', library_text):
            library_root = Path(decode_vdf_string(match.group(1))).expanduser()
            steamapps = library_root / "steamapps"
            if steamapps.is_dir():
                directories.append(steamapps)

    unique: list[Path] = []
    seen: set[str] = set()

    for directory in directories:
        key = str(directory.resolve())
        if key not in seen:
            seen.add(key)
            unique.append(directory)

    return unique


def installed_games() -> dict[int, str]:
    games: dict[int, str] = {}

    for steamapps in steamapps_directories():
        for manifest in steamapps.glob("appmanifest_*.acf"):
            try:
                text = manifest.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue

            app_match = re.search(r'"appid"\s+"(\d+)"', text)
            name_match = re.search(r'"name"\s+"((?:\\.|[^"])*)"', text)

            if not app_match or not name_match:
                continue

            app_id = int(app_match.group(1))
            name = decode_vdf_string(name_match.group(1)).strip()
            lowered = name.lower()

            if not name or lowered.startswith(RUNTIME_NAMES):
                continue

            games[app_id] = name

    return games


def current_steam_game() -> dict[str, Any] | None:
    games = installed_games()
    if not games:
        return None

    boot_time = boot_time_seconds()
    candidates: dict[int, int] = {}

    try:
        process_ids = [entry.name for entry in Path("/proc").iterdir() if entry.name.isdigit()]
    except OSError:
        return None

    for pid in process_ids:
        environment = process_environment(pid)
        raw_id = environment.get("SteamAppId") or environment.get("SteamGameId")
        if not raw_id:
            continue

        app_id = steam_app_id(raw_id)
        if app_id is None or app_id not in games:
            continue

        started_at = process_started_at_ms(pid, boot_time)
        if started_at is None:
            continue

        previous = candidates.get(app_id)
        if previous is None or started_at < previous:
            candidates[app_id] = started_at

    if not candidates:
        return None

    app_id, started_at = min(candidates.items(), key=lambda item: item[1])

    return {
        "applicationId": str(app_id),
        "name": games[app_id],
        "details": "Playing through Steam",
        "state": "Fedora Linux",
        "startedAt": started_at,
    }


def report_game(url: str, token: str, game: dict[str, Any] | None) -> None:
    payload = json.dumps({"game": game}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "sparky-steam-game-presence/1.0",
        },
    )

    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"Worker returned HTTP {response.status}")


def main() -> int:
    url = os.environ.get("GAME_PRESENCE_URL", "").strip()
    token = os.environ.get("GAME_PUBLISH_TOKEN", "").strip()

    if not url or not token:
        print(
            "GAME_PRESENCE_URL and GAME_PUBLISH_TOKEN must be configured.",
            file=sys.stderr,
        )
        return 2

    previous_identity: tuple[str, int] | None = None

    while True:
        game = current_steam_game()
        identity = None if game is None else (
            str(game["applicationId"]),
            int(game["startedAt"]),
        )

        try:
            report_game(url, token, game)

            if identity != previous_identity:
                if game:
                    log(f"Reporting Steam game: {game['name']}")
                else:
                    log("No Steam game is running.")
                previous_identity = identity
        except (
            urllib.error.HTTPError,
            urllib.error.URLError,
            TimeoutError,
            OSError,
            RuntimeError,
        ) as error:
            log(f"Could not report Steam game: {error}")

        time.sleep(REPORT_INTERVAL_SECONDS)


if __name__ == "__main__":
    raise SystemExit(main())
