/* Compact local weather widget for Christchurch */
(() => {
  const LATITUDE = -43.5321;
  const LONGITUDE = 172.6362;
  const TIMEZONE = "Pacific/Auckland";

  const WEATHER_URL =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${LATITUDE}` +
    `&longitude=${LONGITUDE}` +
    "&current=" +
      "temperature_2m," +
      "apparent_temperature," +
      "relative_humidity_2m," +
      "weather_code," +
      "wind_speed_10m" +
    "&daily=" +
      "weather_code," +
      "temperature_2m_max," +
      "temperature_2m_min," +
      "precipitation_probability_max" +
    `&timezone=${encodeURIComponent(TIMEZONE)}` +
    "&forecast_days=3";

  const nodes = {
    card: document.querySelector("#localWeatherCard"),
    location: document.querySelector("#weatherLocation"),
    icon: document.querySelector("#weatherIcon"),
    temperature: document.querySelector("#weatherTemperature"),
    condition: document.querySelector("#weatherCondition"),
    feels: document.querySelector("#weatherFeels"),
    humidity: document.querySelector("#weatherHumidity"),
    wind: document.querySelector("#weatherWind"),
    range: document.querySelector("#weatherRange"),
    forecast: document.querySelector("#weatherForecast"),
    updated: document.querySelector("#weatherUpdated")
  };

  if (!nodes.card) return;

  function weatherDescription(code) {
    const conditions = {
      0: ["Clear", "☀️"],
      1: ["Mostly clear", "🌤️"],
      2: ["Partly cloudy", "⛅"],
      3: ["Overcast", "☁️"],
      45: ["Foggy", "🌫️"],
      48: ["Icy fog", "🌫️"],
      51: ["Light drizzle", "🌦️"],
      53: ["Drizzle", "🌦️"],
      55: ["Heavy drizzle", "🌧️"],
      56: ["Freezing drizzle", "🌧️"],
      57: ["Heavy freezing drizzle", "🌧️"],
      61: ["Light rain", "🌦️"],
      63: ["Rain", "🌧️"],
      65: ["Heavy rain", "🌧️"],
      66: ["Freezing rain", "🌧️"],
      67: ["Heavy freezing rain", "🌧️"],
      71: ["Light snow", "🌨️"],
      73: ["Snow", "🌨️"],
      75: ["Heavy snow", "❄️"],
      77: ["Snow grains", "❄️"],
      80: ["Light showers", "🌦️"],
      81: ["Showers", "🌧️"],
      82: ["Heavy showers", "🌧️"],
      85: ["Snow showers", "🌨️"],
      86: ["Heavy snow showers", "🌨️"],
      95: ["Thunderstorm", "⛈️"],
      96: ["Thunderstorm with hail", "⛈️"],
      99: ["Severe thunderstorm", "⛈️"]
    };

    return conditions[code] || ["Unknown conditions", "🌡️"];
  }

  function rounded(value, fallback = "--") {
    const number = Number(value);

    return Number.isFinite(number)
      ? Math.round(number)
      : fallback;
  }

  function weekday(dateValue, index) {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";

    const date = new Date(`${dateValue}T12:00:00`);

    return new Intl.DateTimeFormat("en-NZ", {
      weekday: "short",
      timeZone: TIMEZONE
    }).format(date);
  }

  function renderForecast(daily) {
    nodes.forecast.replaceChildren();

    const dates = daily?.time || [];

    if (!dates.length) {
      const item = document.createElement("li");
      item.textContent = "Forecast unavailable.";
      nodes.forecast.appendChild(item);
      return;
    }

    dates.forEach((date, index) => {
      const code = Number(daily.weather_code?.[index]);
      const [, icon] = weatherDescription(code);

      const maximum = rounded(
        daily.temperature_2m_max?.[index]
      );

      const minimum = rounded(
        daily.temperature_2m_min?.[index]
      );

      const rainChance = rounded(
        daily.precipitation_probability_max?.[index],
        0
      );

      const item = document.createElement("li");
      item.className = "weather-forecast-item";

      const day = document.createElement("span");
      day.className = "weather-forecast-day";
      day.textContent = weekday(date, index);

      const weatherIcon = document.createElement("span");
      weatherIcon.className = "weather-forecast-icon";
      weatherIcon.textContent = icon;

      const rain = document.createElement("span");
      rain.className = "weather-forecast-rain";
      rain.textContent = `💧 ${rainChance}%`;

      const temperatures = document.createElement("span");
      temperatures.className = "weather-forecast-temperatures";
      temperatures.textContent = `${maximum}° / ${minimum}°`;

      item.append(day, weatherIcon, rain, temperatures);
      nodes.forecast.appendChild(item);
    });
  }

  function renderWeather(data) {
    const current = data.current || {};
    const daily = data.daily || {};

    const [condition, icon] = weatherDescription(
      Number(current.weather_code)
    );

    nodes.icon.textContent = icon;

    nodes.temperature.textContent =
      `${rounded(current.temperature_2m)}°`;

    nodes.condition.textContent = condition;

    nodes.feels.textContent =
      `Feels like ${rounded(current.apparent_temperature)}°`;

    nodes.humidity.textContent =
      `${rounded(current.relative_humidity_2m)}%`;

    nodes.wind.textContent =
      `${rounded(current.wind_speed_10m)} km/h`;

    nodes.range.textContent =
      `${rounded(daily.temperature_2m_max?.[0])}° / ` +
      `${rounded(daily.temperature_2m_min?.[0])}°`;

    nodes.updated.textContent =
      `Updated ${new Intl.DateTimeFormat("en-NZ", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: TIMEZONE
      }).format(new Date())}`;

    renderForecast(daily);
  }

  function renderError() {
    nodes.icon.textContent = "🌡️";
    nodes.temperature.textContent = "--°";
    nodes.condition.textContent = "Weather unavailable";
    nodes.feels.textContent = "Try again shortly";
    nodes.forecast.replaceChildren();

    const item = document.createElement("li");
    item.textContent = "Could not load the forecast.";
    nodes.forecast.appendChild(item);
  }

  async function loadWeather() {
    try {
      const response = await fetch(WEATHER_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Weather API returned ${response.status}`
        );
      }

      const data = await response.json();
      renderWeather(data);
    } catch (error) {
      console.warn("Weather failed:", error);
      renderError();
    }
  }

  loadWeather();

  // Refresh every fifteen minutes.
  setInterval(loadWeather, 15 * 60 * 1000);
})();
