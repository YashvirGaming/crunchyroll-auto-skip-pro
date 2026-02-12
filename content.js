function logDebug(...args) {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.debug) return;
  console.debug('Crunchyroll AutoSkip Pro:', ...args);
}

function initializeExtension() {
  logDebug('Content script initializing...');

  const checkModules = () => {
    if (window.__cr_settings && window.__cr_skipEngine && window.__cr_feedback) {
      try {
        // Initialize settings
        window.__cr_settings.loadSettings();

        // Global flags for popup toggles
        window.autoSkipEnabled = true;
        window.pipEnabled = true;
        window.skipIntroEnabled = true;
        window.skipCreditsEnabled = true;

        // Apply initial storage values
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

        // Listen for popup messages
        chrome.runtime.onMessage.addListener((msg) => {
          if (msg.action === "updateSettings") {
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
          }
        });

        // Hotkey Alt+Shift+S
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

        logDebug('Content script initialized successfully');

      } catch (error) {
        console.error('Initialization error:', error);
        setTimeout(checkModules, 500);
      }
    } else {
      // Retry if modules aren't ready
      setTimeout(checkModules, 100);
    }
  };

  checkModules();
}

function applySkipSettings() {
  if (window.autoSkipEnabled) {
    window.__cr_skipEngine.startObserver();
    window.__cr_skipEngine.findAndClickSkip();
    if (window.pipEnabled) enablePiP();
  } else {
    window.__cr_skipEngine.stopObserver();
    disablePiP();
  }
}

function enablePiP() {
  console.log("PiP Enabled");
  // Your Picture-in-Picture logic
}

function disablePiP() {
  console.log("PiP Disabled");
  // Stop PiP logic
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}
