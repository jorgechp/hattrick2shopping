document.addEventListener("DOMContentLoaded", async () => {
  const statusEl = document.getElementById("status");
  const backendUrlInput = document.getElementById("backendUrl");
  const apiKeyInput = document.getElementById("apiKey");
  const saveBtn = document.getElementById("saveBtn");
  const captureBtn = document.getElementById("captureBtn");
  const autoCaptureCheck = document.getElementById("autoCapture");
  const captureResult = document.getElementById("captureResult");

  try {
    const saved = await browser.storage.local.get(["backendUrl", "apiKey", "autoCapture"]);
    if (saved.backendUrl) backendUrlInput.value = saved.backendUrl;
    if (saved.apiKey) apiKeyInput.value = saved.apiKey;
    if (saved.autoCapture) autoCaptureCheck.checked = true;
  } catch {
    // storage not available
  }

  saveBtn.addEventListener("click", async () => {
    try {
      await browser.storage.local.set({
        backendUrl: backendUrlInput.value,
        apiKey: apiKeyInput.value,
      });
    } catch {}
    statusEl.textContent = "Guardado ✓";
    statusEl.style.color = "green";
    setTimeout(() => healthCheck(), 1000);
  });

  autoCaptureCheck.addEventListener("change", async () => {
    try {
      await browser.storage.local.set({ autoCapture: autoCaptureCheck.checked });
    } catch {}
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

  async function healthCheck() {
    const backendUrl = backendUrlInput.value || "https://hattrick2shopping-production.up.railway.app";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(`${backendUrl}/api/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        statusEl.textContent = "Conectado ✓";
        statusEl.style.color = "green";
      } else {
        statusEl.textContent = "Error en backend";
        statusEl.style.color = "red";
      }
    } catch {
      statusEl.textContent = "Backend no disponible";
      statusEl.style.color = "orange";
    }
  }

  healthCheck();
});
