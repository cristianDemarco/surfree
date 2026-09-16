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

chrome.runtime.onInstalled.addListener(() => {
  createDailyAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyCountReset") {
    const today = new Date().toISOString().split("T")[0];
    chrome.storage.local.set({
      blockedToday: 0,
      lastUpdate: today,
    });
  }
});

async function processNewMatches(newCount) {
  if (newCount <= 0) return;

  const stored = await chrome.storage.local.get([
    "lastMatchedCount",
    "totalBlocked",
    "blockedToday",
    "lastUpdate",
  ]);

  const today = new Date().toISOString().split("T")[0];
  const isNewDay = !stored.lastUpdate || today > stored.lastUpdate;

  chrome.storage.local.set({
    totalBlocked: (stored.totalBlocked || 0) + newCount,
    blockedToday: isNewDay ? newCount : (stored.blockedToday || 0) + newCount,
    lastUpdate: today,
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ADS_HIDDEN") {
    processNewMatches(message.count);
  }
});
