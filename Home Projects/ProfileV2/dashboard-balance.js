/* Expanded weather details and balanced dashboard side columns */
(() => {
  const WEATHER_ENDPOINT =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=-43.5321" +
    "&longitude=172.6362" +
    "&hourly=temperature_2m,precipitation_probability,weather_code" +
    "&daily=sunrise,sunset,daylight_duration,precipitation_probability_max" +
    "&timezone=Pacific%2FAuckland" +
    "&forecast_days=2";

  const REFRESH_MS = 15 * 60 * 1000;

  const byId = (id) => document.getElementById(id);

  const weatherIcons = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌧️",
    56: "🌧️",
    57: "🌧️",
    61: "🌧️",
    63: "🌧️",
    65: "🌧️",
    66: "🌧️",
    67: "🌧️",
    71: "🌨️",
    73: "🌨️",
    75: "❄️",
    77: "❄️",
    80: "🌦️",
    81: "🌧️",
    82: "🌧️",
    85: "🌨️",
    86: "🌨️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️"
  };

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatClock(localIso) {
    const time = String(localIso || "").split("T")[1] || "";
    const [hourText, minuteText] = time.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return "--:--";
    }

    const suffix = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
  }

  function formatDaylight(totalSeconds) {
    const seconds = Math.max(0, Math.round(number(totalSeconds)));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  }

  function christchurchNowKey() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Pacific/Auckland",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value])
    );

    return (
      `${values.year}-${values.month}-${values.day}` +
      `T${values.hour}:${values.minute}`
    );
  }

  function renderSunDetails(daily) {
    const sunrise = daily?.sunrise?.[0];
    const sunset = daily?.sunset?.[0];
    const daylight = daily?.daylight_duration?.[0];

    if (byId("weatherSunrise")) {
      byId("weatherSunrise").textContent = formatClock(sunrise);
    }

    if (byId("weatherSunset")) {
      byId("weatherSunset").textContent = formatClock(sunset);
    }

    if (byId("weatherDaylight")) {
      byId("weatherDaylight").textContent =
        formatDaylight(daylight);
    }
  }

  function renderHourly(hourly, daily) {
    const list = byId("weatherHourlyOutlook");
    if (!list) return;

    const times = Array.isArray(hourly?.time)
      ? hourly.time
      : [];
    const temperatures = hourly?.temperature_2m || [];
    const rainChances =
      hourly?.precipitation_probability || [];
    const weatherCodes = hourly?.weather_code || [];
    const nowKey = christchurchNowKey();

    let startIndex = times.findIndex((time) => time >= nowKey);

    if (startIndex < 0) {
      startIndex = Math.max(0, times.length - 6);
    }

    const entries = [];

    for (
      let index = startIndex;
      index < Math.min(times.length, startIndex + 6);
      index += 1
    ) {
      entries.push({
        time: times[index],
        temperature: number(temperatures[index]),
        rainChance: number(rainChances[index]),
        weatherCode: number(weatherCodes[index])
      });
    }

    list.replaceChildren();

    for (const entry of entries) {
      const item = document.createElement("li");
      item.className = "weather-hourly-item";

      const time = document.createElement("span");
      time.className = "weather-hourly-time";
      time.textContent = formatClock(entry.time);

      const icon = document.createElement("span");
      icon.className = "weather-hourly-icon";
      icon.textContent =
        weatherIcons[entry.weatherCode] || "🌤️";
      icon.setAttribute("aria-hidden", "true");

      const temperature = document.createElement("strong");
      temperature.textContent =
        `${Math.round(entry.temperature)}°`;

      const rain = document.createElement("small");
      rain.textContent =
        `💧 ${Math.round(entry.rainChance)}%`;

      item.append(time, icon, temperature, rain);
      list.appendChild(item);
    }

    const hourlyMaximum = entries.reduce(
      (maximum, entry) =>
        Math.max(maximum, entry.rainChance),
      0
    );

    const dailyMaximum = number(
      daily?.precipitation_probability_max?.[0]
    );

    const rainSummary = byId("weatherRainSummary");

    if (rainSummary) {
      rainSummary.textContent =
        `${Math.round(hourlyMaximum)}% next 6h` +
        ` • ${Math.round(dailyMaximum)}% today`;
    }
  }

  async function refreshExpandedWeather() {
    try {
      const response = await fetch(WEATHER_ENDPOINT, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Expanded weather returned ${response.status}`
        );
      }

      const payload = await response.json();

      renderSunDetails(payload.daily);
      renderHourly(payload.hourly, payload.daily);
    } catch (error) {
      console.warn("Expanded weather failed:", error);

      const list = byId("weatherHourlyOutlook");

      if (list) {
        list.replaceChildren();

        const item = document.createElement("li");
        item.className = "weather-hourly-unavailable";
        item.textContent = "Hourly outlook unavailable.";
        list.appendChild(item);
      }

      const rainSummary = byId("weatherRainSummary");

      if (rainSummary) {
        rainSummary.textContent = "Weather unavailable";
      }
    }
  }

  refreshExpandedWeather();
  setInterval(refreshExpandedWeather, REFRESH_MS);
})();

/* SPARKY_DESKTOP_VIEWPORT_FITTER_START */
(() => {
  const DESKTOP_MIN_WIDTH = 1081;
  const HORIZONTAL_MARGIN = 32;
  const VERTICAL_MARGIN = 24;

  const screen = document.querySelector(".profile-screen");
  const dashboard = document.querySelector(".profile-dashboard");

  if (!screen || !dashboard) return;

  let animationFrame = 0;

  function desktopMode() {
    return window.innerWidth >= DESKTOP_MIN_WIDTH;
  }

  function applyFit() {
    if (!desktopMode()) {
      dashboard.style.removeProperty("--dashboard-fit-scale");
      dashboard.removeAttribute("data-dashboard-scale");
      return;
    }

    /*
     * Measure with no scale applied. CSS transforms do not change the
     * dashboard's layout measurements, so this remains stable.
     */
    dashboard.style.setProperty("--dashboard-fit-scale", "1");

    const naturalWidth = Math.max(
      dashboard.offsetWidth,
      dashboard.scrollWidth,
      1
    );

    const naturalHeight = Math.max(
      dashboard.offsetHeight,
      dashboard.scrollHeight,
      1
    );

    const availableWidth = Math.max(
      1,
      window.innerWidth - HORIZONTAL_MARGIN
    );

    const availableHeight = Math.max(
      1,
      window.innerHeight - VERTICAL_MARGIN
    );

    const scale = Math.min(
      1,
      availableWidth / naturalWidth,
      availableHeight / naturalHeight
    );

    const roundedScale = Math.floor(scale * 1000) / 1000;

    dashboard.style.setProperty(
      "--dashboard-fit-scale",
      String(roundedScale)
    );

    dashboard.dataset.dashboardScale =
      roundedScale.toFixed(3);
  }

  function scheduleFit() {
    cancelAnimationFrame(animationFrame);

    animationFrame = requestAnimationFrame(() => {
      /*
       * A second frame lets game cards, artwork and chart canvases finish
       * their current layout before measuring.
       */
      animationFrame = requestAnimationFrame(applyFit);
    });
  }

  const dashboardObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(scheduleFit)
      : null;

  dashboardObserver?.observe(dashboard);

  const contentObserver = new MutationObserver(scheduleFit);

  contentObserver.observe(dashboard, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "class",
      "hidden",
      "src"
    ]
  });

  const entryObserver = new MutationObserver(scheduleFit);

  entryObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
  });

  dashboard.addEventListener("load", scheduleFit, true);
  window.addEventListener("resize", scheduleFit, {
    passive: true
  });

  document.fonts?.ready.then(scheduleFit);

  /*
   * These delayed checks catch Discord, game, Spotify and weather data
   * arriving shortly after the page opens.
   */
  [100, 500, 1200, 2500].forEach((delay) => {
    window.setTimeout(scheduleFit, delay);
  });

  scheduleFit();
})();
/* SPARKY_DESKTOP_VIEWPORT_FITTER_END */
