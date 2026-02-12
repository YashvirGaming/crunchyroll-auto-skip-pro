let observer = null;

function logDebug(...args) {
  if (window.__cr_settings?.getSettings()?.debug || window.debugEnabled) {
    console.debug("Crunchyroll AutoSkip Pro:", ...args);
  }
}

function findAndClickSkip() {
  if (!window.autoSkipEnabled) return;

  const candidates = document.querySelectorAll("button, div[role='button']");

  for (const el of candidates) {
    const text = (el.innerText || el.textContent || "").toLowerCase();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();

    if (window.skipIntroEnabled && (text.includes("skip intro") || aria.includes("skip intro"))) {
      logDebug("Clicking Skip Intro:", el);
      el.click();
      window.__cr_feedback?.showMessage("Skipped Intro ⏭");
    }

    if (window.skipCreditsEnabled && (text.includes("skip credits") || aria.includes("skip credits"))) {
      logDebug("Clicking Skip Credits:", el);
      el.click();
      window.__cr_feedback?.showMessage("Skipped Credits ⏭");
    }
  }
}

function startObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    findAndClickSkip();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  logDebug("MutationObserver started");
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
    logDebug("MutationObserver stopped");
  }
}

window.__cr_skipEngine = {
  startObserver,
  stopObserver,
  findAndClickSkip
};
