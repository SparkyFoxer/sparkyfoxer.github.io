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

const spotifyCard = document.querySelector("#spotifyCard");
const spotifyArt = document.querySelector("#spotifyArt");
const spotifySong = document.querySelector("#spotifySong");
const spotifyArtist = document.querySelector("#spotifyArtist");
const spotifyElapsed = document.querySelector("#spotifyElapsed");
const spotifyDuration = document.querySelector("#spotifyDuration");
const spotifyProgressFill = document.querySelector("#spotifyProgressFill");

let userEntered = false;
let activeActivityStart = null;
let activeActivityLabel = "";
let spotifyStart = null;
let spotifyEnd = null;

enterButton.addEventListener("click", async () => {
  userEntered = true;
  enterScreen.classList.add("hidden");
  profileScreen.classList.remove("hidden");

  await playFallbackIfNeeded();
});

muteButton.addEventListener("click", async () => {
  if (audio.paused) {
    await playFallbackIfNeeded(true);
    return;
  }

  audio.pause();
  muteButton.textContent = "play audio";
});

async function playFallbackIfNeeded(force = false) {
  const spotifyActive = spotifyCard && !spotifyCard.classList.contains("hidden");

  if (spotifyActive && !force) {
    audio.pause();
    muteButton.textContent = "spotify active";
    return;
  }

  try {
    audio.volume = 0.35;
    await audio.play();
    muteButton.textContent = "mute";
  } catch {
    muteButton.textContent = "play audio";
  }
}

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

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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
    discordElapsed.textContent = "No timer for this activity.";
    return;
  }

  discordElapsed.textContent = `${activeActivityLabel} for ${formatTime(Date.now() - activeActivityStart)}`;
}

function updateSpotifyProgress() {
  if (!spotifyCard || spotifyCard.classList.contains("hidden") || !spotifyStart || !spotifyEnd) {
    return;
  }

  const now = Date.now();
  const elapsed = Math.max(0, now - spotifyStart);
  const duration = Math.max(1, spotifyEnd - spotifyStart);
  const percent = Math.min(100, Math.max(0, (elapsed / duration) * 100));

  spotifyElapsed.textContent = formatTime(elapsed);
  spotifyDuration.textContent = formatTime(duration);
  spotifyProgressFill.style.width = `${percent}%`;
}

function showSpotifyCard(spotify) {
  if (!spotifyCard || !spotify) {
    return;
  }

  spotifyStart = spotify.timestamps?.start || null;
  spotifyEnd = spotify.timestamps?.end || null;

  spotifyCard.classList.remove("hidden");
  spotifyArt.src = spotify.album_art_url || "";
  spotifySong.textContent = spotify.song || "Unknown song";
  spotifyArtist.textContent = spotify.artist || "Unknown artist";

  discordActivity.textContent = `Listening to ${spotify.song} by ${spotify.artist}`;
  activeActivityStart = spotifyStart;
  activeActivityLabel = "Listening";

  audio.pause();
  muteButton.textContent = "spotify active";

  updateActivityTimer();
  updateSpotifyProgress();
}

function hideSpotifyCard() {
  spotifyStart = null;
  spotifyEnd = null;

  if (spotifyCard) {
    spotifyCard.classList.add("hidden");
  }

  if (spotifyProgressFill) {
    spotifyProgressFill.style.width = "0%";
  }

  if (userEntered) {
    playFallbackIfNeeded();
  }
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
      start: mainActivity.timestamps?.start || null,
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

    statusDot.className = `status-dot ${status}`;
    discordStatus.textContent = status;

    if (data.listening_to_spotify && data.spotify) {
      showSpotifyCard(data.spotify);
      return;
    }

    hideSpotifyCard();

    const activity = pickBestActivity(data);

    if (activity) {
      discordActivity.textContent = activity.subtitle
        ? `${activity.title} • ${activity.subtitle}`
        : activity.title;

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
    discordActivity.textContent = "Join Lanyard or check Discord activity settings.";
    activeActivityStart = null;
    activeActivityLabel = "";
    hideSpotifyCard();
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

    if (count === undefined) {
      throw new Error("No counter value");
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
updateSpotifyProgress();

setInterval(() => {
  setSiteInfo();
  loadDiscordPresence();
}, 30000);

setInterval(() => {
  updateActivityTimer();
  updateSpotifyProgress();
}, 1000);
