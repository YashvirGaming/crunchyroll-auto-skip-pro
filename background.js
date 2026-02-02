const CACHE_KEY = "anilist_cache";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GET_ANILIST_ID") return;

  (async () => {
    const title = msg.title;

    const store = await chrome.storage.local.get(CACHE_KEY);
    const cache = store[CACHE_KEY] || {};

    if (cache[title]) {
      sendResponse({ id: cache[title] });
      return;
    }

    const query = `
      query ($search: String) {
        Media(search: $search, type: ANIME) {
          id
        }
      }
    `;

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { search: title }
      })
    });

    const json = await res.json();
    const id = json?.data?.Media?.id;

    if (id) {
      cache[title] = id;
      await chrome.storage.local.set({ [CACHE_KEY]: cache });
    }

    sendResponse({ id });
  })();

  return true;
});
