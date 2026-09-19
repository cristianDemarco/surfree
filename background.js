function getMinutesToMidnight() {
  const now = new Date();
  const midnight = new Date().setHours(24, 0, 0, 0);

  return (midnight - now) / 1000 / 60;
}

function createDailyAlarm() {
  chrome.alarms.create("dailyCountReset", {
    delayInMinutes: getMinutesToMidnight(),
    periodInMinutes: 1440,
  });
}

async function processNewMatches(newCount, domain) {
  if (newCount <= 0) return;

  const stored = await chrome.storage.local.get([
    "lastMatchedCount",
    "totalBlocked",
    "blockedToday",
    "lastUpdate",
    "statsByDomain",
  ]);

  const today = new Date().toISOString().split("T")[0];
  const isNewDay = !stored.lastUpdate || today > stored.lastUpdate;

  const statsByDomain = stored.statsByDomain || {};
  const countByDomain = statsByDomain[domain] || 0;
  statsByDomain[domain] = countByDomain + newCount;

  chrome.storage.local.set({
    totalBlocked: (stored.totalBlocked || 0) + newCount,
    blockedToday: isNewDay ? newCount : (stored.blockedToday || 0) + newCount,
    lastUpdate: today,
    statsByDomain: statsByDomain,
  });
}

async function toggleNetRules(isEnabled) {
  if (isEnabled) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [
        "easylist_ads",
        "easylist_trackers",
        "easylist_popups",
      ],
    });
    console.log("Regole declarativeNetRequest attivate.");
  } else {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: [
        "easylist_ads",
        "easylist_trackers",
        "easylist_popups",
      ],
    });
    console.log("Regole declarativeNetRequest disattivate.");
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyCountReset") {
    const today = new Date().toISOString().split("T")[0];
    chrome.storage.local.set({
      blockedToday: 0,
      lastUpdate: today,
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ADS_HIDDEN") {
    processNewMatches(message.count, message.domain);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName == "local" && changes.isEnabled) {
    const isEnabled = changes.isEnabled.newValue !== false;
    toggleNetRules(isEnabled);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  createDailyAlarm();
  const data = await chrome.storage.local.get("isEnabled");
  const isEnabled = data.isEnabled !== false;
  await toggleNetRules(isEnabled);
});
