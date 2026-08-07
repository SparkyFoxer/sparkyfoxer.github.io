/* Distributed live Fedora monitor with 90-second CPU/GPU charts */
(() => {
  const ENDPOINT =
    "https://sparky-pc-monitor.sparkyfoxer.workers.dev/api/status";
  const REFRESH_MS = 5000;
  const WINDOW_MS = 90000;
  const HISTORY_KEY = "sparky_pc_chart_history_90s_v3";

  const monitorCard = document.querySelector("#pcMonitorCard");
  const overviewCard = document.querySelector("#pcOverviewCard");

  if (!monitorCard || !overviewCard) return;

  let latest = null;
  let history = loadHistory();

  const byId = (id) => document.getElementById(id);

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function finite(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function percent(value) {
    return `${Math.round(number(value))}%`;
  }

  function temperature(value) {
    const parsed = finite(value);
    return parsed === null ? "--°C" : `${Math.round(parsed)}°C`;
  }

  function watts(value) {
    const parsed = finite(value);
    return parsed === null ? "-- W" : `${Math.round(parsed)} W`;
  }

  function gibibytes(bytes) {
    return number(bytes) / 1024 ** 3;
  }

  function usedTotal(used, total) {
    const totalGiB = gibibytes(total);

    if (!totalGiB) return "-- / --";

    return (
      `${gibibytes(used).toFixed(1)} / ` +
      `${totalGiB.toFixed(0)} GB`
    );
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
    const seconds = Math.max(
      0,
      Math.floor(number(milliseconds) / 1000)
    );

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
    element.parentElement?.setAttribute(
      "aria-valuenow",
      String(Math.round(safe))
    );
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(
        sessionStorage.getItem(HISTORY_KEY) || "[]"
      );
      const cutoff = Date.now() - WINDOW_MS;

      return Array.isArray(parsed)
        ? parsed.filter((point) => number(point?.time) >= cutoff)
        : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
      );
    } catch {
      // The charts can still use in-memory history.
    }
  }

  function addHistoryPoint(metrics) {
    const now = Date.now();

    history.push({
      time: now,
      cpu: finite(metrics?.cpu?.temp_c),
      gpu: finite(metrics?.gpu?.temp_c),
      gpuHotspot: finite(metrics?.gpu?.hotspot_c),
      gpuMemory: finite(metrics?.gpu?.memory_temp_c)
    });

    const cutoff = now - WINDOW_MS;

    history = history.filter(
      (point) => number(point.time) >= cutoff
    );

    saveHistory();
  }

  function cssValue(name, fallback) {
    return (
      getComputedStyle(monitorCard)
        .getPropertyValue(name)
        .trim() ||
      fallback
    );
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(220, Math.round(rect.width || 270));
    const height = Math.max(96, Math.round(rect.height || 106));
    const ratio = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    return { context, width, height };
  }

  function drawSeries(
    context,
    data,
    key,
    mapX,
    mapY,
    colour
  ) {
    context.beginPath();
    context.strokeStyle = colour;
    context.lineWidth = 2.15;
    context.lineJoin = "round";
    context.lineCap = "round";

    let started = false;

    for (const point of data) {
      const value = finite(point[key]);

      if (value === null) {
        started = false;
        continue;
      }

      const x = mapX(point.time);
      const y = mapY(value);

      if (!started) {
        context.moveTo(x, y);
        started = true;
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
  }

  function drawChart(canvasId, series, legendItems) {
    const canvas = byId(canvasId);

    if (!(canvas instanceof HTMLCanvasElement)) return;

    const prepared = prepareCanvas(canvas);
    if (!prepared) return;

    const { context, width, height } = prepared;
    const left = 29;
    const right = 7;
    const top = 6;
    const bottom = 20;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const now = Date.now();
    const cutoff = now - WINDOW_MS;

    const visible = history.filter(
      (point) => number(point.time) >= cutoff
    );

    const minTemp = 20;
    const maxTemp = 110;

    const mapX = (timestamp) =>
      left +
      Math.max(
        0,
        Math.min(1, (timestamp - cutoff) / WINDOW_MS)
      ) *
        plotWidth;

    const mapY = (value) =>
      top +
      (1 -
        Math.max(
          0,
          Math.min(
            1,
            (value - minTemp) / (maxTemp - minTemp)
          )
        )) *
        plotHeight;

    const grid = cssValue(
      "--pc-chart-grid",
      "rgba(255,255,255,.1)"
    );
    const muted = cssValue(
      "--pc-chart-muted",
      "rgba(255,246,255,.62)"
    );

    context.font = '9px Inter, system-ui, sans-serif';
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
      context.fillText(`${value}°`, left - 4, y);
    }

    for (const [seconds, label] of [
      [-90, "-90s"],
      [-45, "-45s"],
      [0, "now"]
    ]) {
      const x = mapX(now + seconds * 1000);

      context.beginPath();
      context.moveTo(x, top);
      context.lineTo(x, height - bottom);
      context.stroke();

      context.textAlign =
        seconds === -90
          ? "left"
          : seconds === 0
            ? "right"
            : "center";
      context.textBaseline = "top";
      context.fillText(label, x, height - bottom + 5);
    }

    for (const item of series) {
      drawSeries(
        context,
        visible,
        item.key,
        mapX,
        mapY,
        cssValue(item.variable, item.fallback)
      );
    }

    if (visible.length < 2) {
      context.fillStyle = muted;
      context.font = '10px Inter, system-ui, sans-serif';
      context.textAlign = "center";
      context.textBaseline = "middle";

      context.fillText(
        "Collecting history…",
        left + plotWidth / 2,
        top + plotHeight / 2
      );
    }

    const last = visible.at(-1) || {};

    for (const item of legendItems) {
      setLegend(item.id, last[item.key]);
    }
  }

  function setLegend(id, value) {
    const element = byId(id);
    if (!element) return;

    const parsed = finite(value);

    element.textContent =
      parsed === null
        ? "Not reported"
        : `${Math.round(parsed)}°C`;

    element
      .closest(".pc-chart-legend-item")
      ?.classList.toggle(
        "is-unavailable",
        parsed === null
      );
  }

  function drawCharts() {
    drawChart(
      "pcCpuTempChart",
      [
        {
          key: "cpu",
          variable: "--pc-cpu-line",
          fallback: "#ff71c8"
        }
      ],
      [
        {
          key: "cpu",
          id: "pcCpuChartValue"
        }
      ]
    );

    drawChart(
      "pcGpuTempChart",
      [
        {
          key: "gpu",
          variable: "--pc-gpu-line",
          fallback: "#b68cff"
        },
        {
          key: "gpuHotspot",
          variable: "--pc-gpu-hotspot-line",
          fallback: "#ff71c8"
        },
        {
          key: "gpuMemory",
          variable: "--pc-gpu-memory-line",
          fallback: "#79c8ff"
        }
      ],
      [
        {
          key: "gpu",
          id: "pcGpuChartValue"
        },
        {
          key: "gpuHotspot",
          id: "pcGpuHotspotChartValue"
        },
        {
          key: "gpuMemory",
          id: "pcGpuMemoryChartValue"
        }
      ]
    );
  }

  function render(data) {
    latest = data;

    const online = Boolean(data?.online);
    const metrics = data?.metrics;

    monitorCard.classList.toggle("is-offline", !online);
    overviewCard.classList.toggle("is-offline", !online);

    setText("pcOnlineState", online ? "Online" : "Offline");
    setText("pcUpdatedText", `Updated ${age(data?.age_ms)}`);

    if (!metrics) return;

    setText(
      "pcCpuValue",
      percent(metrics.cpu?.usage_percent)
    );
    setText(
      "pcCpuTemp",
      temperature(metrics.cpu?.temp_c)
    );
    setBar("pcCpuBar", metrics.cpu?.usage_percent);

    setText(
      "pcGpuValue",
      percent(metrics.gpu?.usage_percent)
    );
    setText(
      "pcGpuTemp",
      temperature(metrics.gpu?.temp_c)
    );
    setText(
      "pcGpuHotspot",
      temperature(metrics.gpu?.hotspot_c)
    );
    setText(
      "pcGpuMemoryTemp",
      temperature(metrics.gpu?.memory_temp_c)
    );
    setText(
      "pcGpuPower",
      watts(metrics.gpu?.power_w)
    );
    setBar("pcGpuBar", metrics.gpu?.usage_percent);

    const memory = metrics.memory || {};

    setText(
      "pcRamValue",
      `${percent(memory.usage_percent)} • ` +
        usedTotal(
          memory.used_bytes,
          memory.total_bytes
        )
    );
    setBar("pcRamBar", memory.usage_percent);

    const vramUsed = number(
      metrics.gpu?.vram_used_bytes
    );
    const vramTotal = number(
      metrics.gpu?.vram_total_bytes
    );
    const vramPercent = vramTotal
      ? (vramUsed / vramTotal) * 100
      : 0;

    setText(
      "pcVramValue",
      `${percent(vramPercent)} • ` +
        usedTotal(vramUsed, vramTotal)
    );
    setBar("pcVramBar", vramPercent);

    setText(
      "pcUptime",
      duration(metrics.uptime_seconds)
    );

    addHistoryPoint(metrics);
    drawCharts();
  }

  async function refresh() {
    try {
      const response = await fetch(ENDPOINT, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Monitor returned ${response.status}`
        );
      }

      render(await response.json());
    } catch (error) {
      console.warn("PC monitor failed:", error);

      monitorCard.classList.add("is-offline");
      overviewCard.classList.add("is-offline");

      setText("pcOnlineState", "Unavailable");
      setText(
        "pcUpdatedText",
        "Could not reach monitor"
      );

      drawCharts();
    }
  }

  refresh();
  setInterval(refresh, REFRESH_MS);
  setInterval(drawCharts, 1000);

  setInterval(() => {
    if (!latest) return;

    latest.age_ms = number(latest.age_ms) + 1000;

    setText(
      "pcUpdatedText",
      `Updated ${age(latest.age_ms)}`
    );

    if (latest.age_ms > 25000) {
      monitorCard.classList.add("is-offline");
      overviewCard.classList.add("is-offline");
      setText("pcOnlineState", "Offline");
    }
  }, 1000);

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(drawCharts);

    [
      byId("pcCpuTempChart"),
      byId("pcGpuTempChart")
    ]
      .filter(Boolean)
      .forEach((canvas) => observer.observe(canvas));
  }

  window.addEventListener("resize", drawCharts, {
    passive: true
  });

  drawCharts();
})();
