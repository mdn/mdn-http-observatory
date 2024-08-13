// const CACHE_PERIOD_MS = 1000 * 60 * 60 * 24;
// const CACHE_PERIOD_MS = 1000 * 60 * 60;
const CACHE_PERIOD_MS = 1000 * 10;

// message type received from popup
/** @typedef {{ type: string, tabId: number, url: URL }} message */

browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (/** @type message */ msg) => {
    if (msg.type === "getData") {
      const { hostname, tabId } = msg;
      const apiResult = await getCachedOrScan(hostname);

      if (apiResult && !apiResult.error) {
        port.postMessage({ result: apiResult });
        const iconPath = `assets/img/${apiResult.scan.grade}.png`;
        browser.action.setIcon({ path: iconPath, tabId: tabId });
      } else {
        port.postMessage({ error: "no result" });
      }
    }
  });

  port.onDisconnect.addListener(() => {
    port = null;
  });
});

browser.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) {
    const tab = await browser.tabs.get(details.tabId);
    const url = new URL(tab.url);
    const hostname = url.hostname;

    const apiResult = await getCachedOrScan(hostname);

    // store result in the cache
    if (apiResult && !apiResult.error) {
      const iconPath = `assets/img/${apiResult.scan.grade}.png`;
      browser.action.setIcon({ path: iconPath, tabId: details.tabId });
    } else {
      handleError(
        `API result error: ${apiResult.error ? apiResult.error : "No result"}`,
        details
      );
    }
  }
});

/**
 *
 * @param {string} hostname
 * @param {number} tabId
 * @returns any
 */
async function getCachedOrScan(hostname, tabId) {
  // Check for a cached version not too old.
  const cachedResult = await browser.storage.local.get(hostname);
  if (cachedResult[hostname]) {
    // check timestamp
    const ts = new Date(cachedResult[hostname].scan.scanned_at);
    const now = new Date();

    if (now.getTime() - ts.getTime() < CACHE_PERIOD_MS) {
      return cachedResult[hostname];
    }
  }

  // Nothing cached, get it from the API.
  startAnimation(tabId);
  let apiResult;
  try {
    apiResult = await fetchApiResponse(hostname);
  } catch (error) {
    stopAnimation(tabId);
    handleError(error, tabId);
    return;
  }
  // Store result in local cache
  /** @type {{ [key: string]: any }} */
  const data = {};
  data[hostname] = apiResult;
  await browser.storage.local.set(data);
  stopAnimation(tabId);
  return apiResult;
}

/**
 * @param {string} host
 */
async function fetchApiResponse(host) {
  const apiUrl = `https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=${encodeURIComponent(
    host
  )}`;
  const res = await fetch(apiUrl, { method: "POST" });
  const result = await res.json();
  if (res.status > 299) {
    console.error(res.status, result);
    throw new Error(result.message || result.error || "API fetch failed");
  }
  return result;
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
 * @param {number} tabId
 */
function handleError(error, tabId) {
  console.error(error);
  const iconPath = `assets/img/error.png`;
  browser.action.setIcon({ path: iconPath, tabId });
}
