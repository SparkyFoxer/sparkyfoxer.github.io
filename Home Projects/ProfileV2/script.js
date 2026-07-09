const CONFIG = {
  discordUserId: "692126247458832455",
  siteCreated: "2026-07-10T00:00:00+12:00",
  location: "New Zealand",

  /*
    GitHub Pages cannot save a real global view count by itself.
    Add your own counter API URL here later, or leave it empty.
    Example expected response:
    { "value": 1234 }
  */
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
const siteAge = document.querySelector("#siteAge");
const viewCount = document.querySelector("#viewCount");
const locationText = document.querySelector("#locationText");

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

function setSiteInfo() {
  siteAge.textContent = timeAgo(CONFIG.siteCreated);
  locationText.textContent = CONFIG.location;
}

async function loadDiscordPresence() {
  if (!CONFIG.discordUserId || CONFIG.discordUserId.includes("PUT_")) {
    return;
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discordUserId}`);
    const json = await res.json();

    if (!json.success) {
      throw new Error("Lanyard response was not successful");
    }

    const data = json.data;
    const status = data.discord_status || "offline";
    const activity = data.activities?.find(item => item.type === 0 || item.type === 2 || item.type === 4);

    statusDot.className = `status-dot ${status}`;
    discordStatus.textContent = status;

    if (data.listening_to_spotify && data.spotify) {
      discordActivity.textContent = `Listening to ${data.spotify.song} by ${data.spotify.artist}`;
      return;
    }

    if (activity) {
      discordActivity.textContent = activity.state || activity.details || activity.name;
      return;
    }

    discordActivity.textContent = "No current activity shown.";
  } catch {
    statusDot.className = "status-dot offline";
    discordStatus.textContent = "Presence unavailable";
    discordActivity.textContent = "Check your Discord ID and Lanyard setup.";
  }
}

async function loadViews() {
  if (!CONFIG.viewCounterUrl) {
    return;
  }

  try {
    const res = await fetch(CONFIG.viewCounterUrl);
    const json = await res.json();
    viewCount.textContent = Number(json.value).toLocaleString();
  } catch {
    viewCount.textContent = "Counter unavailable";
  }
}

setSiteInfo();
loadDiscordPresence();
loadViews();
setInterval(() => {
  setSiteInfo();
  loadDiscordPresence();
}, 30000);
