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
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function setSiteInfo() {
  siteAge.textContent = timeAgo(CONFIG.siteCreated);
  locationText.textContent = CONFIG.location;
}

function updateActivityTimer() {
  if (!discordElapsed) return;

  if (!activeActivityStart) {
    discordElapsed.textContent = "No timer for this activity.";
    return;
  }

  discordElapsed.textContent = `${activeActivityLabel} for ${formatDuration(Date.now() - activeActivityStart)}`;
}

function pickActivity(data) {
  if (data.listening_to_spotify && data.spotify) {
    return {
      text: `Listening to ${data.spotify.song} by ${data.spotify.artist}`,
      start: data.spotify.timestamps?.start || null,
      label: "Listening"
    };
  }

  const activities = data.activities || [];
  const activity = activities.find(item => [0, 2, 3, 5].includes(item.type));

  if (activity) {
    const names = {
      0: "Playing",
      2: "Listening to",
      3: "Watching",
      5: "Competing in"
    };

    const prefix = names[activity.type] || "Doing";
    const details = [activity.details, activity.state].filter(Boolean).join(" • ");

    return {
      text: details ? `${prefix} ${activity.name} • ${details}` : `${prefix} ${activity.name}`,
      start: activity.timestamps?.start || null,
      label: prefix
    };
  }

  const custom = activities.find(item => item.type === 4);

  if (custom) {
    return {
      text: custom.state || "Custom status",
      start: null,
      label: "Status"
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

    if (!json.success) throw new Error("Lanyard failed");

    const data = json.data;
    const status = data.discord_status || "offline";
    const activity = pickActivity(data);

    statusDot.className = `status-dot ${status}`;
    discordStatus.textContent = status;

    if (activity) {
      discordActivity.textContent = activity.text;
      activeActivityStart = activity.start;
      activeActivityLabel = activity.label;
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
    discordActivity.textContent = "Join Lanyard or check Discord activity settings.";
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
    const count = json.count ?? json.value ?? json.data?.count ?? json.data?.value;

    if (count === undefined) throw new Error("No counter value");

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
