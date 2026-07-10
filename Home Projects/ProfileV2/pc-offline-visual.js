/* Decorative offline state for the live PC monitor.
   This only changes appearance and does not alter monitor data. */
(() => {
  const card = document.getElementById("pcMonitorCard");
  if (!card || card.dataset.offlineVisualReady === "true") return;

  card.dataset.offlineVisualReady = "true";

  const overlay = document.createElement("div");
  overlay.className = "pc-offline-overlay";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.setAttribute("aria-hidden", "true");

  overlay.innerHTML = `
    <div class="pc-sleep-visual" aria-hidden="true">
      <span class="pc-sleep-moon">☾</span>
      <span class="pc-sleep-z pc-sleep-z-one">z</span>
      <span class="pc-sleep-z pc-sleep-z-two">z</span>
      <span class="pc-sleep-z pc-sleep-z-three">z</span>
    </div>
    <h3 class="pc-offline-title">Foxer's PC is snoozing</h3>
    <p class="pc-offline-description">
      Live stats return automatically when Fedora wakes up.
    </p>
    <span class="pc-offline-last-signal">
      Waiting for the monitor to reconnect…
    </span>
  `;

  card.appendChild(overlay);

  const state = document.getElementById("pcOnlineState");
  const updated = document.getElementById("pcUpdatedText");
  const title = overlay.querySelector(".pc-offline-title");
  const lastSignal = overlay.querySelector(".pc-offline-last-signal");

  const preview =
    new URLSearchParams(window.location.search).get("previewPcOffline") === "1";

  if (preview) {
    card.classList.add("pc-offline-preview");
  }

  function setText(element, text) {
    if (element && element.textContent !== text) {
      element.textContent = text;
    }
  }

  function sync() {
    const offline =
      card.classList.contains("is-offline") ||
      card.classList.contains("pc-offline-preview");

    overlay.setAttribute("aria-hidden", String(!offline));

    const stateText = state?.textContent?.trim() || "";
    const updatedText = updated?.textContent?.trim() || "";

    setText(
      title,
      stateText === "Unavailable"
        ? "The monitor signal wandered off"
        : "Foxer's PC is snoozing"
    );

    if (updatedText.startsWith("Updated ")) {
      setText(lastSignal, `Last signal ${updatedText.slice(8)}`);
    } else if (updatedText === "Could not reach monitor") {
      setText(lastSignal, "Waiting for the monitor to reconnect…");
    } else if (updatedText && updatedText !== "Waiting for data") {
      setText(lastSignal, updatedText);
    } else {
      setText(lastSignal, "Waiting for a signal…");
    }
  }

  sync();
  window.setInterval(sync, 1000);
})();
