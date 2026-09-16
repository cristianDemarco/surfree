const AD_SELECTORS = [
  "ins.adsbygoogle",
  '[id*="google_ads"]',
  '[class*="ad-container"]',
  '[id*="div-gpt-ad"]',
  '[class*="taboola"]',
  '[class*="outbrain"]',
  '[class*="advertisement"]',
];

let hiddenTotalCount = 0;

function hideAdElements() {
  const elements = document.querySelectorAll(AD_SELECTORS.join(","));
  let newlyHidden = 0;

  elements.forEach((el) => {
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("height", "0", "important");
    newlyHidden++;
  });

  if (newlyHidden > 0) {
    hiddenTotalCount += newlyHidden;

    chrome.runtime
      .sendMessage({
        type: "ADS_HIDDEN",
        count: newlyHidden,
      })
      .catch(() => {});
  }
}

hideAdElements();
const observer = new MutationObserver(hideAdElements);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
