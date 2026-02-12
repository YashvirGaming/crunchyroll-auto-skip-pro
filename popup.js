const defaults = { enabled: true, skipIntro: true, skipEnding: true, clickDelayMs: 200, debug: false, pipEnabled: true };
let currentSettings = { ...defaults };

function $(id) {
  return document.getElementById(id);
}

function getStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  return chrome.storage.sync || chrome.storage.local || null;
}

function parseDelay(value) {
  const parsed = parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return defaults.clickDelayMs;
}

function applySettings(values) {
  currentSettings = { ...defaults, ...values };
  $('skipIntro').checked = currentSettings.skipIntro;
  $('skipEnding').checked = currentSettings.skipEnding;
  $('debug').checked = currentSettings.debug;
  $('clickDelayMs').value = currentSettings.clickDelayMs;
  const pipToggle = $('pipEnabled');
  if (pipToggle) pipToggle.checked = currentSettings.pipEnabled;

  const toggleButton = $('toggleEnabled');
  if (toggleButton) {
    const enabled = currentSettings.enabled;
    const hint = ' (Alt+Shift+S / \u2325\u21E7S)'; // ⌥⇧S for macOS
    toggleButton.textContent = enabled ? `Disable auto-skip${hint}` : `Enable auto-skip${hint}`;
    toggleButton.classList.toggle('disable', enabled);
    toggleButton.classList.toggle('enable', !enabled);
  }

  const fieldset = document.querySelector('fieldset');
  if (fieldset) {
    fieldset.disabled = !currentSettings.enabled;
  }
}

function loadSettings() {
  const storage = getStorage();
  if (!storage) {
    applySettings(defaults);
    return;
  }

  storage.get(defaults, (res) => {
    if (chrome.runtime && chrome.runtime.lastError) {
      console.warn('Crunchyroll-AutoSkip PRO: using defaults in popup due to storage error', chrome.runtime.lastError);
      applySettings(defaults);
      return;
    }
    applySettings(res || defaults);
  });
}

function persist(partialSettings) {
  currentSettings = { ...currentSettings, ...partialSettings };
  const storage = getStorage();
  if (!storage) {
    applySettings(currentSettings);
    return;
  }
  storage.set(partialSettings, () => {
    if (chrome.runtime && chrome.runtime.lastError) {
      console.warn('Crunchyroll-AutoSkip PRO: failed to persist popup settings', chrome.runtime.lastError);
    }
  });
}

function bindEvents() {
  const toggleButton = $('toggleEnabled');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      persist({ enabled: !currentSettings.enabled });
    });
  }

  ['skipIntro', 'skipEnding', 'debug'].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('change', () => {
      persist({ [id]: el.checked });
    });
  });

  const pipToggle = $('pipEnabled');
  if (pipToggle) {
    pipToggle.addEventListener('change', () => {
      persist({ pipEnabled: pipToggle.checked });
    });
  }

  const delayInput = $('clickDelayMs');
  if (delayInput) {
    ['change', 'blur'].forEach((evt) => {
      delayInput.addEventListener(evt, () => {
        const value = parseDelay(delayInput.value);
        delayInput.value = value;
        persist({ clickDelayMs: value });
      });
    });
  }

}

function observeStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.onChanged) return;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' && areaName !== 'local') return;
    const delta = {};
    let changed = false;
    Object.keys(changes).forEach((key) => {
      if (key in defaults) {
        delta[key] = changes[key].newValue;
        changed = true;
      }
    });
    if (changed) {
      applySettings({ ...currentSettings, ...delta });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  bindEvents();
  observeStorage();
});
