// Coded By Yashvir Gaming

const PIP_CONTROLS_SELECTOR = [
  '[data-testid*="controls" i]',
  '[class*="controls"]',
  '[class*="control-bar"]',
  '[class*="video-player__controls"]',
  '.player-controls'
].join(', ');

const PIP_SETTINGS_SELECTOR = [
  '[data-testid*="settings" i]',
  '[aria-label*="settings" i]',
  'button[class*="settings"]',
  '.settings-button'
].join(', ');

let pipIntervalHandle = null;
let pipButtonEl = null;
let pipClickHandler = null;
let pipActivationLock = false;
let pipSuppressHandler = null;
let pipObserver = null;
let pipScheduled = false;
const SUPPRESS_EVENTS = ['mousedown', 'mouseup', 'pointerdown', 'touchstart', 'touchend'];

function getSettings() {
  return window.__cr_settings?.getSettings?.();
}

function isDeepVisible(el) {
  let node = el;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const opacity = parseFloat(style.opacity || '1');
    if (style.display === 'none' || style.visibility === 'hidden' || opacity < 0.05) return false;
    node = node.parentElement || node.host || null;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;
  const offscreen = rect.bottom <= 0 || rect.right <= 0 || rect.top >= vh || rect.left >= vw;
  return !offscreen;
}

function detachPipButton(reset = false) {
  if (pipButtonEl?.parentNode) {
    pipButtonEl.parentNode.removeChild(pipButtonEl);
  }
  if (reset) {
    pipButtonEl = null;
    pipClickHandler = null;
    pipSuppressHandler = null;
    pipActivationLock = false;
  }
}

function pipLog(...args) {
  const settings = window.__cr_settings?.getSettings?.();
  if (!settings?.debug) return;
  console.debug('Crunchyroll AutoSkip PRO:', ...args);
}

function ensureStyles() {
  if (document.getElementById('cr-pip-styles')) return;
  const style = document.createElement('style');
  style.id = 'cr-pip-styles';
  style.textContent = `
    .cr-pip-container.ontop {
      width: 40px;
      height: 40px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: transparent;
      color: rgba(255, 255, 255, 0.85);
      line-height: 0;
      vertical-align: middle;
      flex: 0 0 40px;
      z-index: 9999;
      margin: 0;
      align-self: stretch;
    }
    .cr-pip-container.ontop:hover {
      color: #ffffff;
    }
    .cr-pip-container .btn-inner-pip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
    }
    .cr-pip-container .cr-pip-icon {
      width: 20px;
      height: 20px;
      fill: currentColor;
      display: block;
    }
  `;
  document.head.appendChild(style);
}

function findFirstDeep(selector, root = document, visited = new Set()) {
  if (!root || visited.has(root)) return null;
  visited.add(root);
  const direct = root.querySelector?.(selector);
  if (direct) return direct;
  const all = root.querySelectorAll?.('*') || [];
  for (const el of all) {
    if (el.shadowRoot) {
      const match = findFirstDeep(selector, el.shadowRoot, visited);
      if (match) return match;
    }
  }
  return null;
}

function buildPipButton() {
  ensureStyles();
  const container = document.createElement('div');
  container.id = 'Crunchyroll AutoSkip PRO-pip-button';
  container.className = 'cr-pip-container ontop';
  container.setAttribute('role', 'button');
  container.setAttribute('aria-label', 'Picture-in-Picture');

  const inner = document.createElement('div');
  inner.className = 'btn-inner-pip';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('class', 'cr-pip-icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML =
    '<path d="M19.6,11.2h-8.9v6.4h8.8L19.6,11.2L19.6,11.2z M23.9,19.8v-15c0-1.2-1-2.1-2.2-2.1H1.9c-1.2,0-2.2,0.9-2.2,2.1v15c0,1.2,1,2.1,2.2,2.1h19.9C22.9,21.9,23.9,21,23.9,19.8z M21.7,19.8H1.9v-15h19.9V19.8z"></path>';
  inner.appendChild(icon);

  container.appendChild(inner);

  return container;
}

function applyInlineStyles() {
  if (!pipButtonEl) return;
  pipButtonEl.style.position = '';
  pipButtonEl.style.top = '';
  pipButtonEl.style.right = '';
  pipButtonEl.style.marginLeft = '';
  pipButtonEl.style.marginRight = '';
  pipButtonEl.style.padding = '';
  pipButtonEl.style.boxShadow = '';
}

function attachPipButton(video) {
  const settings = getSettings();
  if (!settings?.pipEnabled) {
    detachPipButton(true);
    return;
  }

  const controlsRoot = findFirstDeep('[data-testid="vilos-controls"]') || findFirstDeep('#vilosControlsContainer');

  const controls = findFirstDeep(PIP_CONTROLS_SELECTOR);
  const settingsButton = findFirstDeep('#settingsControl', controls || document) || (controls ? controls.querySelector(PIP_SETTINGS_SELECTOR) : null);
  const controlsVisible = controls ? isDeepVisible(controls) : false;
  const settingsVisible = settingsButton ? isDeepVisible(settingsButton) : false;

  const rootVisible = controlsRoot ? isDeepVisible(controlsRoot) : true;

  if (!rootVisible || !controlsVisible || !settingsButton || !settingsVisible) {
    detachPipButton(true);
    return;
  }

  if (!pipButtonEl) {
    pipButtonEl = buildPipButton();
  }

  if (pipButtonEl.parentNode && pipButtonEl.parentNode !== settingsButton.parentNode) {
    pipButtonEl.parentNode.removeChild(pipButtonEl);
  }

  applyInlineStyles();
  const parent = settingsButton.parentNode;
  if (pipButtonEl.parentNode !== parent || !pipButtonEl.isConnected) {
    parent.insertBefore(pipButtonEl, settingsButton);
    pipLog('placing PiP button inline before settingsControl');
  }
}

function togglePip(video) {
  if (!video) return;
  // Attempt to re-enable PiP if the site disables it
  if (video.disablePictureInPicture) {
    video.removeAttribute('disablepictureinpicture');
    video.disablePictureInPicture = false;
  }
  if (video.controlsList && video.controlsList.contains('nopictureinpicture')) {
    try {
      video.controlsList.remove('nopictureinpicture');
    } catch (err) {
      pipLog('unable to remove nopictureinpicture from controlsList', err);
      const filtered = Array.from(video.controlsList || []).filter((item) => item !== 'nopictureinpicture');
      if (filtered.length !== video.controlsList?.length) {
        video.setAttribute('controlsList', filtered.join(' '));
      }
    }
  }

  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch((err) => {
      pipLog('PiP exit failed', err);
      window.__cr_feedback?.showError?.('Crunchyroll AutoSkip PRO: Unable to exit PiP', 1800);
    });
  } else {
    video
      .requestPictureInPicture()
      .then(() => {
        window.__cr_feedback?.showInfo?.('Crunchyroll AutoSkip PRO: Picture-in-Picture enabled', 1600);
      })
      .catch((err) => {
        pipLog('PiP request failed', err);
        window.__cr_feedback?.showError?.('Crunchyroll AutoSkip PRO: PiP not allowed on this video', 2000);
      });
  }
}

function ensurePipButton() {
  pipScheduled = false;
  const settings = getSettings();
  if (!settings?.pipEnabled) {
    detachPipButton(true);
    return;
  }
  const video = findFirstDeep('video');
  if (!video) return;

  if (!document.pictureInPictureEnabled) {
    pipLog('PiP not enabled in this context');
    return;
  }

  attachPipButton(video);

  if (!pipButtonEl) return;

  if (!pipClickHandler) {
    pipClickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (pipActivationLock) return;
      pipActivationLock = true;
      setTimeout(() => {
        pipActivationLock = false;
      }, 350);
      const currentVideo = findFirstDeep('video') || video;
      togglePip(currentVideo);
    };
    if (pipButtonEl) {
      ['click', 'pointerup'].forEach((evt) => pipButtonEl.addEventListener(evt, pipClickHandler, true));
    }
    if (!pipSuppressHandler) {
      pipSuppressHandler = (ev) => ev.stopPropagation();
    }
    if (pipButtonEl) {
      SUPPRESS_EVENTS.forEach((evt) => pipButtonEl.addEventListener(evt, pipSuppressHandler, true));
    }
  }
}

function startPipButton() {
  if (pipObserver) return;
  pipObserver = new MutationObserver(() => {
    if (pipScheduled) return;
    pipScheduled = true;
    requestAnimationFrame(ensurePipButton);
  });
  pipObserver.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true });
  ensurePipButton();
}

function stopPipButton() {
  if (pipObserver) {
    pipObserver.disconnect();
    pipObserver = null;
  }
  pipScheduled = false;
  if (pipButtonEl && pipButtonEl.parentNode) {
    pipButtonEl.parentNode.removeChild(pipButtonEl);
  }
  if (pipClickHandler && pipButtonEl) {
    ['click', 'pointerup'].forEach((evt) => pipButtonEl.removeEventListener(evt, pipClickHandler, true));
    if (pipSuppressHandler) {
      SUPPRESS_EVENTS.forEach((evt) => pipButtonEl.removeEventListener(evt, pipSuppressHandler, true));
    }
  }
  pipButtonEl = null;
  pipActivationLock = false;
  pipClickHandler = null;
  pipSuppressHandler = null;
}

if (typeof window !== 'undefined') {
  window.createPipButton = startPipButton;
  window.__cr_pip = {
    start: startPipButton,
    stop: stopPipButton,
    toggle: () => {
      const video = findFirstDeep('video');
      if (video) togglePip(video);
    }
  };
}
