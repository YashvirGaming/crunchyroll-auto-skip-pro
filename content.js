function init() {
  window.__cr_settings.loadSettings();
  window.__cr_skipEngine.startObserver();

  window.autoSkipEnabled = true;
  window.pipEnabled = true;
  window.skipIntroEnabled = true;
  window.skipCreditsEnabled = true;

  chrome.storage.sync.get(
    { enabled: true, pip: true, skipIntro: true, skipCredits: true },
    (settings) => {
      window.autoSkipEnabled = settings.enabled;
      window.pipEnabled = settings.pip;
      window.skipIntroEnabled = settings.skipIntro;
      window.skipCreditsEnabled = settings.skipCredits;

      applySkipSettings();
    }
  );

  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.code === "KeyS") {
      const newState = window.__cr_settings.toggleEnabled();
      window.autoSkipEnabled = newState;

      window.__cr_feedback.showMessage(
        "Auto-Skip " + (newState ? "Enabled ✅" : "Disabled ❌")
      );

      applySkipSettings();
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) window.autoSkipEnabled = changes.enabled.newValue;
    if (changes.pip) window.pipEnabled = changes.pip.newValue;
    if (changes.skipIntro) window.skipIntroEnabled = changes.skipIntro.newValue;
    if (changes.skipCredits)
      window.skipCreditsEnabled = changes.skipCredits.newValue;

    applySkipSettings();
  });
}

function applySkipSettings() {
  if (window.autoSkipEnabled) {
    if (window.skipIntroEnabled) window.__cr_skipEngine.skipIntro();
    if (window.skipCreditsEnabled) window.__cr_skipEngine.skipCredits();
    if (window.pipEnabled) enablePiP();
  } else {
    window.__cr_skipEngine.stopAll();
    disablePiP();
  }
}

function enablePiP() {
  console.log("PiP Enabled");
}

function disablePiP() {
  console.log("PiP Disabled");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
