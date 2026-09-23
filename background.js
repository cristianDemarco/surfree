import { getRuleIdForDomain, cleanDomain } from "./util.js";

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

  if (message.type === "WHITELIST_TOGGLE") {
    if (message.toggleValue) {
      whitelistDomain(message.domain);
    } else {
      unwhitelistDomain(message.domain);
    }
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

async function whitelistDomain(domain) {
  const targetDomain = cleanDomain(domain);
  const ruleId = getRuleIdForDomain(domain);

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ruleId],
    addRules: [
      {
        id: ruleId,
        priority: 999,
        action: {
          type: "allow",
        },
        condition: {
          initiatorDomains: [domain],
        },
      },
    ],
  });

  const data = await chrome.storage.local.get("whitelist");
  const list = data.whitelist || [];
  if (!list.includes(targetDomain)) {
    list.push(targetDomain);
    await chrome.storage.local.set({ whitelist: list });
  }
}

async function unwhitelistDomain(domain) {
  const targetDomain = cleanDomain(domain);
  const ruleId = getRuleIdForDomain(domain);

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ruleId],
  });

  const data = await chrome.storage.local.get("whitelist");
  const list = data.whitelist || [];
  const updatedList = list.filter((d) => d !== targetDomain);
  await chrome.storage.local.set({ whitelist: updatedList });
}

/* chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  if (info.rule.ruleId === 1) return;
  console.log("Regola applicata:", {
    urlRichiesta: info.request.url,
    ruleId: info.rule.ruleId,
    rulesetId: info.rule.rulesetId,
    initiator: info.request.initiator,
  });
}); */
