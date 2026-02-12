const DEFAULT_SETTINGS = {
  enabled: true,
  debug: false
};

let currentSettings = { ...DEFAULT_SETTINGS };

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (data) => {
    currentSettings = data;
  });
}

function toggleEnabled() {
  currentSettings.enabled = !currentSettings.enabled;
  chrome.storage.sync.set({ enabled: currentSettings.enabled });
  return currentSettings.enabled;
}

function getSettings() {
  return currentSettings;
}

window.__cr_settings = {
  loadSettings,
  toggleEnabled,
  getSettings
};
