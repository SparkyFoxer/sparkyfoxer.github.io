/* Live Fedora PC monitor with a 90-second browser-side history */
(() => {
  const ENDPOINT =
    "https://sparky-pc-monitor.sparkyfoxer.workers.dev/api/status";
  const REFRESH_MS = 5000;
  const WINDOW_MS = 90000;
  const STORAGE_KEY = "sparky_pc_history_90s_v1";

  const card = document.querySelector("#pcMonitorCard");
  if (!card) return;

  let latest = null;
  let points = loadPoints();

  const $ = (id) => document.getElementById(id);

  function num(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function finite(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function firstFinite(...values) {
    for (const value of values) {
      const parsed = finite(value);
      if (parsed !== null) return parsed;
    }
    return null;
  }

  function pct(value) {
    return `${Math.round(num(value))}%`;
  }

  function temp(value) {
    const parsed = finite(value);
    return parsed === null ? "--°C" : `${Math.round(parsed)}°C`;
  }

  function watts(value) {
    const parsed = finite(value);
    return parsed === null ? "-- W" : `${Math.round(parsed)} W`;
  }

  function gib(bytes) {
    return num(bytes) / 1024 ** 3;
  }

  function usedTotal(used, total) {
    const totalGiB = gib(total);
    if (!totalGiB) return "-- / --";
    return `${gib(used).toFixed(1)} / ${totalGiB.toFixed(0)} GB`;
  }

  function duration(totalSeconds) {
    const seconds = Math.max(0, Math.floor(num(totalSeconds)));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function age(milliseconds) {
    const seconds = Math.max(0, Math.floor(num(milliseconds) / 1000));
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }

  function text(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function bar(id, value) {
    const element = $(id);
    if (!element) return;
    const safe = Math.min(100, Math.max(0, num(value)));
    element.style.width = `${safe}%`;
    element.parentElement?.setAttribute(
      "aria-valuenow",
      String(Math.round(safe))
    );
  }

  function cpuHotspot(metrics) {
    return firstFinite(
      metrics?.cpu?.hotspot_c,
      metrics?.cpu?.ccd_temp_c,
      metrics?.cpu?.ccd1_temp_c,
      metrics?.cpu?.tdie_c
    );
  }

  function renderStorage(name, storage) {
    const value = storage?.[name];
    if (!value) {
      text(`pcStorage${name}Value`, "--");
      bar(`pcStorage${name}Bar`, 0);
      return;
    }

    text(
      `pcStorage${name}Value`,
      `${pct(value.usage_percent)} • ` +
      usedTotal(value.used_bytes, value.total_bytes)
    );
    bar(`pcStorage${name}Bar`, value.usage_percent);
  }

  function loadPoints() {
    try {
      const parsed = JSON.parse(
        sessionStorage.getItem(STORAGE_KEY) || "[]"
      );
      const cutoff = Date.now() - WINDOW_MS;
      return Array.isArray(parsed)
        ? parsed.filter((point) => num(point?.time) >= cutoff)
        : [];
    } catch {
      return [];
    }
  }

  function storePoints() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(points));
    } catch {
      // Keep using in-memory history.
    }
  }

  function addPoint(metrics) {
    const now = Date.now();

    points.push({
      time: now,
      cpu: finite(metrics?.cpu?.temp_c),
      cpuHotspot: cpuHotspot(metrics),
      gpu: finite(metrics?.gpu?.temp_c),
      gpuHotspot: finite(metrics?.gpu?.hotspot_c),
      gpuMemory: finite(metrics?.gpu?.memory_temp_c)
    });

    const cutoff = now - WINDOW_MS;
    points = points.filter((point) => num(point.time) >= cutoff);
    storePoints();
  }

  function css(name, fallback) {
    return getComputedStyle(card).getPropertyValue(name).trim() || fallback;
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(220, Math.round(rect.width || 280));
    const height = Math.max(150, Math.round(rect.height || 165));
    const ratio = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    return { context, width, height };
  }

  function drawSeries(context, data, key, mapX, mapY, colour) {
    context.beginPath();
    context.strokeStyle = colour;
    context.lineWidth = 2.2;
    context.lineJoin = "round";
    context.lineCap = "round";

    let open = false;

    for (const point of data) {
      const value = finite(point[key]);
      if (value === null) {
        open = false;
        continue;
      }

      const x = mapX(point.time);
      const y = mapY(value);

      if (!open) {
        context.moveTo(x, y);
        open = true;
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
  }

  function drawChart(canvasId, series) {
    const canvas = $(canvasId);
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const prepared = prepareCanvas(canvas);
    if (!prepared) return;

    const { context, width, height } = prepared;
    const left = 31;
    const right = 8;
    const top = 10;
    const bottom = 23;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    const visible = points.filter((point) => num(point.time) >= cutoff);

    const mapX = (timestamp) =>
      left + Math.max(0, Math.min(1, (timestamp - cutoff) / WINDOW_MS)) *
      plotWidth;
    const mapY = (value) =>
      top + (1 - Math.max(0, Math.min(1, (value - 20) / 80))) *
      plotHeight;

    const grid = css("--pc-chart-grid", "rgba(255,255,255,.11)");
    const muted = css("--pc-chart-muted", "rgba(255,246,255,.62)");

    context.font = '10px Inter, system-ui, sans-serif';
    context.strokeStyle = grid;
    context.fillStyle = muted;
    context.lineWidth = 1;

    for (const value of [20, 40, 60, 80, 100]) {
      const y = mapY(value);
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(width - right, y);
      context.stroke();
      context.textAlign = "right";
      context.textBaseline = "middle";
      context.fillText(`${value}°`, left - 5, y);
    }

    for (const mark of [
      [-90, "-90s"],
      [-60, "-60s"],
      [-30, "-30s"],
      [0, "now"]
    ]) {
      const x = mapX(now + mark[0] * 1000);
      context.beginPath();
      context.moveTo(x, top);
      context.lineTo(x, height - bottom);
      context.stroke();
      context.textAlign =
        mark[0] === -90 ? "left" : mark[0] === 0 ? "right" : "center";
      context.textBaseline = "top";
      context.fillText(mark[1], x, height - bottom + 6);
    }

    for (const item of series) {
      drawSeries(
        context,
        visible,
        item.key,
        mapX,
        mapY,
        css(item.variable, item.fallback)
      );
    }

    if (visible.length < 2) {
      context.fillStyle = muted;
      context.font = '12px Inter, system-ui, sans-serif';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        "Collecting 90-second history…",
        left + plotWidth / 2,
        top + plotHeight / 2
      );
    }
  }

  function legend(id, value) {
    const element = $(id);
    if (!element) return;

    const parsed = finite(value);
    element.textContent =
      parsed === null ? "Not reported" : `${Math.round(parsed)}°C`;

    element.closest(".pc-chart-legend-item")
      ?.classList.toggle("is-unavailable", parsed === null);
  }

  function drawCharts() {
    drawChart("pcCpuTempChart", [
      { key: "cpu", variable: "--pc-cpu-line", fallback: "#ff71c8" },
      {
        key: "cpuHotspot",
        variable: "--pc-cpu-hotspot-line",
        fallback: "#b68cff"
      }
    ]);

    drawChart("pcGpuTempChart", [
      { key: "gpu", variable: "--pc-gpu-line", fallback: "#69d7ff" },
      {
        key: "gpuHotspot",
        variable: "--pc-gpu-hotspot-line",
        fallback: "#ff9f6e"
      },
      {
        key: "gpuMemory",
        variable: "--pc-gpu-memory-line",
        fallback: "#7bf1a8"
      }
    ]);

    const last = points.at(-1) || {};
    legend("pcCpuChartValue", last.cpu);
    legend("pcCpuHotspotChartValue", last.cpuHotspot);
    legend("pcGpuChartValue", last.gpu);
    legend("pcGpuHotspotChartValue", last.gpuHotspot);
    legend("pcGpuMemoryChartValue", last.gpuMemory);
  }

  function render(data) {
    latest = data;
    const online = Boolean(data?.online);
    const metrics = data?.metrics;

    card.classList.toggle("is-offline", !online);
    text("pcOnlineState", online ? "Online" : "Offline");
    text("pcUpdatedText", `Updated ${age(data?.age_ms)}`);

    if (!metrics) return;

    const hotspot = cpuHotspot(metrics);

    text("pcCpuValue", pct(metrics.cpu?.usage_percent));
    text("pcCpuTemp", temp(metrics.cpu?.temp_c));
    text("pcCpuHotspot", temp(hotspot));
    bar("pcCpuBar", metrics.cpu?.usage_percent);

    text("pcGpuValue", pct(metrics.gpu?.usage_percent));
    text("pcGpuTemp", temp(metrics.gpu?.temp_c));
    text("pcGpuHotspot", temp(metrics.gpu?.hotspot_c));
    text("pcGpuMemoryTemp", temp(metrics.gpu?.memory_temp_c));
    text("pcGpuPower", watts(metrics.gpu?.power_w));
    bar("pcGpuBar", metrics.gpu?.usage_percent);

    const memory = metrics.memory || {};
    text(
      "pcRamValue",
      `${pct(memory.usage_percent)} • ` +
      usedTotal(memory.used_bytes, memory.total_bytes)
    );
    bar("pcRamBar", memory.usage_percent);

    const vramUsed = num(metrics.gpu?.vram_used_bytes);
    const vramTotal = num(metrics.gpu?.vram_total_bytes);
    const vramPercent = vramTotal ? vramUsed / vramTotal * 100 : 0;
    text(
      "pcVramValue",
      `${pct(vramPercent)} • ${usedTotal(vramUsed, vramTotal)}`
    );
    bar("pcVramBar", vramPercent);

    renderStorage("Fedora", metrics.storage);
    renderStorage("Games", metrics.storage);
    renderStorage("Storage", metrics.storage);
    text("pcUptime", duration(metrics.uptime_seconds));

    addPoint(metrics);
    drawCharts();
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
      text("pcOnlineState", "Unavailable");
      text("pcUpdatedText", "Could not reach monitor");
      drawCharts();
    }
  }

  refresh();
  setInterval(refresh, REFRESH_MS);

  setInterval(() => {
    if (!latest) return;

    latest.age_ms = num(latest.age_ms) + 1000;
    text("pcUpdatedText", `Updated ${age(latest.age_ms)}`);

    if (latest.age_ms > 25000) {
      card.classList.add("is-offline");
      text("pcOnlineState", "Offline");
    }
  }, 1000);

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(drawCharts);
    ["pcCpuTempChart", "pcGpuTempChart"]
      .map($)
      .filter(Boolean)
      .forEach((canvas) => observer.observe(canvas));
  }

  window.addEventListener("resize", drawCharts, { passive: true });
  drawCharts();
})();
