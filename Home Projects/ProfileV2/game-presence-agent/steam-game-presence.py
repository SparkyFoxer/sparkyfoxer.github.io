#!/usr/bin/env python3
"""Report the current Steam game to Sparky's website and Discord."""

from __future__ import annotations

import json
import os
import re
import signal
import socket
import struct
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Any

REPORT_INTERVAL_SECONDS = 15
REQUEST_TIMEOUT_SECONDS = 10
DISCORD_CONNECT_TIMEOUT_SECONDS = 3
DISCORD_RESPONSE_TIMEOUT_SECONDS = 5
MAX_RPC_PACKET_BYTES = 1024 * 1024

RUNTIME_NAMES = (
    "steam linux runtime",
    "steamworks common redistributables",
    "proton ",
)

RPC_HANDSHAKE = 0
RPC_FRAME = 1
RPC_CLOSE = 2
RPC_PING = 3
RPC_PONG = 4

_stop_requested = False


def log(message: str) -> None:
    print(message, flush=True)


def request_stop(_signum: int, _frame: object) -> None:
    global _stop_requested
    _stop_requested = True


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
    candidates: dict[int, tuple[int, int]] = {}

    try:
        process_ids = [
            entry.name
            for entry in Path("/proc").iterdir()
            if entry.name.isdigit()
        ]
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
        pid_number = int(pid)
        if previous is None or started_at < previous[0]:
            candidates[app_id] = (started_at, pid_number)

    if not candidates:
        return None

    app_id, (started_at, pid_number) = min(
        candidates.items(),
        key=lambda item: item[1][0],
    )

    return {
        "applicationId": str(app_id),
        "name": games[app_id],
        "details": "Playing through Steam",
        "state": "Fedora Linux",
        "startedAt": started_at,
        "pid": pid_number,
    }


def report_game(url: str, token: str, game: dict[str, Any] | None) -> None:
    public_game = None
    if game is not None:
        public_game = {
            key: value
            for key, value in game.items()
            if key != "pid"
        }

    payload = json.dumps({"game": public_game}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "sparky-steam-game-presence/2.0",
        },
    )

    with urllib.request.urlopen(
        request,
        timeout=REQUEST_TIMEOUT_SECONDS,
    ) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"Worker returned HTTP {response.status}")


class DiscordIPCError(RuntimeError):
    """Raised when Discord local RPC is unavailable or rejects a request."""


class DiscordIPC:
    def __init__(self, application_id: str) -> None:
        self.application_id = application_id
        self.connection: socket.socket | None = None
        self.path: Path | None = None

    @staticmethod
    def candidate_paths() -> list[Path]:
        roots: list[Path] = []
        seen: set[str] = set()

        for value in (
            os.environ.get("XDG_RUNTIME_DIR"),
            f"/run/user/{os.getuid()}",
            os.environ.get("TMPDIR"),
            os.environ.get("TMP"),
            os.environ.get("TEMP"),
            "/tmp",
        ):
            if not value:
                continue

            root = Path(value)
            key = str(root)
            if key in seen:
                continue

            seen.add(key)
            roots.append(root)

        return [
            root / f"discord-ipc-{index}"
            for root in roots
            for index in range(10)
        ]

    @staticmethod
    def _encode_payload(payload: dict[str, Any]) -> bytes:
        return json.dumps(
            payload,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")

    def _send_raw(self, opcode: int, body: bytes) -> None:
        if self.connection is None:
            raise DiscordIPCError("Discord IPC is not connected")

        header = struct.pack("<II", opcode, len(body))
        self.connection.sendall(header + body)

    def _send_json(self, opcode: int, payload: dict[str, Any]) -> None:
        self._send_raw(opcode, self._encode_payload(payload))

    def _read_exact(self, length: int) -> bytes:
        if self.connection is None:
            raise DiscordIPCError("Discord IPC is not connected")

        chunks: list[bytes] = []
        remaining = length

        while remaining:
            chunk = self.connection.recv(remaining)
            if not chunk:
                raise DiscordIPCError("Discord closed its IPC connection")
            chunks.append(chunk)
            remaining -= len(chunk)

        return b"".join(chunks)

    def _read_packet(self) -> tuple[int, dict[str, Any], bytes]:
        header = self._read_exact(8)
        opcode, length = struct.unpack("<II", header)

        if length > MAX_RPC_PACKET_BYTES:
            raise DiscordIPCError(
                f"Discord IPC packet is unexpectedly large ({length} bytes)"
            )

        raw = self._read_exact(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise DiscordIPCError("Discord returned invalid IPC JSON") from error

        if not isinstance(payload, dict):
            raise DiscordIPCError("Discord returned an invalid IPC payload")

        return opcode, payload, raw

    @staticmethod
    def _error_message(payload: dict[str, Any]) -> str:
        data = payload.get("data")
        if isinstance(data, dict):
            code = data.get("code")
            message = data.get("message")
            if code or message:
                return f"{code or 'RPC error'}: {message or 'Unknown error'}"
        return str(payload)

    def connect(self) -> None:
        self.close()
        errors: list[str] = []

        for path in self.candidate_paths():
            connection = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            connection.settimeout(DISCORD_CONNECT_TIMEOUT_SECONDS)

            try:
                connection.connect(str(path))
                self.connection = connection
                self.path = path

                self._send_json(
                    RPC_HANDSHAKE,
                    {"v": 1, "client_id": self.application_id},
                )
                opcode, payload, _raw = self._read_packet()

                if opcode == RPC_CLOSE:
                    raise DiscordIPCError(self._error_message(payload))

                if opcode != RPC_FRAME or payload.get("evt") != "READY":
                    raise DiscordIPCError(
                        f"Unexpected Discord handshake response: {payload}"
                    )

                connection.settimeout(DISCORD_RESPONSE_TIMEOUT_SECONDS)
                return
            except (OSError, TimeoutError, DiscordIPCError) as error:
                errors.append(f"{path}: {error}")
                try:
                    connection.close()
                except OSError:
                    pass
                self.connection = None
                self.path = None

        if errors:
            raise DiscordIPCError(errors[-1])

        raise DiscordIPCError("No Discord IPC socket was found")

    def _wait_for_nonce(self, nonce: str) -> dict[str, Any]:
        while True:
            opcode, payload, raw = self._read_packet()

            if opcode == RPC_PING:
                self._send_raw(RPC_PONG, raw)
                continue

            if opcode == RPC_CLOSE:
                raise DiscordIPCError(self._error_message(payload))

            if opcode != RPC_FRAME:
                continue

            if payload.get("nonce") != nonce:
                continue

            if payload.get("evt") == "ERROR":
                raise DiscordIPCError(self._error_message(payload))

            return payload

    @staticmethod
    def activity_for_game(
        game: dict[str, Any] | None,
    ) -> dict[str, Any] | None:
        if game is None:
            return None

        started_at_ms = int(game.get("startedAt") or time.time() * 1000)
        name = str(game.get("name") or "Steam game").strip()[:128]

        return {
            "name": name,
            "type": 0,
            "status_display_type": 0,
            "details": "Playing through Steam",
            "state": "Fedora Linux",
            "timestamps": {
                "start": max(1, started_at_ms // 1000),
            },
            "instance": True,
        }

    def set_activity(self, game: dict[str, Any] | None) -> None:
        if self.connection is None:
            self.connect()

        nonce = str(uuid.uuid4())
        payload = {
            "cmd": "SET_ACTIVITY",
            "args": {
                "pid": os.getpid(),
                "activity": self.activity_for_game(game),
            },
            "nonce": nonce,
        }

        try:
            self._send_json(RPC_FRAME, payload)
            self._wait_for_nonce(nonce)
        except (OSError, TimeoutError, DiscordIPCError):
            self.close()
            raise

    def close(self) -> None:
        if self.connection is not None:
            try:
                self.connection.close()
            except OSError:
                pass

        self.connection = None
        self.path = None


def run_self_test() -> int:
    assert steam_app_id("2483190") == 2483190
    assert steam_app_id("769") is None

    activity = DiscordIPC.activity_for_game(
        {
            "name": "Forza Horizon 6",
            "startedAt": 1_786_066_640_680,
        }
    )
    assert activity is not None
    assert activity["name"] == "Forza Horizon 6"
    assert activity["type"] == 0
    assert activity["timestamps"]["start"] == 1_786_066_640

    assert DiscordIPC.activity_for_game(None) is None
    print("Self-test passed.")
    return 0


def main() -> int:
    if "--self-test" in sys.argv:
        return run_self_test()

    url = os.environ.get("GAME_PRESENCE_URL", "").strip()
    token = os.environ.get("GAME_PUBLISH_TOKEN", "").strip()
    discord_application_id = os.environ.get(
        "DISCORD_APPLICATION_ID",
        "",
    ).strip()

    if not url or not token:
        print(
            "GAME_PRESENCE_URL and GAME_PUBLISH_TOKEN must be configured.",
            file=sys.stderr,
        )
        return 2

    if not discord_application_id.isdigit():
        print(
            "DISCORD_APPLICATION_ID must be configured with a numeric ID.",
            file=sys.stderr,
        )
        return 2

    signal.signal(signal.SIGTERM, request_stop)
    signal.signal(signal.SIGINT, request_stop)

    discord = DiscordIPC(discord_application_id)
    previous_identity: tuple[str, int] | None = None
    previous_discord_identity: tuple[str, int] | None = None
    previous_discord_error: str | None = None

    try:
        while not _stop_requested:
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

            try:
                discord.set_activity(game)

                if identity != previous_discord_identity:
                    if game:
                        log(f"Discord activity: {game['name']}")
                    else:
                        log("Discord activity cleared.")
                    previous_discord_identity = identity

                if previous_discord_error is not None:
                    log("Discord activity connection restored.")
                    previous_discord_error = None
            except (
                DiscordIPCError,
                OSError,
                TimeoutError,
            ) as error:
                message = str(error)
                if message != previous_discord_error:
                    log(f"Could not update Discord activity: {message}")
                    previous_discord_error = message

            for _ in range(REPORT_INTERVAL_SECONDS):
                if _stop_requested:
                    break
                time.sleep(1)
    finally:
        try:
            if discord.connection is not None:
                discord.set_activity(None)
        except (DiscordIPCError, OSError, TimeoutError):
            pass
        discord.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
