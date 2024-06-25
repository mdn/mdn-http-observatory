// @ts-nocheck
browser.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) {
    const tab = await browser.tabs.get(details.tabId);
    const url = new URL(tab.url);
    const hostname = url.hostname;

    let apiResult;

    // check for a cached version
    const cachedResult = await browser.storage.local.get(hostname);
    if (cachedResult[hostname]) {
      // check timestamp
      const ts = new Date(cachedResult[hostname].end_time);
      const now = new Date();
      // 24 hours
      const CACHE_PERIOD_MS = 1000 * 60 * 60 * 24;
      if (now.getTime() - ts.getTime() < CACHE_PERIOD_MS) {
        apiResult = cachedResult[hostname];
      }
    }

    if (!apiResult) {
      try {
        apiResult = await fetchApiResponse(hostname);
      } catch (error) {
        console.error("Failed to fetch or process API response:", error);
        const iconPath = `img/error.png`;
        browser.action.setIcon({ path: iconPath, tabId: details.tabId });
        return;
      }
    }

    const iconPath = `img/${apiResult.grade}.png`;
    browser.action.setIcon({ path: iconPath, tabId: details.tabId });

    // store result in the cache
    if (apiResult) {
      try {
        const data = {};
        data[hostname] = apiResult;
        await browser.storage.local.set(data);
      } catch (error) {
        console.error(error);
      }
    }
  }
});

async function fetchApiResponse(host) {
  try {
    const apiUrl = `https://http-observatory.security.mozilla.org/api/v1/analyze?host=${encodeURIComponent(
      host
    )}`;
    const res = await fetch(apiUrl, { method: "POST" });
    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
