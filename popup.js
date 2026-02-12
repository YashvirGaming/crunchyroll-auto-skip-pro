const mainToggle = document.getElementById("mainToggle");
const pip = document.getElementById("pip");
const skipIntro = document.getElementById("skipIntro");
const skipCredits = document.getElementById("skipCredits");
const debug = document.getElementById("debug");


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

mainToggle.addEventListener("click", () => {
  chrome.storage.sync.get(["enabled"], (res) => {
    const newState = !res.enabled;

    chrome.storage.sync.set({
      enabled: newState,
      pip: newState,
      skipIntro: newState,
      skipCredits: newState
    });

    updateMainButton(newState);
    pip.checked = newState;
    skipIntro.checked = newState;
    skipCredits.checked = newState;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (enabled) => {
            window.autoSkipEnabled = enabled;
            window.pipEnabled = enabled;
            window.skipIntroEnabled = enabled;
            window.skipCreditsEnabled = enabled;

            if (window.toggleSkipFeatures) window.toggleSkipFeatures(enabled);
          },
          args: [newState],
        });
      });
    });
  });
});

[pip, skipIntro, skipCredits, debug].forEach((el) => {
  el.addEventListener("change", (e) => {
    const key = el.id;
    const value = e.target.checked;

    chrome.storage.sync.set({ [key]: value });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (key, value) => {
            window[key + "Enabled"] = value;
          },
          args: [key, value],
        });
      });
    });
  });
});
