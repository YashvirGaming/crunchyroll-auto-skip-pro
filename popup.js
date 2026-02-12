const mainToggle = document.getElementById("mainToggle");
const pip = document.getElementById("pip");
const skipIntro = document.getElementById("skipIntro");
const skipCredits = document.getElementById("skipCredits");
const debug = document.getElementById("debug");

// Load initial state
chrome.storage.sync.get(
  { enabled: true, pip: true, skipIntro: true, skipCredits: true, debug: false },
  (settings) => {
    updateMainButton(settings.enabled);
    pip.checked = settings.pip;
    skipIntro.checked = settings.skipIntro;
    skipCredits.checked = settings.skipCredits;
    debug.checked = settings.debug;
  }
);

function updateMainButton(enabled) {
  mainToggle.textContent = enabled ? "Disable Auto-Skip" : "Enable Auto-Skip";
  mainToggle.style.backgroundColor = enabled ? "green" : "red";
}

// Main toggle click
mainToggle.addEventListener("click", () => {
  chrome.storage.sync.get(["enabled"], (res) => {
    const newState = !res.enabled;

    // Update storage
    chrome.storage.sync.set({
      enabled: newState,
      pip: newState,
      skipIntro: newState,
      skipCredits: newState
    });

    // Update UI
    updateMainButton(newState);
    pip.checked = newState;
    skipIntro.checked = newState;
    skipCredits.checked = newState;

    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "updateSettings" });
    });
  });
});

// Individual toggles
[pip, skipIntro, skipCredits, debug].forEach((el) => {
  el.addEventListener("change", (e) => {
    const key = el.id;
    const value = e.target.checked;
    chrome.storage.sync.set({ [key]: value });

    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "updateSettings" });
    });
  });
});
