let BACKEND_URL = "https://hattrick2shopping-production.up.railway.app";

browser.storage.local.get(["backendUrl", "backendPort"]).then((saved) => {
  if (saved.backendUrl) {
    BACKEND_URL = saved.backendUrl;
    if (saved.backendPort) BACKEND_URL += `:${saved.backendPort}`;
  }
});

browser.storage.onChanged.addListener((changes) => {
  if (changes.backendUrl || changes.backendPort) {
    browser.storage.local.get(["backendUrl", "backendPort"]).then(saved => {
      const base = saved.backendUrl || "https://hattrick2shopping-production.up.railway.app";
      BACKEND_URL = saved.backendPort ? `${base}:${saved.backendPort}` : base;
    });
  }
});

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const resp = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${resp.status}: ${text}`);
  }
  return resp.json();
}

browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "HEARTBEAT") {
    try {
      await apiFetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: message.session_id,
          url: message.url,
          contributor_id: message.contributor_id,
        }),
      });
    } catch {}
    return;
  }

  if (message.type === "GET_CHALLENGE") {
    try {
      return await apiFetch("/api/challenge");
    } catch (err) {
      return { error: err.message };
    }
  }

  if (message.type === "TRANSFER_DATA") {
    try {
      const body = {
        transfers: message.payload,
        nonce: message.nonce,
        counter: message.counter,
        session_id: message.session_id,
        contributor_id: message.contributor_id,
      };
      await apiFetch("/api/transfers/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { ok: true };
    } catch (err) {
      console.error("Failed to send data:", err);
      return { ok: false, error: err.message };
    }
  }
});
