// Coded By Yashvir Gaming

function getSyncStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  return chrome.storage.sync || chrome.storage.local || null;
}

function isExtensionContextValid() {
  return typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);
}

function logDebug(...args) {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.debug) return;
  console.debug('Crunchyroll-AutoSkip PRO:', ...args);
}

function handleKeyboardShortcut(event) {
  const isSKey = event.code === 'KeyS';
  const isPKey = event.code === 'KeyP';
  
  if (event.altKey && event.shiftKey && (isSKey || isPKey) && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    event.stopPropagation();
    
    if (isPKey) {
      try {
        window.__cr_pip?.toggle?.();
      } catch (err) {
        console.warn('Crunchyroll-AutoSkip PRO: PiP toggle failed', err);
      }
      return;
    }

    const currentSettings = window.__cr_settings?.getSettings?.();
    const newValue = !currentSettings?.enabled;
    const storage = isExtensionContextValid() ? getSyncStorage() : null;
    
    if (storage) {
      try {
        storage.set({ enabled: newValue }, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.warn('Crunchyroll-AutoSkip PRO: failed to persist shortcut toggle', chrome.runtime.lastError);
          } else {
            window.__cr_feedback?.showStatus?.(newValue) ||
              window.__cr_feedback?.showInfo?.(`Crunchyroll-AutoSkip PRO: Auto-skip ${newValue ? 'enabled' : 'disabled'}`);
          }
        });
      } catch (err) {
        console.warn('Crunchyroll-AutoSkip PRO: storage set failed (shortcut)', err);
        window.__cr_settings?.applySettings?.({ enabled: newValue });
        window.__cr_feedback?.showStatus?.(newValue) ||
          window.__cr_feedback?.showInfo?.(`Crunchyroll-AutoSkip PRO: Auto-skip ${newValue ? 'enabled' : 'disabled'}`);
      }
    } else {
      window.__cr_settings?.applySettings?.({ enabled: newValue });
      window.__cr_feedback?.showStatus?.(newValue) ||
        window.__cr_feedback?.showInfo?.(`Crunchyroll-AutoSkip PRO: Auto-skip ${newValue ? 'enabled' : 'disabled'}`);
    }
  }
}

function addKeyboardListeners() {
  document.addEventListener('keydown', handleKeyboardShortcut, true);
  window.addEventListener('keydown', handleKeyboardShortcut, true);
  
  document.addEventListener('keydown', handleKeyboardShortcut, { capture: true });
  
  logDebug('Keyboard shortcut listeners added (Alt+Shift+S / Alt+Shift+P)');
}

if (typeof window !== 'undefined') {
  window.__cr_keyboard = {
    addKeyboardListeners
  };
}
