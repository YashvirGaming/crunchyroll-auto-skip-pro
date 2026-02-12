let observer = null;

function logDebug(...args) {
  if (window.__cr_settings?.getSettings()?.debug) {
    console.debug("Crunchyroll AutoSkip Pro:", ...args);
  }
}

function findAndClickSkip() {
  if (!window.__cr_settings?.getSettings()?.enabled) return;

  const candidates = document.querySelectorAll("button, div[role='button']");

  for (const el of candidates) {
    const text = (el.innerText || el.textContent || "").toLowerCase();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();

    if (
      text.includes("skip intro") ||
      text.includes("skip credits") ||
      aria.includes("skip")
    ) {
      logDebug("Clicking skip button:", el);
      el.click();
      window.__cr_feedback?.showMessage("Skipped ⏭");
    }
  }
}

function startObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    findAndClickSkip();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  logDebug("MutationObserver started");
}

window.__cr_skipEngine = {
  startObserver
};
