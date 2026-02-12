// Coded by Yashvir Gaming

const CLICK_DEBOUNCE_MS = 1200;
const FALLBACK_SCAN_MS = 10000;

const CANDIDATE_SELECTOR = [
  'button',
  '[role="button"]',
  'a[role="button"]',
  '[aria-label*="skip" i]',
  '[data-testid*="skip" i]'
].join(', ');

const introKeywords = [
  /skip intro/i,
  /skip recap/i
];

const endingKeywords = [
  /skip credits/i,
  /skip preview/i
];

let lastClickAt = 0;
let fallbackHandle = null;
let observerActive = false;
let mutationScheduled = false;
const clickedTargets = new WeakSet();

const observer = new MutationObserver(() => scheduleScan('mutation'));

function logDebug(...args) {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.debug) return;
  console.debug('Crunchyroll-AutoSkip PRO:', ...args);
}

function normalizeText(value) {
  return (value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function safeClick(el) {
  if (!el) return false;
  try {
    el.click();
    logDebug('Clicked element via native click');
    return true;
  } catch (err) {
    logDebug('Native click failed, dispatching MouseEvent', err);
    try {
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      el.dispatchEvent(ev);
      return true;
    } catch (err2) {
      console.warn('Crunchyroll-AutoSkip PRO: failed to click element', err2);
      return false;
    }
  }
}

function canClickNow() {
  return Date.now() - lastClickAt > CLICK_DEBOUNCE_MS;
}

function collectLabelStrings(el) {
  if (!el) return [];
  const strings = new Set();
  const add = (value) => {
    if (value) strings.add(value);
  };

  const attr = (name) => (el.getAttribute && el.getAttribute(name)) || '';

  add(attr('aria-label'));
  add(attr('title'));
  add(attr('data-testid'));
  add(el.dataset && el.dataset.testid);

  const labelledBy = attr('aria-labelledby');
  if (labelledBy) {
    labelledBy.split(/\s+/).forEach((id) => {
      const labelEl = document.getElementById(id);
      if (labelEl) add(labelEl.innerText || labelEl.textContent || '');
    });
  }

  add(el.innerText || el.textContent || '');

  return Array.from(strings);
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
  if (!labels.length) return null;
  if (matchKeywords(labels, introKeywords)) return 'intro';
  if (matchKeywords(labels, endingKeywords)) return 'ending';
  return null;
}

function shouldClick(type) {
  const settings = window.__cr_settings?.getSettings();
  return (type === 'intro' && settings?.skipIntro) || (type === 'ending' && settings?.skipEnding);
}

function getCandidateElements() {
  return document.querySelectorAll(CANDIDATE_SELECTOR);
}

function scheduleScan(reason) {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.enabled) return;
  if (mutationScheduled) return;
  mutationScheduled = true;
  requestAnimationFrame(() => {
    mutationScheduled = false;
    scanAndClick(reason);
  });
}

function scanAndClick(reason = 'manual') {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.enabled) return false;

  const candidates = Array.from(getCandidateElements());
  logDebug(`Scanning ${candidates.length} candidate elements`, { reason });

  for (const el of candidates) {
    if (!el.isConnected) continue;
    if (clickedTargets.has(el)) continue;

    const kind = classifyButton(el);
    if (!kind || !shouldClick(kind)) continue;
    if (!canClickNow()) continue;

    const delay = Math.max(0, Number.isFinite(settings.clickDelayMs) ? settings.clickDelayMs : 200);
    clickedTargets.add(el);
    lastClickAt = Date.now();
    setTimeout(() => safeClick(el), delay);
    logDebug(`Scheduled ${kind} click`, { delay, reason });
    return true;
  }

  scheduleFallbackScan();
  return false;
}

function startObserving() {
  if (observerActive) return;
  const root = document.body || document.documentElement;
  if (!root) return;
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  observerActive = true;
  logDebug('Mutation observer started');
}

function stopObserving() {
  if (!observerActive) return;
  observer.disconnect();
  observerActive = false;
}

function scheduleFallbackScan() {
  const settings = window.__cr_settings?.getSettings();
  if (!settings?.enabled) return;
  if (fallbackHandle) {
    clearTimeout(fallbackHandle);
    fallbackHandle = null;
  }
  fallbackHandle = setTimeout(() => {
    fallbackHandle = null;
    if (!settings?.enabled) return;
    scheduleScan('fallback');
    scheduleFallbackScan();
  }, FALLBACK_SCAN_MS);
}

function stopFallbackScan() {
  if (!fallbackHandle) return;
  clearTimeout(fallbackHandle);
  fallbackHandle = null;
}

function handleSettingsChange(newSettings) {
  if (newSettings.enabled) {
    startObserving();
    scanAndClick('settings');
    scheduleFallbackScan();
  } else {
    stopObserving();
    stopFallbackScan();
  }
}

if (typeof window !== 'undefined') {
  window.__cr_skipDetection = {
    scanAndClick,
    forceScan: () => scanAndClick('manual'),
    getCandidateElements: () => Array.from(getCandidateElements()),
    classifyButton,
    startObserving,
    stopObserving,
    handleSettingsChange
  };
}