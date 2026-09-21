async function loadPopupData() {
  let stats = await chrome.storage.local.get([
    "lastMatchedCount",
    "totalBlocked",
    "blockedToday",
    "statsByDomain",
  ]);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url) return;

  const domainBlockedCount = getDomainBlockedCount(stats, tab);

  const total = stats.totalBlocked || 0;
  const today = stats.blockedToday || 0;

  let text = document.createElement("div");

  text.innerHTML = `
  <p><strong>Bloccati in totale:</strong> ${total}</p>
  <p><strong>Bloccati oggi:</strong> ${today}</p>
  <p><strong>Bloccati in questo dominio:</strong> ${domainBlockedCount}</p>`;

  const header = document.getElementById("main");
  header.insertAdjacentElement("afterend", text);

  await handleToggleButton();
}

function getDomainBlockedCount(stats, tab) {
  const url = new URL(tab.url);
  const currentDomain = url.hostname;

  const statsByDomain = stats.statsByDomain || {};
  const domainBlockedCount = statsByDomain[currentDomain] || 0;

  return domainBlockedCount;
}

async function handleToggleButton() {
  const toggleButton = document.getElementById("toggle");
  const data = await chrome.storage.local.get("isEnabled");
  toggleButton.checked = data.isEnabled;

  toggleButton.addEventListener("change", async (event) => {
    const isChecked = event.target.checked;
    await chrome.storage.local.set({ isEnabled: isChecked });
  });
}

document.addEventListener("DOMContentLoaded", loadPopupData);
