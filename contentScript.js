// Coded By Yashvir Gaming

function logDebug(...args) {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.debug) return;
  console.debug('crunchy-skip:', ...args);
}

function initializeExtension() {
  logDebug('Content script initializing...');
  
  const checkModules = () => {
    if (window.__cr_settings && window.__cr_skipDetection && 
        window.__cr_feedback && window.__cr_keyboard) {
      
      try {
        window.__cr_settings.loadSettings();
        window.__cr_settings.listenForSettingChanges();
        
        window.__cr_keyboard.addKeyboardListeners();
        
        logDebug('Content script initialized successfully');
      } catch (error) {
        console.error('crunchy-skip: Initialization error:', error);
        setTimeout(checkModules, 500);
      }
    } else {
      setTimeout(checkModules, 100);
    }
  };
  
  checkModules();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}
