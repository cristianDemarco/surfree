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
