const CONFIG = {
  discordUserId: "692126247458832455",
  siteCreated: "2026-07-10T00:00:00+12:00",
  location: "New Zealand",
  viewCounterUrl: "https://api.counterapi.dev/v1/sparkyfoxer/profilev2/up",
  spotifyProfileUrl: ""
};

const enterScreen = document.querySelector("#enterScreen");
const profileScreen = document.querySelector("#profileScreen");
const enterButton = document.querySelector("#enterButton");
const muteButton = document.querySelector("#muteButton");
const audio = document.querySelector("#bgAudio");

const thoughtBubble = document.querySelector("#thoughtBubble");
const statusDot = document.querySelector("#statusDot");
const discordStatus = document.querySelector("#discordStatus");
const discordCustomText = document.querySelector("#discordCustomText");
const discordBioText = document.querySelector("#discordBioText");
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
const spotifyTrackButton = document.querySelector("#spotifyTrackButton");
const spotifyProfileButton = document.querySelector("#spotifyProfileButton");

let userEntered = false;
let spotifyIsActive = false;
let spotifyStart = null;
let spotifyEnd = null;
let activeActivityStart = null;
let activeActivityLabel = "";

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
  if (spotifyIsActive && !force) {
    audio.pause();
    muteButton.textContent = "play fallback";
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

function formatDiscordStatus(status) {
  const labels = {
    online: "Online",
    idle: "Idle",
    dnd: "Do Not Disturb",
    offline: "Offline"
  };

  return labels[status] || "Unknown";
}

function setSiteInfo() {
  siteAge.textContent = timeAgo(CONFIG.siteCreated);
  locationText.textContent = CONFIG.location;

  if (discordBioText) {
    discordBioText.textContent = `Bio: ${CONFIG.discordBio}`;
  }
}

function setLiveBio(data) {
  if (!discordBioText) {
    return;
  }

  const liveBio = data.kv?.bio || "";

  if (liveBio.trim()) {
    discordBioText.textContent = liveBio;
    return;
  }

  discordBioText.textContent = "No live bio set.";
}

function setThoughtBubble(text) {
  const cleanText = (text || "").trim();

  if (!cleanText) {
    thoughtBubble.classList.add("hidden");
    
    return;
  }

  thoughtBubble.textContent = cleanText;
  thoughtBubble.classList.remove("hidden");
  
}

function getCustomStatus(data) {
  const activities = data.activities || [];
  const custom = activities.find(activity => activity.type === 4);

  if (!custom) {
    return "";
  }

  const emoji = custom.emoji?.name || "";
  const state = custom.state || "";

  return [emoji, state].filter(Boolean).join(" ");
}

function updateActivityTimer() {
  if (!activeActivityStart) {
    discordElapsed.textContent = "No timer for this activity.";
    return;
  }

  discordElapsed.textContent = `${activeActivityLabel} for ${formatTime(Date.now() - activeActivityStart)}`;
}

function updateSpotifyProgress() {
  if (!spotifyIsActive || !spotifyStart || !spotifyEnd) {
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
  spotifyIsActive = true;
  spotifyStart = spotify.timestamps?.start || null;
  spotifyEnd = spotify.timestamps?.end || null;

  spotifyCard.classList.remove("hidden");
  spotifyArt.src = spotify.album_art_url || "";
  spotifySong.textContent = spotify.song || "Unknown song";
  spotifyArtist.textContent = spotify.artist || "Unknown artist";

  if (spotify.track_id) {
    spotifyTrackButton.href = `https://open.spotify.com/track/${spotify.track_id}`;
    spotifyTrackButton.classList.remove("hidden");
  } else {
    spotifyTrackButton.classList.add("hidden");
  }

  if (CONFIG.spotifyProfileUrl) {
    spotifyProfileButton.href = CONFIG.spotifyProfileUrl;
    spotifyProfileButton.classList.remove("hidden");
  } else {
    spotifyProfileButton.classList.add("hidden");
  }

  discordActivity.textContent = "";
  discordActivity.classList.add("hidden");
  activeActivityStart = null;
  activeActivityLabel = "";

  if (discordElapsed) {
    discordElapsed.classList.add("hidden");
  }

  audio.pause();
  muteButton.textContent = "play fallback";

  updateActivityTimer();
  updateSpotifyProgress();
}

function hideSpotifyCard() {
  spotifyIsActive = false;
  spotifyStart = null;
  spotifyEnd = null;

  if (discordElapsed) {
    discordElapsed.classList.remove("hidden");
  }

  if (discordActivity) {
    discordActivity.classList.remove("hidden");
  }

  spotifyCard.classList.add("hidden");
  spotifyProgressFill.style.width = "0%";
  spotifyElapsed.textContent = "0:00";
  spotifyDuration.textContent = "0:00";

  discordActivity.classList.remove("hidden");
  discordElapsed.classList.remove("hidden");

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

function pickActivity(data) {
  const activities = data.activities || [];
  const activity = activities.find(item => [0, 2, 3, 5].includes(item.type));

  if (!activity) {
    return null;
  }

  const prefix = getActivityPrefix(activity.type);
  const details = [activity.details, activity.state].filter(Boolean).join(" • ");

  return {
    text: details ? `${prefix} ${activity.name} • ${details}` : `${prefix} ${activity.name}`,
    start: activity.timestamps?.start || null,
    label: prefix
  };
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
    discordStatus.textContent = `Status: ${formatDiscordStatus(status)}`;

    setThoughtBubble(getCustomStatus(data));
    setLiveBio(data);

    if (data.listening_to_spotify && data.spotify) {
      showSpotifyCard(data.spotify);
      return;
    }

    hideSpotifyCard();

    const activity = pickActivity(data);

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
    discordStatus.textContent = "Status unavailable";
    discordActivity.textContent = "Join Lanyard or check Discord activity settings.";
    setThoughtBubble("");
    if (discordBioText) {
      discordBioText.textContent = "Bio unavailable.";
    }
    hideSpotifyCard();
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
