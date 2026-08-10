/* Live Fedora monitor with switchable 300s / 120s / 30s history */
(() => {
  const ENDPOINT =
    "https://sparky-pc-monitor.sparkyfoxer.workers.dev/api/status";
  const REFRESH_MS = 5000;
  const MAX_HISTORY_SECONDS = 300;
  const MAX_HISTORY_MS = MAX_HISTORY_SECONDS * 1000;
  const HISTORY_KEY = "sparky_pc_chart_history_300s_v4";
  const RANGE_KEY = "sparky_pc_chart_range_v1";
  const VALID_RANGES = new Set([300, 120, 30]);
  const PREVIEW_OFFLINE =
    new URLSearchParams(window.location.search).get("preview") ===
    "offline";

  const monitorCard = document.querySelector("#pcMonitorCard");
  const overviewCard = document.querySelector("#pcOverviewCard");

  if (!monitorCard || !overviewCard) return;

  let latest = null;
  let selectedSeconds = loadSelectedRange();
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

  function loadSelectedRange() {
    try {
      const value = Number(localStorage.getItem(RANGE_KEY));
      return VALID_RANGES.has(value) ? value : 120;
    } catch {
      return 120;
    }
  }

  function saveSelectedRange() {
    try {
      localStorage.setItem(RANGE_KEY, String(selectedSeconds));
    } catch {
      // Keep the selection for this page session only.
    }
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(
        sessionStorage.getItem(HISTORY_KEY) || "[]"
      );
      const cutoff = Date.now() - MAX_HISTORY_MS;

      return Array.isArray(parsed)
        ? parsed.filter((point) => number(point?.time) >= cutoff)
        : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // In-memory history still works.
    }
  }

  function addHistoryPoint(metrics) {
    const now = Date.now();

    history.push({
      time: now,
      cpuUsage: finite(metrics?.cpu?.usage_percent),
      gpuUsage: finite(metrics?.gpu?.usage_percent),
      cpuTemp: finite(metrics?.cpu?.temp_c),
      gpuTemp: finite(metrics?.gpu?.temp_c),
      gpuHotspot: finite(metrics?.gpu?.hotspot_c),
      gpuMemory: finite(metrics?.gpu?.memory_temp_c)
    });

    const cutoff = now - MAX_HISTORY_MS;

    history = history.filter(
      (point) => number(point.time) >= cutoff
    );

    saveHistory();
  }

  function installRangeButtons() {
    monitorCard
      .querySelectorAll(".pc-history-range-button")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const nextRange = Number(
            button.dataset.historySeconds
          );

          if (!VALID_RANGES.has(nextRange)) return;

          selectedSeconds = nextRange;
          saveSelectedRange();
          updateRangeButtons();
          drawCharts();
        });
      });

    updateRangeButtons();
  }

  function updateRangeButtons() {
    monitorCard
      .querySelectorAll(".pc-history-range-button")
      .forEach((button) => {
        const active =
          Number(button.dataset.historySeconds) ===
          selectedSeconds;

        button.classList.toggle("is-active", active);
        button.setAttribute(
          "aria-pressed",
          String(active)
        );
      });
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
    const height = Math.max(88, Math.round(rect.height || 96));
    const ratio = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    return { context, width, height };
  }

  function smoothSeries(data, key, mapX, mapY) {
    const alpha = 0.42;
    const segments = [];
    let segment = [];
    let smoothedValue = null;

    function finishSegment() {
      if (segment.length) segments.push(segment);
      segment = [];
      smoothedValue = null;
    }

    for (const point of data) {
      const rawValue = finite(point[key]);

      if (rawValue === null) {
        finishSegment();
        continue;
      }

      smoothedValue =
        smoothedValue === null
          ? rawValue
          : smoothedValue +
            alpha * (rawValue - smoothedValue);

      segment.push({
        x: mapX(point.time),
        y: mapY(smoothedValue)
      });
    }

    finishSegment();
    return segments;
  }

  function traceRoundedSeries(context, points) {
    if (!points.length) return;

    context.moveTo(points[0].x, points[0].y);

    if (points.length === 1) return;

    if (points.length === 2) {
      context.lineTo(points[1].x, points[1].y);
      return;
    }

    for (let index = 1; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const midpointX = (current.x + next.x) / 2;
      const midpointY = (current.y + next.y) / 2;

      context.quadraticCurveTo(
        current.x,
        current.y,
        midpointX,
        midpointY
      );
    }

    const last = points.at(-1);

    context.quadraticCurveTo(
      last.x,
      last.y,
      last.x,
      last.y
    );
  }

  function drawSeries(
    context,
    data,
    key,
    mapX,
    mapY,
    colour
  ) {
    const segments = smoothSeries(
      data,
      key,
      mapX,
      mapY
    );

    context.strokeStyle = colour;
    context.lineWidth = 2.1;
    context.lineJoin = "round";
    context.lineCap = "round";

    for (const segment of segments) {
      context.beginPath();
      traceRoundedSeries(context, segment);
      context.stroke();
    }
  }

  function setChartValue(id, value, suffix) {
    const element = byId(id);
    if (!element) return;

    const parsed = finite(value);

    element.textContent =
      parsed === null
        ? "Not reported"
        : `${Math.round(parsed)}${suffix}`;

    element
      .closest(".pc-chart-legend-item")
      ?.classList.toggle(
        "is-unavailable",
        parsed === null
      );
  }

  function drawChart(options) {
    const canvas = byId(options.canvasId);

    if (!(canvas instanceof HTMLCanvasElement)) return;

    const prepared = prepareCanvas(canvas);
    if (!prepared) return;

    const { context, width, height } = prepared;
    const left = 30;
    const right = 7;
    const top = 6;
    const bottom = 20;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const now = Date.now();
    const windowMs = selectedSeconds * 1000;
    const cutoff = now - windowMs;

    const visible = history.filter(
      (point) => number(point.time) >= cutoff
    );

    const mapX = (timestamp) =>
      left +
      Math.max(
        0,
        Math.min(1, (timestamp - cutoff) / windowMs)
      ) *
        plotWidth;

    const mapY = (value) =>
      top +
      (1 -
        Math.max(
          0,
          Math.min(
            1,
            (value - options.minValue) /
              (options.maxValue - options.minValue)
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

    for (const value of options.ticks) {
      const y = mapY(value);

      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(width - right, y);
      context.stroke();

      context.textAlign = "right";
      context.textBaseline = "middle";
      context.fillText(
        `${value}${options.tickSuffix}`,
        left - 4,
        y
      );
    }

    const halfRange = Math.round(selectedSeconds / 2);

    for (const [seconds, label] of [
      [-selectedSeconds, `-${selectedSeconds}s`],
      [-halfRange, `-${halfRange}s`],
      [0, "now"]
    ]) {
      const x = mapX(now + seconds * 1000);

      context.beginPath();
      context.moveTo(x, top);
      context.lineTo(x, height - bottom);
      context.stroke();

      context.textAlign =
        seconds === -selectedSeconds
          ? "left"
          : seconds === 0
            ? "right"
            : "center";
      context.textBaseline = "top";
      context.fillText(label, x, height - bottom + 5);
    }

    for (const item of options.series) {
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
        `Collecting ${selectedSeconds}s history…`,
        left + plotWidth / 2,
        top + plotHeight / 2
      );
    }

    const last = visible.at(-1) || {};

    for (const item of options.valueItems) {
      setChartValue(
        item.id,
        last[item.key],
        item.suffix
      );
    }
  }

  function drawCharts() {
    drawChart({
      canvasId: "pcCpuUsageChart",
      series: [
        {
          key: "cpuUsage",
          variable: "--pc-cpu-usage-line",
          fallback: "#ff71c8"
        }
      ],
      minValue: 0,
      maxValue: 100,
      ticks: [0, 25, 50, 75, 100],
      tickSuffix: "%",
      valueItems: [
        {
          key: "cpuUsage",
          id: "pcCpuValue",
          suffix: "%"
        }
      ]
    });

    drawChart({
      canvasId: "pcGpuUsageChart",
      series: [
        {
          key: "gpuUsage",
          variable: "--pc-gpu-usage-line",
          fallback: "#b68cff"
        }
      ],
      minValue: 0,
      maxValue: 100,
      ticks: [0, 25, 50, 75, 100],
      tickSuffix: "%",
      valueItems: [
        {
          key: "gpuUsage",
          id: "pcGpuValue",
          suffix: "%"
        }
      ]
    });

    drawChart({
      canvasId: "pcCpuTempChart",
      series: [
        {
          key: "cpuTemp",
          variable: "--pc-cpu-temp-line",
          fallback: "#ff9bd8"
        }
      ],
      minValue: 20,
      maxValue: 110,
      ticks: [20, 40, 60, 80, 100],
      tickSuffix: "°",
      valueItems: [
        {
          key: "cpuTemp",
          id: "pcCpuChartValue",
          suffix: "°C"
        }
      ]
    });

    drawChart({
      canvasId: "pcGpuTempChart",
      series: [
        {
          key: "gpuTemp",
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
      minValue: 20,
      maxValue: 110,
      ticks: [20, 40, 60, 80, 100],
      tickSuffix: "°",
      valueItems: [
        {
          key: "gpuTemp",
          id: "pcGpuChartValue",
          suffix: "°C"
        },
        {
          key: "gpuHotspot",
          id: "pcGpuHotspotChartValue",
          suffix: "°C"
        },
        {
          key: "gpuMemory",
          id: "pcGpuMemoryChartValue",
          suffix: "°C"
        }
      ]
    });
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

  installRangeButtons();

  if (PREVIEW_OFFLINE) {
    monitorCard.classList.add(
      "is-offline",
      "pc-offline-preview"
    );
    overviewCard.classList.add("is-offline");

    setText("pcOnlineState", "Offline");
    setText("pcUpdatedText", "PC is currently offline");
    setText("pcUptime", "--");
  } else {
    refresh();
    setInterval(refresh, REFRESH_MS);

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
  }

  setInterval(drawCharts, 1000);

  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(drawCharts);

    [
      byId("pcCpuUsageChart"),
      byId("pcGpuUsageChart"),
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
