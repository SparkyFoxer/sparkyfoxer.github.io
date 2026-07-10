/* Live Fedora PC monitor card */
(() => {
  const ENDPOINT = "https://sparky-pc-monitor.sparkyfoxer.workers.dev/api/status";
  const REFRESH_MS = 5000;

  const card = document.querySelector("#pcMonitorCard");
  if (!card) return;

  let latest = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function percent(value) {
    return `${Math.round(number(value))}%`;
  }

  function temperature(value) {
    return Number.isFinite(Number(value))
      ? `${Math.round(Number(value))}°C`
      : "--°C";
  }

  function watts(value) {
    return Number.isFinite(Number(value))
      ? `${Math.round(Number(value))} W`
      : "-- W";
  }

  function gibibytes(bytes) {
    return number(bytes) / 1024 ** 3;
  }

  function usedTotal(used, total) {
    const usedGiB = gibibytes(used);
    const totalGiB = gibibytes(total);
    if (!totalGiB) return "-- / --";
    return `${usedGiB.toFixed(1)} / ${totalGiB.toFixed(0)} GB`;
  }

  function duration(totalSeconds) {
    const seconds = Math.max(0, Math.floor(number(totalSeconds)));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function age(milliseconds) {
    if (!Number.isFinite(Number(milliseconds))) return "never";
    const seconds = Math.max(0, Math.floor(Number(milliseconds) / 1000));

    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    return `${Math.floor(minutes / 60)}h ago`;
  }

  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = value;
  }

  function setBar(id, value) {
    const element = byId(id);
    if (!element) return;

    const safe = Math.min(100, Math.max(0, number(value)));
    element.style.width = `${safe}%`;
    element.parentElement?.setAttribute("aria-valuenow", String(Math.round(safe)));
  }

  function renderStorage(name, storage) {
    const value = storage?.[name];

    if (!value) {
      setText(`pcStorage${name}Value`, "--");
      setBar(`pcStorage${name}Bar`, 0);
      return;
    }

    setText(
      `pcStorage${name}Value`,
      `${percent(value.usage_percent)} • ${usedTotal(
        value.used_bytes,
        value.total_bytes
      )}`
    );

    setBar(`pcStorage${name}Bar`, value.usage_percent);
  }

  function render(data) {
    latest = data;

    const online = Boolean(data?.online);
    const metrics = data?.metrics;

    card.classList.toggle("is-offline", !online);
    setText("pcOnlineState", online ? "Online" : "Offline");
    setText("pcUpdatedText", `Updated ${age(data?.age_ms)}`);

    if (!metrics) return;

    setText("pcCpuValue", percent(metrics.cpu?.usage_percent));
    setText("pcCpuTemp", temperature(metrics.cpu?.temp_c));
    setBar("pcCpuBar", metrics.cpu?.usage_percent);

    setText("pcGpuValue", percent(metrics.gpu?.usage_percent));
    setText("pcGpuTemp", temperature(metrics.gpu?.temp_c));
    setBar("pcGpuBar", metrics.gpu?.usage_percent);

    setText("pcGpuHotspot", temperature(metrics.gpu?.hotspot_c));
    setText("pcGpuMemoryTemp", temperature(metrics.gpu?.memory_temp_c));
    setText("pcGpuPower", watts(metrics.gpu?.power_w));

    const memory = metrics.memory || {};
    setText(
      "pcRamValue",
      `${percent(memory.usage_percent)} • ${usedTotal(
        memory.used_bytes,
        memory.total_bytes
      )}`
    );
    setBar("pcRamBar", memory.usage_percent);

    const vramUsed = number(metrics.gpu?.vram_used_bytes);
    const vramTotal = number(metrics.gpu?.vram_total_bytes);
    const vramPercent = vramTotal ? (vramUsed / vramTotal) * 100 : 0;

    setText(
      "pcVramValue",
      `${percent(vramPercent)} • ${usedTotal(vramUsed, vramTotal)}`
    );
    setBar("pcVramBar", vramPercent);

    renderStorage("Fedora", metrics.storage);
    renderStorage("Games", metrics.storage);
    renderStorage("Storage", metrics.storage);

    setText("pcUptime", duration(metrics.uptime_seconds));
  }

  async function refresh() {
    try {
      const response = await fetch(ENDPOINT, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Monitor returned ${response.status}`);
      }

      render(await response.json());
    } catch (error) {
      console.warn("PC monitor failed:", error);
      card.classList.add("is-offline");
      setText("pcOnlineState", "Unavailable");
      setText("pcUpdatedText", "Could not reach monitor");
    }
  }

  refresh();
  setInterval(refresh, REFRESH_MS);

  setInterval(() => {
    if (!latest) return;

    latest.age_ms = number(latest.age_ms) + 1000;
    setText("pcUpdatedText", `Updated ${age(latest.age_ms)}`);

    if (latest.age_ms > 25_000) {
      card.classList.add("is-offline");
      setText("pcOnlineState", "Offline");
    }
  }, 1000);
})();
