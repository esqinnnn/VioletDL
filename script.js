const videoUrl = document.getElementById("videoUrl");
const pasteBtn = document.getElementById("pasteBtn");
const downloadBtn = document.getElementById("downloadBtn");
const message = document.getElementById("message");
const historyBox = document.getElementById("history");
const clearHistory = document.getElementById("clearHistory");

let historyItems = JSON.parse(localStorage.getItem("violetHistory") || "[]");

function showHistory() {
  if (!historyItems.length) {
    historyBox.innerHTML = "<p>Hələ video yüklənməyib.</p>";
    return;
  }

  historyBox.innerHTML = historyItems.map(item => `
    <div class="history-item">
      <strong>🎵 TikTok videosu</strong>
      <small>${item.date}</small>
    </div>
  `).join("");
}

pasteBtn.addEventListener("click", async () => {
  try {
    videoUrl.value = await navigator.clipboard.readText();
    message.textContent = "Link əlavə edildi!";
  } catch {
    message.textContent = "Linki əl ilə yapışdır.";
  }
});

downloadBtn.addEventListener("click", () => {
  const link = videoUrl.value.trim();

  if (!link) {
    message.textContent = "Əvvəlcə TikTok linkini daxil et!";
    return;
  }

  if (!/^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//i.test(link)) {
    message.textContent = "Düzgün TikTok linki daxil et!";
    return;
  }

  message.textContent =
    "Link qəbul edildi. Video yükləmə serveri qoşulmalıdır.";
});

clearHistory.addEventListener("click", () => {
  historyItems = [];
  localStorage.removeItem("violetHistory");
  showHistory();
});

showHistory();
