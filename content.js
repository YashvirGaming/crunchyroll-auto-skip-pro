console.log("Crunchyroll Auto Skip PRO loaded");

let skipSegments = null;
let lastVideo = null;

function getVideo() {
  return document.querySelector("video");
}

function getTitle() {
  return document.title
    .replace("- Crunchyroll", "")
    .replace(/Episode\s+\d+.*/i, "")
    .trim();
}

function getEpisodeNumber() {
  const m = document.title.match(/Episode\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

function getAniListId(title) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      { type: "GET_ANILIST_ID", title },
      res => resolve(res?.id)
    );
  });
}

async function loadSkipData() {
  const title = getTitle();
  const episode = getEpisodeNumber();
  if (!title || !episode) return;

  const id = await getAniListId(title);
  if (!id) return;

  const res = await fetch(
    `https://api.aniskip.com/v2/skip-times/${id}/${episode}?types[]=op&types[]=ed&types[]=recap`
  );

  const json = await res.json();
  if (json?.found) skipSegments = json.results;
}

function showIndicator(text) {
  const el = document.createElement("div");
  el.textContent = text;
  el.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #f47521;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    z-index: 9999;
    font-size: 13px;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function applySkip(video) {
  if (!skipSegments) return;

  skipSegments.forEach(s => {
    const { startTime, endTime } = s.interval;

    if (
      video.currentTime >= startTime &&
      video.currentTime <= endTime
    ) {
      video.currentTime = endTime + 0.15;

      if (s.skipType === "op") showIndicator("Opening skipped ✓");
      if (s.skipType === "ed") showIndicator("Ending skipped ✓");
      if (s.skipType === "recap") showIndicator("Recap skipped ✓");
    }
  });
}

setInterval(() => {
  chrome.storage.sync.get("enabled", async res => {
    if (res.enabled === false) return;

    const video = getVideo();
    if (!video) return;

    if (video !== lastVideo) {
      lastVideo = video;
      skipSegments = null;
      await loadSkipData();
    }

    applySkip(video);
  });
}, 500);
