(() => {
  let lastVideo = null;
  let skipSegments = null;

  function getVideo() {
    return document.querySelector("video");
  }

  function showIndicator(text) {
    if (document.getElementById("cr-auto-skip-toast")) return;

    const div = document.createElement("div");
    div.id = "cr-auto-skip-toast";
    div.textContent = text;

    Object.assign(div.style, {
      position: "fixed",
      bottom: "80px",
      right: "20px",
      background: "rgba(0,0,0,0.8)",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "6px",
      fontSize: "13px",
      zIndex: 9999
    });

    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
  }


  function clickNativeSkipIntro() {
    const skipBtn = document.querySelector(
      'div[role="button"][aria-label="Skip Intro"]'
    );

    if (skipBtn && skipBtn.offsetParent !== null) {
      skipBtn.click();
      showIndicator("Intro skipped ✓");
      return true;
    }

    return false;
  }


  async function getAniListId(title) {
    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ($search: String) {
              Media(search: $search, type: ANIME) {
                id
              }
            }
          `,
          variables: { search: title }
        })
      });

      const json = await res.json();
      return json?.data?.Media?.id || null;
    } catch {
      return null;
    }
  }


  async function loadSkipData() {
    try {
      const titleEl =
        document.querySelector('[data-testid="hero-title"]') ||
        document.querySelector("h1");

      if (!titleEl) return null;

      const title = titleEl.textContent.trim();

      const epMatch = location.pathname.match(/\/watch\/[^/]+\/[^/]+/);
      if (!epMatch) return null;

      const episodeNumber = 1;

      const anilistId = await getAniListId(title);
      if (!anilistId) return null;

      const res = await fetch(
        `https://api.aniskip.com/v2/skip-times/${anilistId}/${episodeNumber}?types[]=op&types[]=recap`
      );

      const json = await res.json();

      if (!json?.results?.length) return null;

      return json.results;
    } catch {
      return null;
    }
  }


  function applySkip(video) {
    if (!skipSegments) return;

    for (const seg of skipSegments) {
      if (
        video.currentTime >= seg.startTime &&
        video.currentTime < seg.endTime
      ) {
        video.currentTime = seg.endTime;
        showIndicator("Intro skipped ✓");
        break;
      }
    }
  }


  setInterval(async () => {
    chrome.storage.sync.get({ enabled: true }, async res => {
      if (!res.enabled) return;

      const video = getVideo();
      if (!video) return;

      if (video !== lastVideo) {
        lastVideo = video;
        skipSegments = await loadSkipData();
      }

      if (skipSegments) {
        applySkip(video);
      } else {
        clickNativeSkipIntro();
      }
    });
  }, 500);
})();
