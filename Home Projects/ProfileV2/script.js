/* Main profile live data: Discord, bio, activity, time and last seen */
(() => {
  const DISCORD_ID = "692126247458832455";
  const LANYARD_URL =
    `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

  const LAST_SEEN_URL =
    "https://spotify-genres.sparkyfoxer.workers.dev/last-seen";

  const FALLBACK_BIO = `🦊 Sparky Foxer :3
🌟 New Zealand | OCE
🤙 21 - Chill vibes
🎮 CS2/FH6/BTD/Satisfactory
🎵 EDM, DNB, Rock, Pop
📺 Twitch: SparkyTheFox_
⚽ RL - D2 | 🔫 CS2 - 8k`;

  const nodes = {};

  let discordStatus = "offline";
  let lastSeenData = null;

  let spotifyStart = 0;
  let spotifyEnd = 0;

  function first(...selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  function show(element, display = "") {
    if (!element) return;

    element.classList.remove(
      "hidden",
      "view-hidden",
      "locked",
      "is-hidden"
    );

    element.style.display = display;
    element.style.opacity = "1";
    element.style.visibility = "visible";
    element.style.pointerEvents = "auto";
  }

  function hide(element) {
    if (!element) return;

    element.classList.add("hidden");
    element.style.display = "none";
  }

  function statusLabel(status) {
    const labels = {
      online: "Online",
      idle: "Idle",
      dnd: "Do Not Disturb",
      offline: "Offline"
    };

    return labels[status] || "Offline";
  }

  function setStatus(status) {
    discordStatus = status || "offline";

    show(nodes.statusCard);

    if (nodes.statusDot) {
      nodes.statusDot.className =
        `status-dot ${discordStatus}`;

      nodes.statusDot.title = statusLabel(discordStatus);
    }

    if (nodes.statusText) {
      nodes.statusText.textContent =
        statusLabel(discordStatus);
    }

    renderLastSeen();
  }

  function setBio(data) {
    if (!nodes.bio) return;

    const liveBio =
      String(data?.kv?.bio || "").trim() ||
      FALLBACK_BIO;

    nodes.bio.textContent = liveBio;
  }

  function renderCustomStatus(data) {
    if (!nodes.thoughtBubble) return;

    const activities = data?.activities || [];

    const customStatus = activities.find(
      (activity) => activity?.type === 4
    );

    const emoji = customStatus?.emoji || null;

    const text =
      String(customStatus?.state || "").trim();

    nodes.thoughtBubble.replaceChildren();

    if (!emoji?.name && !emoji?.id && !text) {
      hide(nodes.thoughtBubble);
      return;
    }

    if (emoji?.id) {
      const emojiImage = document.createElement("img");
      const extension = emoji.animated ? "gif" : "webp";

      emojiImage.className = "status-emoji status-emoji-image";
      emojiImage.src =
        `https://cdn.discordapp.com/emojis/${emoji.id}.${extension}` +
        "?size=32&quality=lossless";
      emojiImage.alt = emoji.name
        ? `:${emoji.name}:`
        : "Custom status emoji";
      nodes.thoughtBubble.appendChild(emojiImage);
    } else if (emoji?.name) {
      const emojiText = document.createElement("span");
      emojiText.className = "status-emoji";
      emojiText.textContent = emoji.name;
      nodes.thoughtBubble.appendChild(emojiText);
    }

    if (text) {
      const textElement = document.createElement("span");
      textElement.className = "status-text";
      textElement.textContent = text;
      nodes.thoughtBubble.appendChild(textElement);
    }

    show(nodes.thoughtBubble);
  }

  function formatDuration(milliseconds) {
    const seconds = Math.max(
      0,
      Math.floor(milliseconds / 1000)
    );

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;

    return `${seconds}s`;
  }

  function updateClock() {
    if (!nodes.time) return;

    nodes.time.textContent =
      new Intl.DateTimeFormat("en-NZ", {
        timeZone: "Pacific/Auckland",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).format(new Date());
  }

  function renderLastSeen() {
    if (!nodes.lastSeen) return;

    if (
      lastSeenData?.is_online &&
      lastSeenData?.online_since
    ) {
      const started =
        new Date(lastSeenData.online_since).getTime();

      nodes.lastSeen.textContent =
        `${statusLabel(lastSeenData.status)} for ` +
        formatDuration(Date.now() - started);

      return;
    }

    if (lastSeenData?.last_seen_at) {
      const lastOnline =
        new Date(lastSeenData.last_seen_at).getTime();

      nodes.lastSeen.textContent =
        `Last online ` +
        `${formatDuration(Date.now() - lastOnline)} ago`;

      return;
    }

    if (discordStatus !== "offline") {
      nodes.lastSeen.textContent =
        `${statusLabel(discordStatus)} now`;
    } else {
      nodes.lastSeen.textContent =
        "Last seen unavailable";
    }
  }

  async function loadLastSeen() {
    if (!nodes.lastSeen) return;

    try {
      const response = await fetch(LAST_SEEN_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Last seen returned ${response.status}`
        );
      }

      lastSeenData = await response.json();
      renderLastSeen();
    } catch (error) {
      console.warn("Last seen failed:", error);
      renderLastSeen();
    }
  }

  function activityImageUrl(activity) {
    const asset =
      activity?.assets?.large_image ||
      activity?.assets?.small_image ||
      "";

    if (!asset) return "";

    if (
      asset.startsWith("https://") ||
      asset.startsWith("http://")
    ) {
      return asset;
    }

    if (asset.startsWith("mp:")) {
      return `https://media.discordapp.net/${asset.slice(3)}`;
    }

    if (activity?.application_id) {
      return (
        "https://cdn.discordapp.com/app-assets/" +
        `${activity.application_id}/${asset}.png?size=256`
      );
    }

    return "";
  }

  function activityPrefix(type) {
    const labels = {
      0: "Playing",
      1: "Streaming",
      2: "Listening to",
      3: "Watching",
      5: "Competing in"
    };

    return labels[type] || "Active in";
  }

  function activityEmoji(type) {
    const emojis = {
      0: "🎮",
      1: "📡",
      2: "🎵",
      3: "📺",
      5: "🏆"
    };

    return emojis[type] || "✨";
  }

  function createActivityIcon(activity) {
    const icon = document.createElement("div");
    icon.className = "activity-icon";
    icon.textContent = activityEmoji(activity?.type);
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  function createActivity(activity) {
    const item = document.createElement("div");
    item.className = "activity-item";

    const imageUrl = activityImageUrl(activity);

    if (imageUrl) {
      const image = document.createElement("img");
      image.className = "activity-image";
      image.src = imageUrl;
      image.alt = "";
      image.addEventListener(
        "error",
        () => image.replaceWith(createActivityIcon(activity)),
        { once: true }
      );
      item.appendChild(image);
    } else {
      item.appendChild(createActivityIcon(activity));
    }

    const information = document.createElement("div");
    information.className = "activity-info";

    const heading = document.createElement("div");
    heading.className = "activity-title";
    heading.textContent =
      `${activityPrefix(activity.type)} ` +
      `${activity.name || "Unknown activity"}`;

    const detail = document.createElement("div");
    detail.className = "activity-detail";

    detail.textContent = [
      activity.details,
      activity.state
    ].filter(Boolean).join(" • ");

    information.appendChild(heading);

    if (detail.textContent) {
      information.appendChild(detail);
    }

    if (activity.timestamps?.start) {
      const timer = document.createElement("div");
      timer.className = "activity-timer";
      timer.dataset.start =
        String(activity.timestamps.start);

      information.appendChild(timer);
    }

    item.appendChild(information);
    return item;
  }

  function renderSpotify(spotify) {
    if (!nodes.spotifyCard) return;

    if (!spotify) {
      spotifyStart = 0;
      spotifyEnd = 0;
      hide(nodes.spotifyCard);
      return;
    }

    spotifyStart =
      Number(spotify.timestamps?.start || 0);

    spotifyEnd =
      Number(spotify.timestamps?.end || 0);

    show(nodes.spotifyCard);

    if (nodes.spotifyArt) {
      nodes.spotifyArt.src =
        spotify.album_art_url || "";

      nodes.spotifyArt.alt =
        spotify.album || "Spotify album artwork";
    }

    if (nodes.spotifySong) {
      nodes.spotifySong.textContent =
        spotify.song || "Unknown song";
    }

    if (nodes.spotifyArtist) {
      nodes.spotifyArtist.textContent =
        spotify.artist || "Unknown artist";
    }

    if (nodes.spotifyTrackButton) {
      if (spotify.track_id) {
        nodes.spotifyTrackButton.href =
          `https://open.spotify.com/track/${spotify.track_id}`;

        show(nodes.spotifyTrackButton);
      } else {
        hide(nodes.spotifyTrackButton);
      }
    }

    updateSpotifyProgress();
  }

  function formatTrackTime(milliseconds) {
    const seconds = Math.max(
      0,
      Math.floor(milliseconds / 1000)
    );

    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  }

  function updateSpotifyProgress() {
    if (!spotifyStart || !spotifyEnd) return;

    const elapsed = Math.max(
      0,
      Date.now() - spotifyStart
    );

    const duration = Math.max(
      1,
      spotifyEnd - spotifyStart
    );

    const percentage = Math.min(
      100,
      Math.max(0, elapsed / duration * 100)
    );

    if (nodes.spotifyElapsed) {
      nodes.spotifyElapsed.textContent =
        formatTrackTime(elapsed);
    }

    if (nodes.spotifyDuration) {
      nodes.spotifyDuration.textContent =
        formatTrackTime(duration);
    }

    if (nodes.spotifyProgress) {
      nodes.spotifyProgress.style.width =
        `${percentage}%`;
    }
  }

  function updateActivityTimers() {
    document
      .querySelectorAll(".activity-timer[data-start]")
      .forEach((timer) => {
        const start = Number(timer.dataset.start);

        if (!Number.isFinite(start)) return;

        timer.textContent =
          `Active for ${formatDuration(Date.now() - start)}`;
      });
  }

  function renderActivities(data) {
    show(nodes.activityCard);

    const activities =
      (data?.activities || []).filter((activity) => {
        if (!activity) return false;

        // Discord custom status has its own bubble.
        if (activity.type === 4) return false;

        // Spotify has its own card.
        if (
          data?.listening_to_spotify &&
          activity.type === 2 &&
          String(activity.name || "")
            .toLowerCase()
            .includes("spotify")
        ) {
          return false;
        }

        return true;
      });

    renderSpotify(
      data?.listening_to_spotify
        ? data.spotify
        : null
    );

    if (nodes.otherActivities) {
      nodes.otherActivities.replaceChildren();

      for (const activity of activities) {
        nodes.otherActivities.appendChild(
          createActivity(activity)
        );
      }
    }

    const hasAnything =
      Boolean(
        data?.listening_to_spotify &&
        data?.spotify
      ) || activities.length > 0;

    if (nodes.activityEmpty) {
      nodes.activityEmpty.textContent =
        "No current activity shown.";

      nodes.activityEmpty.classList.toggle(
        "hidden",
        hasAnything
      );

      nodes.activityEmpty.style.display =
        hasAnything ? "none" : "";
    }

    updateActivityTimers();
  }

  async function loadDiscordPresence() {
    try {
      const response = await fetch(LANYARD_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(
          `Lanyard returned ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Lanyard returned no profile data");
      }

      const data = result.data;

      setStatus(data.discord_status || "offline");
      setBio(data);
      renderCustomStatus(data);
      renderActivities(data);
    } catch (error) {
      console.warn("Discord presence failed:", error);

      setStatus("offline");
      setBio(null);
      renderCustomStatus(null);

      show(nodes.activityCard);

      if (nodes.activityEmpty) {
        nodes.activityEmpty.textContent =
          "Discord activity unavailable.";

        nodes.activityEmpty.classList.remove("hidden");
        nodes.activityEmpty.style.display = "";
      }
    }
  }

  function initialise() {
    nodes.statusCard =
      first("#statusCard", ".status-card");

    nodes.activityCard =
      first("#activityCard", ".activity-card");

    nodes.statusDot =
      first("#statusDot", ".status-dot");

    nodes.statusText =
      first("#discordStatus", "[data-discord-status]");

    nodes.bio =
      first("#discordBioText", "[data-discord-bio]");

    nodes.thoughtBubble =
      first("#thoughtBubble", ".thought-bubble");

    nodes.time =
      first(
        "#siteAge",
        "#profileTime",
        "#localTime",
        "[data-profile-time]"
      );

    nodes.lastSeen =
      first(
        "#lastSeenText",
        "#viewCount",
        "#views",
        "[data-last-seen]"
      );

    nodes.location =
      first("#locationText", "[data-location]");

    nodes.spotifyCard =
      first("#spotifyCard");

    nodes.spotifyArt =
      first("#spotifyArt");

    nodes.spotifySong =
      first("#spotifySong");

    nodes.spotifyArtist =
      first("#spotifyArtist");

    nodes.spotifyElapsed =
      first("#spotifyElapsed");

    nodes.spotifyDuration =
      first("#spotifyDuration");

    nodes.spotifyProgress =
      first("#spotifyProgressFill");

    nodes.spotifyTrackButton =
      first("#spotifyTrackButton");

    nodes.otherActivities =
      first("#otherActivities");

    nodes.activityEmpty =
      first("#activityEmpty");

    if (nodes.location) {
      nodes.location.textContent = "New Zealand";
    }

    updateClock();
    renderLastSeen();

    loadDiscordPresence();
    loadLastSeen();

    setInterval(() => {
      updateClock();
      updateSpotifyProgress();
      updateActivityTimers();
      renderLastSeen();
    }, 1000);

    setInterval(loadDiscordPresence, 30000);
    setInterval(loadLastSeen, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialise,
      { once: true }
    );
  } else {
    initialise();
  }
})();
