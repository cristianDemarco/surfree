const AD_SELECTORS = [
  "ins.adsbygoogle",
  '[id*="google_ads"]',
  '[class*="ad-container"]',
  '[id*="div-gpt-ad"]',
  '[class*="taboola"]',
  '[class*="outbrain"]',
  '[class*="advertisement"]',
];

let observer = null;
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

function startBlocking() {
  hideAdElements();
  if (!observer) {
    observer = new MutationObserver(hideAdElements);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
}

function stopBlocking() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

chrome.storage.onChanged.addListener((changes, areaName), () => {
  if (areaName == "local" && changes.isEnabled) {
    if (changes.isEnabled.value) {
      startBlocking();
    } else {
      stopBlocking();
    }
  }
});

chrome.storage.local.get("isEnabled", (data) => {
  if (data.isEnabled !== false) {
    startBlocking();
  }
});
