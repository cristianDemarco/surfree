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

  const header = document.getElementById("toggleSection");
  header.insertAdjacentElement("afterend", text);

  const toggleButton = document.getElementById("toggle");
  const data = await chrome.storage.local.get("isEnabled");
  toggleButton.checked = data.isEnabled;
  toggleButton.addEventListener("change", async (event) => {
    const isChecked = event.target.checked;
    await chrome.storage.local.set({ isEnabled: isChecked });
  });
}

document.addEventListener("DOMContentLoaded", loadPopupData);
