async function loadPopupData() {
  let stats = await chrome.storage.local.get([
    "lastMatchedCount",
    "totalBlocked",
    "blockedToday",
  ]);

  const total = stats.totalBlocked || 0;
  const today = stats.blockedToday || 0;

  let text = document.createElement("div");

  text.innerHTML = `
  <p><strong>Bloccati in totale:</strong> ${total}</p>
  <p><strong>Bloccati oggi:</strong> ${today}</p>`;

  const header = document.getElementById("intro");
  header.insertAdjacentElement("afterend", text);
}

document.addEventListener("DOMContentLoaded", loadPopupData);
