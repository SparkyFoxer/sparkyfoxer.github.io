/* One-time entry gate and shared music state */
(() => {
  const ENTERED_KEY = "sparky_site_entered_v1";
  const TIME_KEY = "sparky_site_music_time_v1";
  const UPDATED_KEY = "sparky_site_music_updated_v1";
  const AUDIO_SRC = "assets/song.mp3";
  const RESUME_TIMEOUT = 30 * 60 * 1000;
  const SAVE_INTERVAL = 5000;

  const isAboutPage =
    location.pathname.endsWith("/about.html") ||
    location.pathname.endsWith("about.html");

  // Allows easy testing with ?resetgate=1
  if (new URLSearchParams(location.search).has("resetgate")) {
    sessionStorage.removeItem(ENTERED_KEY);
  }

  let audio = document.querySelector("#siteMusic");

  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "siteMusic";
    audio.src = AUDIO_SRC;
    audio.loop = true;
    audio.preload = "auto";
    document.body.appendChild(audio);
  }

  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.55;

  function saveTime() {
    if (!Number.isFinite(audio.currentTime)) return;

    localStorage.setItem(TIME_KEY, String(audio.currentTime));
    localStorage.setItem(UPDATED_KEY, String(Date.now()));
  }

  async function restoreTime() {
    const savedTime = Number(localStorage.getItem(TIME_KEY) || 0);
    const updatedAt = Number(localStorage.getItem(UPDATED_KEY) || 0);

    const canResume =
      updatedAt > 0 &&
      Date.now() - updatedAt < RESUME_TIMEOUT &&
      Number.isFinite(savedTime);

    const targetTime = canResume ? Math.max(0, savedTime) : 0;

    if (audio.readyState < 1) {
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 1500);

        audio.addEventListener(
          "loadedmetadata",
          () => {
            clearTimeout(timeout);
            resolve();
          },
          { once: true }
        );
      });
    }

    try {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = targetTime % audio.duration;
      } else {
        audio.currentTime = targetTime;
      }
    } catch (error) {
      console.warn("Could not restore music position:", error);
    }
  }

  function showPage() {
    document.body.classList.remove("site-locked");
    document.body.classList.add("site-entered", "entered");

    const gate = document.querySelector("#siteEntryGate");
    if (gate) gate.remove();

    const main =
      document.querySelector("main.profile-screen") ||
      document.querySelector("main");

    if (main) {
      main.classList.remove("hidden", "view-hidden", "locked");
      main.style.display = "flex";
      main.style.opacity = "1";
      main.style.visibility = "visible";
      main.style.pointerEvents = "auto";
    }

    document.querySelectorAll(".profile-card, .about-card").forEach((card) => {
      card.classList.remove("hidden", "view-hidden", "locked");
      card.style.opacity = "1";
      card.style.visibility = "visible";
      card.style.pointerEvents = "auto";
    });
  }

  async function playMusic() {
    try {
      await audio.play();
      saveTime();
      return true;
    } catch (error) {
      console.warn("Browser delayed music playback:", error);
      return false;
    }
  }

  async function enterWebsite(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    sessionStorage.setItem(ENTERED_KEY, "true");

    showPage();
    await restoreTime();
    await playMusic();
  }

  window.SparkyEnter = enterWebsite;

  const enterButton = document.querySelector("#siteEnterButton");

  if (enterButton) {
    enterButton.addEventListener("click", enterWebsite);
  }

  /*
   * Save as soon as About or Back is pressed, then again while the
   * current page unloads.
   */
  document.addEventListener(
    "pointerdown",
    (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;

      saveTime();
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;

      sessionStorage.setItem(ENTERED_KEY, "true");
      saveTime();
    },
    true
  );

  window.addEventListener("pagehide", saveTime);
  window.addEventListener("beforeunload", saveTime);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveTime();
    }
  });

  setInterval(saveTime, SAVE_INTERVAL);

  const alreadyEntered =
    sessionStorage.getItem(ENTERED_KEY) === "true";

  /*
   * About never gets an entry gate.
   * Returning to Profile in the same tab also skips it.
   */
  if (isAboutPage || alreadyEntered) {
    showPage();

    restoreTime().then(() => {
      playMusic();
    });

    /*
     * If the browser blocks automatic audio after navigation,
     * the first normal click, scroll or key press resumes it.
     * No extra music or entry button is shown.
     */
    const resume = () => {
      if (audio.paused) playMusic();
    };

    ["pointerdown", "touchstart", "keydown", "wheel", "scroll"].forEach(
      (eventName) => {
        window.addEventListener(eventName, resume, {
          passive: true
        });
      }
    );
  }
})();
