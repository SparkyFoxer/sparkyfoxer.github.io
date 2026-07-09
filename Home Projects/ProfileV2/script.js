const CONFIG = {
  discordUserId: "692126247458832455",
  siteCreated: "2026-07-10T00:00:00+12:00",
  location: "New Zealand",
  viewCounterUrl: "https://api.counterapi.dev/v1/sparkyfoxer/profilev2/up"
};

const enterScreen = document.querySelector("#enterScreen");
const profileScreen = document.querySelector("#profileScreen");
const enterButton = document.querySelector("#enterButton");
const muteButton = document.querySelector("#muteButton");
const audio = document.querySelector("#bgAudio");
const statusDot = document.querySelector("#statusDot");
const discordStatus = document.querySelector("#discordStatus");
const discordActivity = document.querySelector("#discordActivity");
const discordElapsed = document.querySelector("#discordElapsed");
const siteAge = document.querySelector("#siteAge");
const viewCount = document.querySelector("#viewCount");
const locationText = document.querySelector("#locationText");

let activeActivityStart = null;
let activeActivityLabel = "";

enterButton.addEventListener("click", async () => {
  enterScreen.classList.add("hidden");
  profileScreen.classList.remove("hidden");

  try {
    audio.volume = 0.35;
    await audio.play();
  } catch {
    muteButton.textContent = "play audio";
  }
});

muteButton.addEventListener("click", async () => {
  if (audio.paused) {
    await audio.play();
    muteButton.textContent = "mute";
    return;
  }

  audio.pause();
  muteButton.textContent = "play audio";
});

function timeAgo(dateInput) {
  const date = new Date(dateInput);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];

  for (const [name, amount] of units) {
    const value = Math.floor(seconds / amount);

    if (value >= 1) {
      return `${value} ${name}${value === 1 ? "" : "s"} ago`;
    }
  }

  return "just now";
}

function formatDuration(ms) {
  if (!ms || ms < 0) {
    return "";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function parseTimestamp(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function setSiteInfo() {
  siteAge.textContent = timeAgo(CONFIG.siteCreated);
  locationText.textContent = CONFIG.location;
}

function updateActivityTimer() {
  if (!discordElapsed) {
    return;
  }

  if (!activeActivityStart) {
    discordElapsed.textContent = "No activity timer.";
    return;
  }

  discordElapsed.textContent = `${activeActivityLabel} for ${formatDuration(Date.now() - activeActivityStart)}`;
}

function getActivityPrefix(type) {
  const prefixes = {
    0: "Playing",
    1: "Streaming",
    2: "Listening to",
    3: "Watching",
    4: "Status",
    5: "Competing in"
  };

  return prefixes[type] || "Doing";
}

function pickBestActivity(data) {
  if (data.listening_to_spotify && data.spotify) {
    return {
      title: `Listening to ${data.spotify.song}`,
      subtitle: `by ${data.spotify.artist}`,
      start: parseTimestamp(data.spotify.timestamps?.start),
      timerLabel: "Listening"
    };
  }

  const activities = data.activities || [];

  const mainActivity = activities.find(activity => {
    return activity.type === 0 || activity.type === 2 || activity.type === 3 || activity.type === 5;
  });

  if (mainActivity) {
    const prefix = getActivityPrefix(mainActivity.type);
    const extra = [mainActivity.details, mainActivity.state].filter(Boolean).join(" • ");

    return {
      title: `${prefix} ${mainActivity.name}`,
      subtitle: extra || "Activity shown on Discord.",
      start: parseTimestamp(mainActivity.timestamps?.start),
      timerLabel: prefix
    };
  }

  const customStatus = activities.find(activity => activity.type === 4);

  if (customStatus) {
    return {
      title: customStatus.state || customStatus.name || "Custom status",
      subtitle: "Discord custom status.",
      start: null,
      timerLabel: "Status"
    };
  }

  return null;
}

async function loadDiscordPresence() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discordUserId}`, {
      cache: "no-store"
    });

    const json = await res.json();

    if (!json.success) {
      throw new Error("Lanyard failed");
    }

    const data = json.data;
    const status = data.discord_status || "offline";
    const activity = pickBestActivity(data);

    statusDot.className = `status-dot ${status}`;
    discordStatus.textContent = status;

    if (activity) {
      discordActivity.textContent = `${activity.title} ${activity.subtitle ? "ꜱ " + activity.subtitle : ""}`;
      activeActivityStart = activity.start;
      activeActivityLabel = activity.timerLabel;
      updateActivityTimer();
      return;
    }

    discordActivity.textContent = "No current activity shown.";
    activeActivityStart = null;
    activeActivityLabel = "";
    updateActivityTimer();
  } catch {
    statusDot.className = "status-dot offline";
    discordStatus.textContent = "Presence unavailable";
    discordActivity.textContent = "Join Lanyard or check your Discord activity settings.";
    activeActivityStart = null;
    activeActivityLabel = "";
    updateActivityTimer();
  }
}

async function loadViews() {
  try {
    const res = await fetch(CONFIG.viewCounterUrl, {
      cache: "no-store"
    });

    const json = await res.json();
    const count = json.value ?? json.count ?? json.data?.value ?? json.data?.count;

    if (count === undefined) {
      throw new Error("No counter value found");
    }

    viewCount.textContent = Number(count).toLocaleString();
  } catch {
    viewCount.textContent = "Counter unavailable";
  }
}

setSiteInfo();
loadDiscordPresence();
loadViews();
updateActivityTimer();

setInterval(() => {
  setSiteInfo();
  loadDiscordPresence();
}, 30000);

setInterval(updateActivityTimer, 1000);
