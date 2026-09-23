import { cleanDomain } from "../util.js";

async function loadPopupData() {
  let stats = await chrome.storage.local.get([
    "lastMatchedCount",
    "totalBlocked",
    "blockedToday",
    "statsByDomain",
  ]);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url) return;

  const domain = new URL(tab.url).hostname;

  const domainBlockedCount = getDomainBlockedCount(stats, domain);

  const total = stats.totalBlocked || 0;
  const today = stats.blockedToday || 0;

  let text = document.createElement("div");

  text.innerHTML = `
  <p><strong>Bloccati in totale:</strong> ${total}</p>
  <p><strong>Bloccati oggi:</strong> ${today}</p>
  <p><strong>Bloccati in questo dominio:</strong> ${domainBlockedCount}</p>`;

  const header = document.getElementById("main");
  header.insertAdjacentElement("afterend", text);

  await handleExtensionButton();
  await handleWhitelistButton(domain);
}

function getDomainBlockedCount(stats, domain) {
  const statsByDomain = stats.statsByDomain || {};
  const domainBlockedCount = statsByDomain[domain] || 0;

  return domainBlockedCount;
}

async function handleExtensionButton() {
  const toggleButton = document.getElementById("toggleExtension");
  const data = await chrome.storage.local.get("isEnabled");
  toggleButton.checked = data.isEnabled;

  toggleButton.addEventListener("change", async (event) => {
    const isChecked = event.target.checked;
    await chrome.storage.local.set({ isEnabled: isChecked });
  });
}

async function handleWhitelistButton(inputDomain) {
  const domain = cleanDomain(inputDomain);
  const toggleButton = document.getElementById("toggleWhitelist");
  const data = await chrome.storage.local.get("whitelist");
  const domains = data.whitelist || [];

  toggleButton.checked = domains.includes(domain);

  toggleButton.addEventListener("change", async (event) => {
    chrome.runtime.sendMessage({
      type: "WHITELIST_TOGGLE",
      toggleValue: event.target.checked,
      domain: domain,
    });
  });
}

document.addEventListener("DOMContentLoaded", loadPopupData);
