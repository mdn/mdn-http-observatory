/* eslint-disable no-irregular-whitespace */
document.addEventListener("DOMContentLoaded", function () {
  const port = browser.runtime.connect();
  let url;
  let hostname;

  function setUIQuerying(querying = true) {
    if (querying) {
      document.getElementById("result").classList.add("visually-hidden");
      document.getElementById("scanning").classList.remove("visually-hidden");
    } else {
      document.getElementById("result").classList.remove("visually-hidden");
      document.getElementById("scanning").classList.add("visually-hidden");
    }
  }

  /** @typedef {{ result: any | undefined, error: string | undefined }} responseMessage */

  function setUIResult(/** @type responseMessage */ msg) {
    if (msg.error) {
      setUIQuerying(true);
      return;
    }

    if (msg.result) {
      const res = msg.result;
      document.getElementById("grade").textContent = res.scan.grade;
      document
        .getElementById("grade")
        .classList.remove(
          "grade-a",
          "grade-b",
          "grade-c",
          "grade-d",
          "grade-f"
        );
      document
        .getElementById("grade")
        .classList.add(`grade-${res.scan.grade.toLowerCase().slice(0, 1)}`);
      document.getElementById("score").textContent = `${res.scan.score} / 100`;
      document.getElementById("tests").textContent =
        `${res.scan.tests_passed} / ${res.scan.tests_quantity}`;
      setUIQuerying(false);
    }
  }

  const querying = browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  querying.then(async (tabs) => {
    if (tabs.length > 0) {
      const tabId = tabs[0].id;
      url = new URL(tabs[0].url);
      hostname = url.hostname;
      for (const el of document.getElementsByClassName("click-handler")) {
        el.addEventListener("click", () => {
          const obsUrl = `https://developer.mozilla.org/en-US/observatory/analyze?host=${encodeURIComponent(
            url.hostname
          )}`;
          browser.tabs.create({ url: obsUrl }).then(() => {
            window.close();
          });
        });
      }

      port.onMessage.addListener((/** @type responseMessage */ msg) => {
        setUIResult(msg);
        // Poll for data if we did not finish scanning.
        if (msg.error) {
          setTimeout(() => {
            port.postMessage({ type: "getData", tabId, hostname });
          }, 500);
        }
      });
      // request result from backend
      port.postMessage({ type: "getData", tabId, hostname });
    }
  });
  setUIQuerying(true);
});
