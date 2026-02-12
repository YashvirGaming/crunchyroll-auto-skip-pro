const mainToggle = document.getElementById("mainToggle");

chrome.storage.sync.get(
  {
    enabled: true,
    pip: true,
    skipIntro: true,
    skipCredits: true,
    debug: false
  },
  (settings) => {
    updateMainButton(settings.enabled);

    document.getElementById("pip").checked = settings.pip;
    document.getElementById("skipIntro").checked = settings.skipIntro;
    document.getElementById("skipCredits").checked = settings.skipCredits;
    document.getElementById("debug").checked = settings.debug;
  }
);

function updateMainButton(enabled) {
  mainToggle.textContent = enabled
    ? "Disable Auto-Skip"
    : "Enable Auto-Skip";
}

mainToggle.addEventListener("click", () => {
  chrome.storage.sync.get("enabled", (res) => {
    const newState = !res.enabled;
    chrome.storage.sync.set({ enabled: newState });
    updateMainButton(newState);
  });
});

["pip", "skipIntro", "skipCredits", "debug"].forEach(id => {
  document.getElementById(id).addEventListener("change", (e) => {
    chrome.storage.sync.set({ [id]: e.target.checked });
  });
});
