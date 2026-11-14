
const API_BASE = "https://violetdl.onrender.com";

const APP_VERSION = "1.0.0";
const UPDATE_INFO_URL =
  "https://esqinnnn.github.io/VioletDL/update.json";
const UPDATE_PAGE_URL =
  "https://esqinnnn.github.io/VioletDL/update.html";

const $ = id => document.getElementById(id);

let downloads = [];
let progressTimer = null;
let progress = 0;

try {
  downloads = JSON.parse(
    localStorage.getItem("violetHistory") || "[]"
  );
} catch {
  downloads = [];
}

// Açılış
window.addEventListener("load", () => {
  setTimeout(() => {
    $("splash").classList.add("hidden");
    $("app").classList.remove("hidden");
  }, 1800);

  renderHistory();
  checkServer();

  setTimeout(checkForUpdate, 2300);
});

// Səhifələr
document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    const pageId = button.dataset.page;

    document.querySelectorAll(".page").forEach(page => {
      page.classList.remove("active");
    });

    document.querySelectorAll(".nav-btn").forEach(nav => {
      nav.classList.remove("active");
    });

    $(pageId).classList.add("active");
    button.classList.add("active");

    if (pageId === "historyPage") renderHistory();

    window.scrollTo(0, 0);
  });
});

// Server
async function checkServer() {
  try {
    const response = await fetch(API_BASE + "/api/status");
    console.log(response.ok ? "Server ONLINE" : "Server OFFLINE");
  } catch {
    console.log("Serverlə əlaqə yoxdur");
  }
}

// Versiya müqayisəsi
function compareVersions(current, latest) {
  const a = current.split(".").map(Number);
  const b = latest.split(".").map(Number);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;

    if (y > x) return 1;
    if (y < x) return -1;
  }

  return 0;
}

// Yeniləmə
async function checkForUpdate() {
  try {
    const response = await fetch(
      UPDATE_INFO_URL + "?t=" + Date.now(),
      { cache: "no-store" }
    );

    if (!response.ok) return;

    const data = await response.json();

    if (
      data.version &&
      compareVersions(APP_VERSION, data.version) > 0
    ) {
      $("updateVersion").textContent =
        "Yeni versiya: " + data.version;

      $("updateDescription").textContent =
        data.notes || "VioletDL üçün yeni yeniləmə hazırdır.";

      $("updateNowBtn").href =
        data.updatePage || UPDATE_PAGE_URL;

      $("updateModal").classList.remove("hidden");
    }
  } catch (error) {
    console.log("Yeniləmə yoxlanmadı:", error);
  }
}

// Link yapışdırmaq
$("pasteBtn").addEventListener("click", async () => {
  try {
    const copiedText = await navigator.clipboard.readText();

    if (!copiedText.trim()) {
      $("status").textContent = "Clipboard boşdur!";
      return;
    }

    $("videoLink").value = copiedText.trim();
    $("status").textContent = "Link yapışdırıldı!";
  } catch {
    $("status").textContent =
      "Clipboard icazəsi yoxdur.";
  }
});

// Tarixçə
function renderHistory() {
  const box = $("history");
  box.innerHTML = "";

  if (!downloads.length) {
    box.innerHTML =
      '<p class="empty">Hələ video yüklənməyib.</p>';
    return;
  }

  downloads.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-item";

    const thumb = document.createElement("div");
    thumb.className = "history-thumb";
    thumb.textContent = "▶";

    const info = document.createElement("div");
    info.className = "history-info";

    const title = document.createElement("b");
    title.textContent = item.title || "TikTok Video";

    const date = document.createElement("small");
    date.textContent = item.date || "";

    info.append(title, date);
    row.append(thumb, info);
    box.appendChild(row);
  });
}

// Tarixçəni silmək
$("clearHistory").addEventListener("click", () => {
  downloads = [];
  localStorage.removeItem("violetHistory");
  renderHistory();
});

// Tarixçəyə əlavə etmək
function saveHistory(title) {
  downloads.unshift({
    title,
    date: new Date().toLocaleString("az-AZ")
  });

  downloads = downloads.slice(0, 50);

  localStorage.setItem(
    "violetHistory",
    JSON.stringify(downloads)
  );

  renderHistory();
}

// Proqres
function updateProgress(value) {
  progress = Math.min(100, Math.max(0, value));

  $("progressPercent").textContent = progress + "%";
  $("progressFill").style.width = progress + "%";
}

function startProgress() {
  clearInterval(progressTimer);

  progress = 0;
  $("progressBox").classList.remove("hidden");
  $("progressText").textContent = "Video hazırlanır...";

  updateProgress(0);

  progressTimer = setInterval(() => {
    if (progress < 95) updateProgress(progress + 1);
  }, 150);
}

function finishProgress() {
  clearInterval(progressTimer);
  updateProgress(100);
  $("progressText").textContent = "Yükləmə tamamlandı!";
}

function failProgress() {
  clearInterval(progressTimer);
  $("progressText").textContent = "Yükləmə alınmadı!";
}

// TikTok linki
function isTikTokLink(link) {
  try {
    const url = new URL(link);
    return /(^|\.)tiktok\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

// Video yükləmə
$("downloadBtn").addEventListener("click", async () => {
  const link = $("videoLink").value.trim();
  const button = $("downloadBtn");

  if (!link) {
    $("status").textContent =
      "Əvvəlcə TikTok linkini əlavə et!";
    return;
  }

  if (!isTikTokLink(link)) {
    $("status").textContent =
      "Düzgün TikTok linki daxil et!";
    return;
  }

  button.disabled = true;
  button.textContent = "Yüklənir...";
  startProgress();

  try {
    const response = await fetch(API_BASE + "/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: link })
    });

    if (!response.ok) {
      let message = "Video yüklənmədi.";

      try {
        const data = await response.json();
        message = data.error || data.message || message;
      } catch {}

      throw new Error(message);
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();

      const fileUrl =
        data.downloadUrl ||
        data.download_url ||
        data.url;

      if (!fileUrl) {
        throw new Error("Server video linkini göndərmədi.");
      }

      const fullUrl = new URL(fileUrl, API_BASE).href;

      const a = document.createElement("a");
      a.href = fullUrl;
      a.download = "VioletDL_video.mp4";
      a.target = "_blank";
      a.rel = "noopener";

      document.body.appendChild(a);
      a.click();
      a.remove();

      saveHistory(data.title || "TikTok Video");
    } else {
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "VioletDL_video.mp4";

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);

      saveHistory("TikTok Video");
    }

    finishProgress();
    $("status").textContent =
      "Video endirilməyə göndərildi!";
    $("videoLink").value = "";

  } catch (error) {
    failProgress();
    $("status").textContent =
      error.message || "Xəta baş verdi!";
  } finally {
    button.disabled = false;
    button.textContent = "⬇ Videonu Yüklə";
  }
});
