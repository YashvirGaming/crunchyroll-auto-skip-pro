function init() {
  window.__cr_settings.loadSettings();
  window.__cr_skipEngine.startObserver();

  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.code === "KeyS") {
      const newState = window.__cr_settings.toggleEnabled();
      window.__cr_feedback.showMessage(
        "Auto-Skip " + (newState ? "Enabled ✅" : "Disabled ❌")
      );
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
