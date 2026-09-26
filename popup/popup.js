import { cleanDomain } from "../background/domain.js";

async function loadPopupData() {
  let stats = await chrome.storage.local.get([
    "lastMatchedCount",
    "totalBlocked",
    "blockedToday",
    "statsByDomain",
  ]);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url) return;

  const url = new URL(tab.url).hostname;
  const domain = cleanDomain(url);

  const domainBlockedCount = getDomainBlockedCount(stats, domain);

  const total = stats.totalBlocked || 0;
  const today = stats.blockedToday || 0;

  let text = document.createElement("div");

  text.innerHTML = `
  <br>
  <p class="statsLabel"><strong>BLOCCATI IN TOTALE</strong></p>
  <strong><p class="statsData">${total}</p></strong>
  <p class="statsLabel"><strong>BLOCCATI  OGGI</strong></p>
  <strong><p class="statsData">${today}</p></strong>
  <p class="statsLabel"><strong>BLOCCATI IN QUESTO DOMINO</strong></p>
  <strong><p class="statsData">${domainBlockedCount}</p></strong>`;

  const header = document.getElementById("main");
  header.insertAdjacentElement("afterend", text);

  await handleExtensionButton(domain);
  await handleWhitelistButton(domain);
}

function getDomainBlockedCount(stats, domain) {
  const statsByDomain = stats.statsByDomain || {};
  const domainBlockedCount = statsByDomain[domain] || 0;

  return domainBlockedCount;
}

async function handleExtensionButton(domain) {
  const toggleExtension = document.getElementById("toggleExtension");
  const extensionSwitch = document.getElementById("extensionSwitch");
  const toggleWhitelist = document.getElementById("toggleWhitelist");

  const data = await chrome.storage.local.get("isEnabled");
  toggleExtension.checked = data.isEnabled;

  extensionSwitch.addEventListener("click", async (event) => {
    if (toggleWhitelist.checked) {
      toggleWhitelist.checked = false;
      chrome.runtime.sendMessage({
        type: "WHITELIST_TOGGLE",
        toggleValue: false,
        domain: domain,
      });
    }

    const isChecked = event.target.checked;
    await chrome.storage.local.set({ isEnabled: isChecked });
  });

  extensionSwitch.addEventListener("animationend", () => {
    extensionSwitch.classList.remove("animation");
  });
}

async function handleWhitelistButton(domain) {
  const data = await chrome.storage.local.get("whitelist");
  const toggleButton = document.getElementById("toggleWhitelist");

  const domains = data.whitelist || [];

  toggleButton.checked = domains.includes(domain);

  toggleButton.addEventListener("click", async (event) => {
    const data = await chrome.storage.local.get("isEnabled");

    if (!data.isEnabled) {
      event.target.checked = !event.target.checked;
      document.getElementById("extensionSwitch").classList.add("animation");
      return;
    }

    chrome.runtime.sendMessage({
      type: "WHITELIST_TOGGLE",
      toggleValue: event.target.checked,
      domain: domain,
    });
  });
}

document.addEventListener("DOMContentLoaded", loadPopupData);
