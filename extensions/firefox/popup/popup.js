const DEFAULTS = {
  backendUrl: "https://hattrick2shopping-production.up.railway.app",
  backendPort: "",
  autoCapture: false,
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

  async function loadSettings() {
    try {
      const saved = await browser.storage.local.get(Object.keys(DEFAULTS));
      backendUrlInput.value = saved.backendUrl ?? DEFAULTS.backendUrl;
      backendPortInput.value = saved.backendPort ?? DEFAULTS.backendPort;
      autoCaptureCheck.checked = saved.autoCapture ?? DEFAULTS.autoCapture;
    } catch {}
  }

  async function saveSettings() {
    try {
      await browser.storage.local.set({
        backendUrl: backendUrlInput.value,
        backendPort: backendPortInput.value,
        autoCapture: autoCaptureCheck.checked,
      });
    } catch {}
  }

  await loadSettings();

  saveBtn.addEventListener("click", async () => {
    await saveSettings();
    statusEl.textContent = "Guardado ✓";
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
    statusEl.textContent = "Restablecido ✓";
    statusEl.style.color = "green";
    setTimeout(() => healthCheck(), 1000);
  });

  autoCaptureCheck.addEventListener("change", async () => {
    await saveSettings();
  });

  captureBtn.addEventListener("click", async () => {
    captureResult.textContent = "Capturando...";
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        captureResult.textContent = "No hay página activa";
        return;
      }
      const resp = await browser.tabs.sendMessage(tabs[0].id, { type: "MANUAL_CAPTURE" });
      if (resp?.ok) {
        captureResult.textContent = `✓ ${resp.count} jugadores capturados`;
      } else {
        captureResult.textContent = resp?.error || "Error al capturar";
      }
    } catch {
      captureResult.textContent = "No hay página de transferencias abierta";
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
    statusEl.textContent = "Verificando...";
    statusEl.style.color = "gray";
    const origin = getBackendUrl();
    if (!origin) {
      statusEl.textContent = "URL inválida";
      statusEl.style.color = "red";
      captureResult.textContent = "Revisa la URL del backend";
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
          statusEl.textContent = "Conectado ✓";
          statusEl.style.color = "green";
        } else {
          statusEl.textContent = "No es el servidor correcto";
          statusEl.style.color = "red";
          captureResult.textContent = "El servidor no se identifica como hattrick2shopping";
        }
      } else {
        const text = await resp.text().catch(() => "");
        statusEl.textContent = `Error ${resp.status}`;
        statusEl.style.color = "red";
        captureResult.textContent = `${resp.status} ${resp.statusText}`;
      }
    } catch (err) {
      statusEl.textContent = "No disponible";
      statusEl.style.color = "red";
      captureResult.textContent = `${err.message || err}`;
    }
  }

  healthCheck();
});
