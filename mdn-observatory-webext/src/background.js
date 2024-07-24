browser.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) {
    console.log("HEY");
    const tab = await browser.tabs.get(details.tabId);
    const url = new URL(tab.url);
    const hostname = url.hostname;

    let apiResult;

    // check for a cached version
    const cachedResult = await browser.storage.local.get(hostname);
    if (cachedResult[hostname]) {
      console.log("CACHED");

      // check timestamp
      const ts = new Date(cachedResult[hostname].scan.end_time);
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
        handleError(error, details);
        return;
      }
    }

    const iconPath = `assets/img/${apiResult.scan.grade}.png`;
    console.log("ICONPATH", iconPath);
    browser.action.setIcon({ path: iconPath, tabId: details.tabId });

    // store result in the cache
    if (apiResult && !apiResult.error) {
      try {
        /** @type {{ [key: string]: any }} */
        const data = {};
        data[hostname] = apiResult;
        await browser.storage.local.set(data);
      } catch (error) {
        console.error(error);
      }
    } else {
      handleError(
        `API result error: ${apiResult.error ? apiResult.error : "No result"}`,
        details
      );
    }
  }
});

/**
 * @param {string} host
 */
async function fetchApiResponse(host) {
  try {
    const apiUrl = `https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=${encodeURIComponent(
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

/**
 * @param {any} error
 */
function handleError(error, details) {
  console.error("Error:", error);
  const iconPath = `assets/img/error.png`;
  browser.action.setIcon({ path: iconPath, tabId: details.tabId });
}
