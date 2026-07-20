/* Subtle weather-reactive background ambience */
(() => {
  const STORAGE_KEY = "sparky_weather_ambience_v1";
  const ambience = document.querySelector("#weatherAmbience");
  const validKinds = new Set(["clear", "clouds", "rain", "snow", "storm"]);

  function kindFromCode(value) {
    const code = Number(value);

    if (code === 0 || code === 1) return "clear";
    if ([2, 3, 45, 48].includes(code)) return "clouds";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
    if ([95, 96, 99].includes(code)) return "storm";
    if (
      (code >= 51 && code <= 67) ||
      (code >= 80 && code <= 82)
    ) {
      return "rain";
    }

    return "clouds";
  }

  function setKind(value) {
    const kind = validKinds.has(value) ? value : "clear";

    document.body.dataset.weatherAmbience = kind;

    if (ambience) {
      ambience.dataset.weather = kind;
    }

    try {
      localStorage.setItem(STORAGE_KEY, kind);
    } catch {
      // The visual still works when browser storage is unavailable.
    }
  }

  function savedKind() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "clear";
    } catch {
      return "clear";
    }
  }

  window.SparkyWeatherAmbience = {
    setFromCode(code) {
      setKind(kindFromCode(code));
    }
  };

  setKind(savedKind());
})();
