export function getMinutesToMidnight() {
  const now = new Date();
  const midnight = new Date().setHours(24, 0, 0, 0);

  return (midnight - now) / 1000 / 60;
}

export function createDailyAlarm() {
  chrome.alarms.create("dailyCountReset", {
    delayInMinutes: getMinutesToMidnight(),
    periodInMinutes: 1440,
  });
}

export function setupDailyAlarm() {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "dailyCountReset") {
      const today = new Date().toISOString().split("T")[0];
      chrome.storage.local.set({
        blockedToday: 0,
        lastUpdate: today,
      });
    }
  });
}
