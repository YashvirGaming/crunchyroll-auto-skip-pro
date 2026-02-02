const toggle = document.getElementById("toggle");

chrome.storage.sync.get("enabled", res => {
  toggle.checked = res.enabled !== false;
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});
