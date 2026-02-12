// Coded by Yashvir Gaming

const defaults = {
  enabled: true,
  skipIntro: true,
  skipEnding: true,
  clickDelayMs: 200,
  debug: false,
  pipEnabled: true
};

let settings = { ...defaults };

function getApplyFunction() {
  if (typeof window !== 'undefined' && window.__cr_settings?.applySettings) {
    return window.__cr_settings.applySettings;
  }
  return applySettings;
}

function getSyncStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  return chrome.storage.sync || chrome.storage.local || null;
}

function applySettings(nextSettings) {
  const sanitized = {
    enabled: nextSettings.enabled !== false,
    skipIntro: nextSettings.skipIntro !== false,
    skipEnding: nextSettings.skipEnding !== false,
    clickDelayMs: Number.isFinite(nextSettings.clickDelayMs) ? nextSettings.clickDelayMs : defaults.clickDelayMs,
    debug: Boolean(nextSettings.debug),
    pipEnabled: nextSettings.pipEnabled !== false
  };

  settings = { ...defaults, ...sanitized };

  logDebug('Settings applied', settings);

  try {
    window.__cr_skipDetection?.handleSettingsChange?.(settings);
  } catch (err) {
    console.warn('Crunchyroll-AutoSkip PRO: skip detection update failed', err);
  }

  try {
    if (settings.pipEnabled) {
      window.__cr_pip?.start?.();
    } else {
      window.__cr_pip?.stop?.();
    }
  } catch (err) {
    console.warn('Crunchyroll-AutoSkip PRO: PiP update failed', err);
  }
  
  return settings;
}

function loadSettings() {
  const storage = getSyncStorage();
  if (!storage) {
    applySettings(defaults);
    return;
  }

  try {
    storage.get(defaults, (items) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
        console.warn('Crunchyroll-AutoSkip PRO: using defaults due to storage error', chrome.runtime.lastError);
        applySettings(defaults);
        return;
      }
      const apply = getApplyFunction();
      apply(items || defaults);
    });
  } catch (err) {
    console.warn('Crunchyroll-AutoSkip PRO: storage unavailable, using defaults', err);
    applySettings(defaults);
  }
}

function listenForSettingChanges() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.onChanged) return;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' && areaName !== 'local') return;
    const delta = { ...settings };
    let changed = false;
    for (const key of Object.keys(changes)) {
      if (key in defaults) {
        delta[key] = changes[key].newValue;
        changed = true;
      }
    }
    if (changed) {
      const apply = getApplyFunction();
      apply(delta);
    }
  });
}

function updateSetting(key, value) {
  const storage = getSyncStorage();
  if (storage) {
    storage.set({ [key]: value }, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        console.warn('Crunchyroll-AutoSkip PRO: failed to persist setting', chrome.runtime.lastError);
      }
    });
  }
}

function getSetting(key) {
  return settings[key];
}

if (typeof window !== 'undefined') {
  window.__cr_settings = {
    defaults,
    getSettings: () => ({ ...settings }),
    getSetting,
    updateSetting,
    applySettings: (newSettings) => applySettings(newSettings),
    loadSettings,
    listenForSettingChanges
  };
}
