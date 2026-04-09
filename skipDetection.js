// Coded by Yashvir Gaming
// Version 1.4 - Fixed

const FALLBACK_SCAN_MS = 700;

const DEBOUNCE_PER_TYPE = {
  intro:  1500,
  ending: 1500
};

const CLICKED_EXPIRY_MS = 10000;

const CANDIDATE_SELECTOR = [
  'button',
  '[role="button"]',
  'a[role="button"]',
  '[aria-label*="skip" i]',
  '[data-testid*="skip" i]',
  '[class*="skip" i]',
  '[id*="skip" i]'
].join(', ');

// ─── KEYWORD LISTS ───────────────────────────────────────────────────────────
const introKeywords = [
  /skip\s*intro/i,
  /skip\s*recap/i,
  /skip\s*opening/i,
  /skip\s*prologue/i,
  /skip\s*cold\s*open/i,
];

// endingKeywords: things that appear NEAR END of an episode
const endingKeywords = [
  /skip\s*credits/i,
  /skip\s*ending/i,
  /skip\s*outro/i,
  /skip\s*preview/i,
  /skip\s*branding/i,
  /skip\s*sponsor/i,
];

// ─── STATE ───────────────────────────────────────────────────────────────────
const lastClickAt  = { intro: 0, ending: 0 };
const clickedTargets = new Map();

let fallbackHandle  = null;
let observerActive  = false;
let mutationScheduled = false;
let intervalHandle  = null;
let currentVideoEl  = null;

const observer = new MutationObserver(() => scheduleScan('mutation'));

// ─── LOGGING ─────────────────────────────────────────────────────────────────
function logDebug(...args) {
  if (!window.__cr_settings?.getSettings()?.debug) return;
  console.debug('Crunchyroll-AutoSkip PRO:', ...args);
}

// ─── CLICK HELPERS ───────────────────────────────────────────────────────────
function safeClick(el) {
  if (!el || !el.isConnected) return false;
  try {
    el.click();
    window.__cr_feedback?.showSuccess('⏭ Skipped!', 1500, { position: 'top-center' });
    logDebug('Clicked via native click');
    return true;
  } catch {
    try {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      window.__cr_feedback?.showSuccess('⏭ Skipped!', 1500, { position: 'top-center' });
      return true;
    } catch (err) {
      console.warn('Crunchyroll-AutoSkip PRO: click failed', err);
      return false;
    }
  }
}

function canClickNow(type) {
  return Date.now() - (lastClickAt[type] || 0) > (DEBOUNCE_PER_TYPE[type] || 1500);
}

function wasRecentlyClicked(el) {
  const ts = clickedTargets.get(el);
  if (ts === undefined) return false;
  if (Date.now() - ts > CLICKED_EXPIRY_MS) { clickedTargets.delete(el); return false; }
  return true;
}

function markClicked(el, type) {
  clickedTargets.set(el, Date.now());
  lastClickAt[type] = Date.now();
}

// Purge expired entries to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [el, ts] of clickedTargets.entries()) {
    if (now - ts > CLICKED_EXPIRY_MS) clickedTargets.delete(el);
  }
}, 15000);

function resetClickState() {
  clickedTargets.clear();
  lastClickAt.intro  = 0;
  lastClickAt.ending = 0;
}

// ─── LABEL COLLECTION ────────────────────────────────────────────────────────
// Reads every piece of text associated with an element so we never miss a match
function collectLabelStrings(el) {
  if (!el) return [];
  const strings = new Set();
  const add = (v) => { if (v) strings.add(String(v).trim()); };
  const attr = (n) => el.getAttribute?.(n) || '';

  add(attr('aria-label'));
  add(attr('title'));
  add(attr('data-testid'));
  add(attr('id'));
  add(attr('class'));
  add(el.dataset?.testid);
  add(el.innerText || el.textContent || '');

  // aria-labelledby references
  const labelledBy = attr('aria-labelledby');
  if (labelledBy) {
    labelledBy.split(/\s+/).forEach(id => {
      const lbl = document.getElementById(id);
      if (lbl) add(lbl.innerText || lbl.textContent || '');
    });
  }

  // Child text (Crunchyroll wraps button text in <span>)
  el.querySelectorAll('span, p, div, label').forEach(child => {
    add(child.innerText || child.textContent || '');
  });

  return Array.from(strings);
}

function normalizeText(v) {
  return (v || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function matchKeywords(sourceStrings, keywords) {
  for (const value of sourceStrings) {
    const normalized = normalizeText(value);
    if (!normalized) continue;
    for (const regex of keywords) {
      if (regex.test(normalized)) return true;
    }
  }
  return false;
}

function classifyButton(el) {
  if (!el) return null;
  const labels = collectLabelStrings(el);
  if (matchKeywords(labels, introKeywords))  return 'intro';
  if (matchKeywords(labels, endingKeywords)) return 'ending';
  return null;
}

function shouldClick(type) {
  const s = window.__cr_settings?.getSettings();
  return (type === 'intro' && s?.skipIntro) || (type === 'ending' && s?.skipEnding);
}

// ─── VISIBILITY CHECK ────────────────────────────────────────────────────────
// Don't use offsetParent — unreliable for fixed/sticky parents (Crunchyroll player)
function isVisible(el) {
  if (!el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  return true;
}

// ─── CORE SCAN ───────────────────────────────────────────────────────────────
function scanAndClick(reason = 'manual') {
  if (!window.__cr_settings?.getSettings()?.enabled) return false;

  const candidates = Array.from(document.querySelectorAll(CANDIDATE_SELECTOR));
  logDebug(`Scanning ${candidates.length} candidates [${reason}]`);

  for (const el of candidates) {
    if (!isVisible(el))        continue;
    if (wasRecentlyClicked(el)) continue;

    const kind = classifyButton(el);
    if (!kind || !shouldClick(kind)) continue;
    if (!canClickNow(kind))    continue;

    const delay = Math.max(0, window.__cr_settings?.getSettings()?.clickDelayMs ?? 200);
    markClicked(el, kind);
    setTimeout(() => safeClick(el), delay);
    logDebug(`Queued ${kind} click in ${delay}ms [${reason}]`);
    return true;
  }
  return false;
}

function scheduleScan(reason) {
  if (!window.__cr_settings?.getSettings()?.enabled) return;
  if (mutationScheduled) return;
  mutationScheduled = true;
  requestAnimationFrame(() => { mutationScheduled = false; scanAndClick(reason); });
}

// ─── OBSERVER ────────────────────────────────────────────────────────────────
function startObserving() {
  if (observerActive) return;
  const root = document.body || document.documentElement;
  if (!root) return;
  observer.observe(root, {
    childList: true, subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'data-testid']
  });
  observerActive = true;
  logDebug('Observer started');
}

function stopObserving() {
  if (!observerActive) return;
  observer.disconnect();
  observerActive = false;
}

// ─── FALLBACK / INTERVAL SCANS ───────────────────────────────────────────────
function scheduleFallbackScan() {
  if (!window.__cr_settings?.getSettings()?.enabled) return;
  if (fallbackHandle) { clearTimeout(fallbackHandle); fallbackHandle = null; }
  fallbackHandle = setTimeout(() => {
    fallbackHandle = null;
    if (!window.__cr_settings?.getSettings()?.enabled) return;
    scheduleScan('fallback');
    scheduleFallbackScan();
  }, FALLBACK_SCAN_MS);
}

function stopFallbackScan() {
  if (fallbackHandle) { clearTimeout(fallbackHandle); fallbackHandle = null; }
}

function startContinuousScan() {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => scanAndClick('interval'), 800);
  logDebug('Continuous scan started');
}

function stopContinuousScan() {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
}

// ─── VIDEO LISTENERS ─────────────────────────────────────────────────────────
function attachVideoListener(video) {
  if (!video || video.__cr_listener_attached) return;
  video.__cr_listener_attached = true;
  currentVideoEl = video;
  logDebug('Video listener attached');

  // timeupdate: scan at most every 500ms (fires 4x/sec on most browsers)
  video.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (!video.__cr_lastScan || now - video.__cr_lastScan > 500) {
      video.__cr_lastScan = now;
      scanAndClick('timeupdate');
    }
  });

  // seeked: user dragged slider — reset state so Credits button works from any position
  video.addEventListener('seeked', () => {
    logDebug('Seeked — resetting state');
    resetClickState();
    setTimeout(() => scanAndClick('seeked-100'),  100);
    setTimeout(() => scanAndClick('seeked-600'),  600);
    setTimeout(() => scanAndClick('seeked-1400'), 1400);
  });

  video.addEventListener('play',  () => scanAndClick('play'));
  video.addEventListener('ended', () => resetClickState());
}

// ─── SPA NAVIGATION DETECTION ────────────────────────────────────────────────
// Crunchyroll is a React SPA — navigating episodes doesn't reload the page

function watchForNewVideo() {
  // MutationObserver catches when React swaps in a new <video> element
  new MutationObserver(() => {
    const video = document.querySelector('video');
    if (video && video !== currentVideoEl) {
      logDebug('New video element — re-attaching');
      resetClickState();
      attachVideoListener(video);
      scanAndClick('new-video');
    }
  }).observe(document.body || document.documentElement, { childList: true, subtree: true });
}

function watchForNavigation() {
  // URL polling catches pushState navigation between episodes
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    logDebug('URL changed — resetting for new episode');
    resetClickState();
    currentVideoEl = null;
    setTimeout(() => {
      const video = document.querySelector('video');
      if (video) attachVideoListener(video);
      scanAndClick('navigation');
    }, 1000);
  }, 1000);
}

// ─── SETTINGS CHANGE ─────────────────────────────────────────────────────────
function handleSettingsChange(newSettings) {
  if (newSettings.enabled) {
    startObserving();
    startContinuousScan();
    scheduleFallbackScan();
    scanAndClick('settings-change');
  } else {
    stopObserving();
    stopContinuousScan();
    stopFallbackScan();
  }
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
function waitForPlayerAndStart() {
  const check = () => {
    const video = document.querySelector('video');
    if (video) {
      logDebug('Player found — starting');
      attachVideoListener(video);
      startObserving();
      startContinuousScan();
      scheduleFallbackScan();
      scanAndClick('init');
      watchForNewVideo();
      watchForNavigation();
    } else {
      setTimeout(check, 500);
    }
  };
  check();
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.__cr_skipDetection = {
    scanAndClick,
    forceScan: () => { resetClickState(); scanAndClick('manual'); },
    getCandidateElements: () => Array.from(document.querySelectorAll(CANDIDATE_SELECTOR)),
    classifyButton,
    startObserving,
    stopObserving,
    handleSettingsChange
  };
}

waitForPlayerAndStart();
