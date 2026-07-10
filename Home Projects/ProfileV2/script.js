const CONFIG = {
  discordUserId: "692126247458832455",
  siteCreated: "2026-07-10T00:00:00+12:00",
  location: "New Zealand",
  profileSubtitle: "Fox thing • Linux • music • games • OCE",
  fallbackBio: `🦊 Sparky Foxer :3
🌟 New Zealand | OCE
🤙21 - Chill vibes
🎮 CS2/FH6/BTD/Satisfactory
🎵 EDM, DNB, Rock, Pop
📺 Twitch: SparkyTheFox_
⚽RL - D2 | 🔫CS2 - 8k`,
  viewCounterUrl: "https://api.counterapi.dev/v1/sparkyfoxer/profilev2/up",
  spotifyProfileUrl: ""
};

const enterScreen = document.querySelector("#enterScreen");
const profileScreen = document.querySelector("#profileScreen");
const enterButton = document.querySelector("#enterButton");
const muteButton = document.querySelector("#muteButton");
const audio = document.querySelector("#bgAudio");

const thoughtBubble = document.querySelector("#thoughtBubble");
const statusCard = document.querySelector("#statusCard");
const activityCard = document.querySelector("#activityCard");
const statusDot = document.querySelector("#statusDot");
const discordStatus = document.querySelector("#discordStatus");
const discordBioText = document.querySelector("#discordBioText");

const siteAge = document.querySelector("#siteAge");
const viewCount = document.querySelector("#viewCount");
const locationText = document.querySelector("#locationText");
const profileSubtitle = document.querySelector("#profileSubtitle");

const spotifyCard = document.querySelector("#spotifyCard");
const spotifyArt = document.querySelector("#spotifyArt");
const spotifySong = document.querySelector("#spotifySong");
const spotifyArtist = document.querySelector("#spotifyArtist");
const spotifyElapsed = document.querySelector("#spotifyElapsed");
const spotifyDuration = document.querySelector("#spotifyDuration");
const spotifyProgressFill = document.querySelector("#spotifyProgressFill");
const spotifyTrackButton = document.querySelector("#spotifyTrackButton");
const spotifyProfileButton = document.querySelector("#spotifyProfileButton");

const otherActivities = document.querySelector("#otherActivities");
const activityEmpty = document.querySelector("#activityEmpty");

let userEntered = false;
let spotifyIsActive = false;
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

  return labels[status] || "Offline";
}

function setSiteInfo() {
  const now = new Date();

  siteAge.textContent = new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(now);

  locationText.textContent = CONFIG.location;

  if (profileSubtitle) {
    profileSubtitle.textContent = CONFIG.profileSubtitle;
  }
}

function showStatusCard(status) {
  if (statusCard) {
    statusCard.classList.remove("hidden");
    statusCard.style.display = "flex";
  }

  statusDot.className = `status-dot ${status}`;
  discordStatus.textContent = formatDiscordStatus(status);
}

function hideThoughtBubble() {
  if (!thoughtBubble) {
    return;
  }

  thoughtBubble.classList.add("hidden");
  thoughtBubble.textContent = "";
  thoughtBubble.innerHTML = "";
}

function setThoughtBubble(status) {
  if (!thoughtBubble) {
    return;
  }

  const emoji = status?.emoji || "";
  const text = status?.state || "";

  if (!emoji && !text) {
    hideThoughtBubble();
    return;
  }

  thoughtBubble.innerHTML = "";

  if (emoji) {
    const emojiSpan = document.createElement("span");
    emojiSpan.className = "status-emoji";
    emojiSpan.textContent = emoji;
    thoughtBubble.appendChild(emojiSpan);
  }

  if (text) {
    const textSpan = document.createElement("span");
    textSpan.className = "status-text";
    textSpan.textContent = text;
    thoughtBubble.appendChild(textSpan);
  }

  thoughtBubble.classList.remove("hidden");
}

function setLiveBio(data) {
  if (!discordBioText) {
    return;
  }

  const liveBio = data?.kv?.bio || CONFIG.fallbackBio;

  discordBioText.textContent = liveBio.trim() || CONFIG.fallbackBio;
}

function getCustomStatus(data) {
  const activities = data.activities || [];
  const custom = activities.find(activity => activity.type === 4);

  if (!custom) {
    return { emoji: "", state: "" };
  }

  return {
    emoji: custom.emoji?.name || "",
    state: custom.state || ""
  };
}

function showActivityCard() {
  if (activityCard) {
    activityCard.classList.remove("hidden");
    activityCard.style.display = "";
  }
}

function hideActivityCard() {
  if (activityCard) {
    activityCard.classList.add("hidden");
    activityCard.style.display = "none";
  }

  if (otherActivities) {
    otherActivities.innerHTML = "";
  }

  if (activityEmpty) {
    activityEmpty.classList.add("hidden");
  }

  hideSpotifyCard(false);
}

function setOfflineView(data = null) {
  showStatusCard("offline");
  hideThoughtBubble();
  setLiveBio(data || { kv: { bio: CONFIG.fallbackBio } });
  hideActivityCard();
}

function getActivityPrefix(type) {
  const prefixes = {
    0: "Playing",
    1: "Streaming",
    2: "Listening to",
    3: "Watching",
    5: "Competing in"
  };

  return prefixes[type] || "Doing";
}

function getActivityEmoji(type) {
  const icons = {
    0: "🎮",
    1: "📡",
    2: "🎧",
    3: "📺",
    5: "🏆"
  };

  return icons[type] || "•";
}

function shouldSkipActivity(activity, data) {
  if (activity.type === 4) {
    return true;
  }

  return data.listening_to_spotify &&
    activity.type === 2 &&
    String(activity.name || "").toLowerCase().includes("spotify");
}

function getActivityImageUrl(activity) {
  const asset = activity.assets?.large_image || activity.assets?.small_image || "";

  if (!asset) {
    return "";
  }

  if (asset.startsWith("https://") || asset.startsWith("http://")) {
    return asset;
  }

  if (asset.startsWith("mp:")) {
    return `https://media.discordapp.net/${asset.slice(3)}`;
  }

  if (asset.startsWith("app-assets/")) {
    return `https://cdn.discordapp.com/${asset}.png?size=256`;
  }

  if (activity.application_id) {
    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${asset}.png?size=256`;
  }

  return "";
}

function createActivityIcon(activity) {
  const imageUrl = getActivityImageUrl(activity);

  if (imageUrl) {
    const img = document.createElement("img");
    img.className = "activity-image";
    img.src = imageUrl;
    img.alt = `${activity.name || "Activity"} image`;

    img.onerror = () => {
      const fallback = document.createElement("div");
      fallback.className = "activity-icon";
      fallback.textContent = getActivityEmoji(activity.type);
      img.replaceWith(fallback);
    };

    return img;
  }

  const icon = document.createElement("div");
  icon.className = "activity-icon";
  icon.textContent = getActivityEmoji(activity.type);
  return icon;
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

  audio.pause();
  muteButton.textContent = "play fallback";

  updateSpotifyProgress();
}

function hideSpotifyCard(playFallback = true) {
  spotifyIsActive = false;
  spotifyStart = null;
  spotifyEnd = null;

  if (spotifyCard) {
    spotifyCard.classList.add("hidden");
  }

  if (spotifyProgressFill) {
    spotifyProgressFill.style.width = "0%";
  }

  if (spotifyElapsed) {
    spotifyElapsed.textContent = "0:00";
  }

  if (spotifyDuration) {
    spotifyDuration.textContent = "0:00";
  }

  if (playFallback && userEntered) {
    playFallbackIfNeeded();
  }
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

function renderActivityCards(data) {
  const activities = (data.activities || []).filter(activity => !shouldSkipActivity(activity, data));

  otherActivities.innerHTML = "";

  for (const activity of activities) {
    const prefix = getActivityPrefix(activity.type);
    const details = [activity.details, activity.state].filter(Boolean).join(" • ");
    const start = activity.timestamps?.start || "";
    const title = `${prefix} ${activity.name || "Unknown"}`;

    const item = document.createElement("div");
    item.className = "activity-item";

    const icon = createActivityIcon(activity);

    const info = document.createElement("div");
    info.className = "activity-info";

    const header = document.createElement("div");
    header.className = "activity-header";

    const headerLeft = document.createElement("span");
    headerLeft.textContent = prefix;

    const headerRight = document.createElement("span");
    headerRight.textContent = activity.application_id ? "Rich Presence" : "";

    const titleEl = document.createElement("div");
    titleEl.className = "activity-title";
    titleEl.textContent = title;

    const detailEl = document.createElement("div");
    detailEl.className = "activity-detail";
    detailEl.textContent = details || "Activity shown on Discord.";

    const timer = document.createElement("div");
    timer.className = "activity-timer";

    if (start) {
      timer.dataset.start = start;
      timer.dataset.label = prefix;
      timer.textContent = `${prefix} for ${formatTime(Date.now() - Number(start))}`;
    } else {
      timer.textContent = "No timer for this activity.";
    }

    header.appendChild(headerLeft);
    header.appendChild(headerRight);
    info.appendChild(header);
    info.appendChild(titleEl);
    info.appendChild(detailEl);
    info.appendChild(timer);

    item.appendChild(icon);
    item.appendChild(info);

    otherActivities.appendChild(item);
  }

  const hasSpotify = data.listening_to_spotify && data.spotify;
  const hasOtherActivities = activities.length > 0;

  activityEmpty.classList.toggle("hidden", hasSpotify || hasOtherActivities);
}

function updateActivityTimers() {
  document.querySelectorAll(".activity-timer[data-start]").forEach(timer => {
    const start = Number(timer.dataset.start);
    const label = timer.dataset.label || "Active";

    if (!Number.isNaN(start)) {
      timer.textContent = `${label} for ${formatTime(Date.now() - start)}`;
    }
  });
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

    setLiveBio(data);

    if (status === "offline") {
      setOfflineView(data);
      return;
    }

    showStatusCard(status);
    showActivityCard();
    setThoughtBubble(getCustomStatus(data));

    if (data.listening_to_spotify && data.spotify) {
      showSpotifyCard(data.spotify);
    } else {
      hideSpotifyCard();
    }

    renderActivityCards(data);
  } catch {
    showStatusCard("offline");
    hideThoughtBubble();
    setLiveBio({ kv: { bio: CONFIG.fallbackBio } });
    hideActivityCard();
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

    viewCount.textContent = `${Number(count).toLocaleString()} views`;
  } catch {
    viewCount.textContent = "Counter unavailable";
  }
}

setSiteInfo();
loadDiscordPresence();
loadViews();
updateSpotifyProgress();
updateActivityTimers();

setInterval(() => {
  setSiteInfo();
  loadDiscordPresence();
}, 30000);

setInterval(() => {
  updateSpotifyProgress();
  updateActivityTimers();
}, 1000);

/* Profile enter counter — direct CountAPI, no CDN/library */
(() => {
  const counterKey = "sparkyfoxer_profilev2_enter_clicks_v1";
  const apiBase = "https://countapi.mileshilliard.com/api/v1";

  const viewEl =
    document.querySelector("#viewCount") ||
    document.querySelector("#views") ||
    document.querySelector("[data-view-count]");

  if (!viewEl) {
    console.warn("Enter counter: no counter display element found.");
    return;
  }

  let countedThisLoad = false;

  function formatEnters(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "0 enters";
    }

    return `${number.toLocaleString()} ${number === 1 ? "enter" : "enters"}`;
  }

  async function counterRequest(action) {
    const url = `${apiBase}/${action}/${encodeURIComponent(counterKey)}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });

    const raw = await res.text();

    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Counter returned non-JSON: ${raw}`);
    }

    if (!res.ok) {
      const err = new Error(`Counter failed ${res.status}: ${raw}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    const value = Number(data.value ?? data.count ?? data.data?.value ?? data.data?.count);

    if (!Number.isFinite(value)) {
      throw new Error(`Counter response had no usable number: ${raw}`);
    }

    return value;
  }

  async function loadCurrentCount() {
    try {
      const count = await counterRequest("get");
      viewEl.textContent = formatEnters(count);
    } catch (err) {
      // If the counter does not exist yet, show 0 until first enter click.
      if (err.status === 404) {
        viewEl.textContent = "0 enters";
        return;
      }

      console.warn("Enter counter: could not load current count:", err);
      viewEl.textContent = "0 enters";
    }
  }

  async function countEnter() {
    if (countedThisLoad) return;
    countedThisLoad = true;

    try {
      viewEl.textContent = "Counting...";
      const count = await counterRequest("hit");
      viewEl.textContent = formatEnters(count);
    } catch (err) {
      countedThisLoad = false;
      console.warn("Enter counter failed:", err);
      viewEl.textContent = "Counter unavailable";
    }
  }

  function isEnterClick(event) {
    const clicked = event.target.closest(
      "button, a, [role='button'], #enterScreen, #introScreen, .enter-screen, .intro-screen, .click-screen, .overlay"
    );

    if (!clicked) return false;

    const text = (clicked.textContent || "").trim().toLowerCase();
    const id = (clicked.id || "").toLowerCase();
    const classes = (clicked.className || "").toString().toLowerCase();

    const combined = `${text} ${id} ${classes}`;

    return (
      combined.includes("enter") ||
      combined.includes("click to enter") ||
      combined.includes("intro")
    );
  }

  loadCurrentCount();

  document.addEventListener(
    "click",
    (event) => {
      if (isEnterClick(event)) {
        countEnter();
      }
    },
    true
  );
})();

