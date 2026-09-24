import { whitelistDomain, unwhitelistDomain } from "./domain.js";
import { createDailyAlarm, setupDailyAlarm } from "./alarms.js";

setupDailyAlarm();

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
    console.log("Net rules activated.");
  } else {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: [
        "easylist_ads",
        "easylist_trackers",
        "easylist_popups",
      ],
    });
    console.log("Net rules deactivated.");
  }
}

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

/* chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  console.log("Applied rule:", {
    urlRichiesta: info.request.url,
    ruleId: info.rule.ruleId,
    rulesetId: info.rule.rulesetId,
    initiator: info.request.initiator,
  });
}); */
