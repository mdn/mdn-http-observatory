// const CACHE_PERIOD_MS = 1000 * 60 * 60 * 24;
const CACHE_PERIOD_MS = 1000 * 60;

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
      const ts = new Date(cachedResult[hostname].scan.scanned_at);
      const now = new Date();
      console.log(
        "CACHING",
        cachedResult[hostname],
        cachedResult[hostname].scan.scanned_at,
        ts,
        now,
        CACHE_PERIOD_MS,
        now.getTime() - ts.getTime()
      );
      // 24 hours
      if (now.getTime() - ts.getTime() < CACHE_PERIOD_MS) {
        console.log("CACHED");
        apiResult = cachedResult[hostname];
      }
    }

    // Nothing cached, get it from the API.
    if (!apiResult) {
      startAnimation(details.tabId);
      try {
        apiResult = await fetchApiResponse(hostname);
      } catch (error) {
        stopAnimation(details.tabId);
        handleError(error, details);
        return;
      }
      stopAnimation(details.tabId);
    }

    const iconPath = `assets/img/${apiResult.scan.grade}.png`;
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

/** @type {{ [key: string]: {timer: any, frameCount: number, direction: number} }} */
const animationTimers = {};

/**
 *
 * @param {number} tabId
 * @returns number
 */
function startAnimation(tabId) {
  // stop any running timers
  if (animationTimers[tabId]?.timer) {
    clearInterval(animationTimers[tabId].timer);
  }
  const timer = setInterval(() => {
    const frameCount = animationTimers[tabId].frameCount;
    let direction = animationTimers[tabId].direction;
    const iconPath = `assets/img/icon-anim-${frameCount + 1}.png`;
    browser.action.setIcon({ path: iconPath, tabId: tabId });
    direction = frameCount >= 12 ? -1 : frameCount <= 0 ? 1 : direction;
    animationTimers[tabId].frameCount = frameCount + direction;
    animationTimers[tabId].direction = direction;
  }, 50);
  animationTimers[tabId] = { timer, frameCount: 0, direction: 1 };
}

/**
 *
 * @param {number} tabId
 */
function stopAnimation(tabId) {
  if (animationTimers[tabId]?.timer) {
    clearInterval(animationTimers[tabId].timer);
    delete animationTimers[tabId];
  }
  // reset the icon to standard
  const iconPath = `assets/img/icon.png`;
  browser.action.setIcon({ path: iconPath, tabId: tabId });
}

/**
 * @param {any} error
 * @param {browser.webNavigation._OnCompletedDetails} details
 */
function handleError(error, details) {
  console.error("Error:", error);
  const iconPath = `assets/img/error.png`;
  browser.action.setIcon({ path: iconPath, tabId: details.tabId });
}
