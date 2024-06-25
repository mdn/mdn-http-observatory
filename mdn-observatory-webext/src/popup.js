// @ts-nocheck
document.addEventListener("DOMContentLoaded", function () {
  const querying = browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  querying.then(async (tabs) => {
    const url = new URL(tabs[0].url);
    const apiUrl = `https://http-observatory.security.mozilla.org/api/v1/analyze?host=${encodeURIComponent(
      url.host
    )}`;
    const res = await fetch(apiUrl, { method: "POST" });
    const result = await res.json();
    document.getElementById("grade").textContent = result.grade;
  });
  document.getElementById("grade").textContent = "…";
});
