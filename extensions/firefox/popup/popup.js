const DEFAULTS = {
  backendUrl: "https://hattrick2shopping-production.up.railway.app",
  backendPort: "",
  autoCapture: false,
  lang: detectLanguage(),
}

let currentLang = DEFAULTS.lang

function setLang(lang) {
  currentLang = lang
  document.getElementById("lblBackendUrl").textContent = t("backendUrl", currentLang)
  document.getElementById("lblBackendPort").textContent = t("backendPort", currentLang)
  document.getElementById("saveBtn").textContent = t("save", currentLang)
  document.getElementById("resetBtn").textContent = t("reset", currentLang)
  document.getElementById("lblAutoCapture").textContent = t("autoCapture", currentLang)
  document.getElementById("captureBtn").textContent = t("captureNow", currentLang)
  document.getElementById("lblLanguage").textContent = t("language", currentLang)
  document.getElementById("lblBackend").textContent = t("backend", currentLang) + " "
}

document.addEventListener("DOMContentLoaded", async () => {
  const statusEl = document.getElementById("status");
  const backendUrlInput = document.getElementById("backendUrl");
  const backendPortInput = document.getElementById("backendPort");
  const saveBtn = document.getElementById("saveBtn");
  const resetBtn = document.getElementById("resetBtn");
  const captureBtn = document.getElementById("captureBtn");
  const autoCaptureCheck = document.getElementById("autoCapture");
  const captureResult = document.getElementById("captureResult");
  const langSelect = document.getElementById("langSelect");

  async function loadSettings() {
    try {
      const saved = await browser.storage.local.get(Object.keys(DEFAULTS));
      backendUrlInput.value = saved.backendUrl ?? DEFAULTS.backendUrl;
      backendPortInput.value = saved.backendPort ?? DEFAULTS.backendPort;
      autoCaptureCheck.checked = saved.autoCapture ?? DEFAULTS.autoCapture;
      if (saved.lang && I18N[saved.lang]) {
        currentLang = saved.lang;
      }
    } catch {}
    langSelect.value = currentLang;
    setLang(currentLang);
  }

  async function saveSettings() {
    try {
      await browser.storage.local.set({
        backendUrl: backendUrlInput.value,
        backendPort: backendPortInput.value,
        autoCapture: autoCaptureCheck.checked,
        lang: currentLang,
      });
    } catch {}
  }

  await loadSettings();

  langSelect.addEventListener("change", async () => {
    currentLang = langSelect.value;
    setLang(currentLang);
    await saveSettings();
  });

  saveBtn.addEventListener("click", async () => {
    await saveSettings();
    statusEl.textContent = t("statusSaved", currentLang);
    statusEl.style.color = "green";
    setTimeout(() => healthCheck(), 1000);
  });

  [backendUrlInput, backendPortInput].forEach(el => {
    el.addEventListener("blur", saveSettings);
  });

  resetBtn.addEventListener("click", async () => {
    backendUrlInput.value = DEFAULTS.backendUrl;
    backendPortInput.value = DEFAULTS.backendPort;
    await saveSettings();
    statusEl.textContent = t("statusReset", currentLang);
    statusEl.style.color = "green";
    setTimeout(() => healthCheck(), 1000);
  });

  autoCaptureCheck.addEventListener("change", async () => {
    await saveSettings();
  });

  captureBtn.addEventListener("click", async () => {
    captureResult.textContent = t("capturing", currentLang);
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        captureResult.textContent = t("noActivePage", currentLang);
        return;
      }
      const resp = await browser.tabs.sendMessage(tabs[0].id, { type: "MANUAL_CAPTURE", lang: currentLang });
      if (resp?.ok) {
        captureResult.textContent = t("captured", currentLang, { n: resp.count });
      } else {
        captureResult.textContent = resp?.error || t("captureError", currentLang);
      }
    } catch {
      captureResult.textContent = t("noTransferPage", currentLang);
    }
  });

  function getBackendUrl() {
    let base = (backendUrlInput.value || DEFAULTS.backendUrl).trim();
    if (!base.startsWith("http://") && !base.startsWith("https://")) {
      base = `https://${base}`;
    }
    try {
      const url = new URL(base);
      const port = backendPortInput.value.trim();
      if (port) url.port = port;
      return url.origin;
    } catch {
      return null;
    }
  }

  async function healthCheck() {
    statusEl.textContent = t("statusChecking", currentLang);
    statusEl.style.color = "gray";
    const origin = getBackendUrl();
    if (!origin) {
      statusEl.textContent = t("statusInvalidUrl", currentLang);
      statusEl.style.color = "red";
      captureResult.textContent = t("checkUrl", currentLang);
      return;
    }
    const url = `${origin}/api/health`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (data.app === "hattrick2shopping") {
          statusEl.textContent = t("statusConnected", currentLang);
          statusEl.style.color = "green";
        } else {
          statusEl.textContent = t("statusWrongServer", currentLang);
          statusEl.style.color = "red";
          captureResult.textContent = t("serverNotIdentified", currentLang);
        }
      } else {
        const text = await resp.text().catch(() => "");
        statusEl.textContent = t("statusError", currentLang, { n: resp.status });
        statusEl.style.color = "red";
        captureResult.textContent = t("errorDetail", currentLang, { msg: `${resp.status} ${resp.statusText}` });
      }
    } catch (err) {
      statusEl.textContent = t("statusUnavailable", currentLang);
      statusEl.style.color = "red";
      captureResult.textContent = t("errorDetail", currentLang, { msg: err.message || err });
    }
  }

  healthCheck();
});
