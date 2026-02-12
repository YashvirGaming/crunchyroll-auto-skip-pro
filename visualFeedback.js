// Coded by Yashvir Gaming

function createNotification(message, type = 'info', duration = 2000, options = {}) {
  if (window.__cr_activeNotification) {
    const { node, hideTimeout, removeTimeout } = window.__cr_activeNotification;
    if (hideTimeout) clearTimeout(hideTimeout);
    if (removeTimeout) clearTimeout(removeTimeout);
    if (node && node.parentNode) {
      node.parentNode.removeChild(node);
    }
    window.__cr_activeNotification = null;
  }

  const notification = document.createElement('div');
  
  const colors = {
    info: '#3b82f6',
    success: '#22a852',
    error: '#c53939',
    warning: '#f59e0b'
  };
  
  const basePosition = options.position || 'top-right';
  const positioning =
    basePosition === 'top-center'
      ? 'top: 20px; left: 50%; right: auto; --crunchy-x: -50%; transform: translateX(-50%);'
      : 'top: 20px; right: 20px; left: auto; --crunchy-x: 0;';

  notification.style.cssText = `
    position: fixed;
    ${positioning}
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: crunchySkipFadeIn 0.2s ease-out;
    pointer-events: none;
    max-width: 320px;
    word-wrap: break-word;
    text-align: center;
  `;
  
  notification.textContent = message;
  
  if (!document.querySelector('#crunchy-skip-styles')) {
    const style = document.createElement('style');
    style.id = 'crunchy-skip-styles';
    style.textContent = `
      @keyframes crunchySkipFadeIn {
        from {
          opacity: 0;
          transform: translateX(var(--crunchy-x, 0)) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(var(--crunchy-x, 0)) translateY(0);
        }
      }
      @keyframes crunchySkipFadeOut {
        from {
          opacity: 1;
          transform: translateX(var(--crunchy-x, 0)) translateY(0);
        }
        to {
          opacity: 0;
          transform: translateX(var(--crunchy-x, 0)) translateY(-10px);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);

  const hideTimeout = setTimeout(() => {
    notification.style.animation = 'crunchySkipFadeOut 0.3s ease-in forwards';
    const removeTimeout = setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (window.__cr_activeNotification && window.__cr_activeNotification.node === notification) {
        window.__cr_activeNotification = null;
      }
    }, 300);
    if (window.__cr_activeNotification && window.__cr_activeNotification.node === notification) {
      window.__cr_activeNotification.removeTimeout = removeTimeout;
    }
  }, duration);

  window.__cr_activeNotification = { node: notification, hideTimeout, removeTimeout: null };
  
  return notification;
}

function logDebug(...args) {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.debug) return;
  console.debug('Crunchyroll-AutoSkip PRO:', ...args);
}

if (typeof window !== 'undefined') {
  window.__cr_feedback = {
    createNotification,
    showSuccess: (message, duration, options) => createNotification(message, 'success', duration, options),
    showError: (message, duration, options) => createNotification(message, 'error', duration, options),
    showWarning: (message, duration, options) => createNotification(message, 'warning', duration, options),
    showInfo: (message, duration, options) => createNotification(message, 'info', duration, options),
    showStatus: (enabled) =>
      createNotification(
        `Crunchyroll-AutoSkip PRO: Auto-skip ${enabled ? 'Enabled' : 'Disabled'}`,
        enabled ? 'success' : 'error',
        2000,
        { position: 'top-center' }
      )
  };
}
