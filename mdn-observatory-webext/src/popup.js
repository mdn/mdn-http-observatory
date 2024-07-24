document.addEventListener("DOMContentLoaded", function () {
  const querying = browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  querying.then(async (tabs) => {
    const url = new URL(tabs[0].url);
    const apiUrl = `https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=${encodeURIComponent(
      url.host
    )}`;
    const res = await fetch(apiUrl, { method: "POST" });
    const result = await res.json();
    console.log("RESULT", result);
    document.getElementById("grade").textContent = result.scan.grade;
  });
  document.getElementById("grade").textContent = "…";
});
