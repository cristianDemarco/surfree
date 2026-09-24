export function cleanDomain(domain) {
  return domain.replace(/^www\./, "").toLowerCase();
}

export function getRuleIdForDomain(currentDomain) {
  const domain = cleanDomain(currentDomain);
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charAt(i);
    hash |= 0;
  }

  return Math.abs(hash) + 1;
}

export async function isDomainWhiteListed(domain) {
  const data = await chrome.storage.local.get("whitelist");
  const list = data.whitelist || [];
  const target = cleanDomain(domain);

  return list.some((domain) => {
    domain === target;
  });
}

export async function whitelistDomain(domain) {
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

export async function unwhitelistDomain(domain) {
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
