(async () => {
  const SESSION_ID = crypto.randomUUID();
  const HEARTBEAT_INTERVAL = 30000;
  let CONTRIBUTOR_ID = null;

  function extractContributorId() {
    const links = document.querySelectorAll('a[href*="userId="]');
    for (const link of links) {
      const match = link.href.match(/[?&]userId=(\d+)/);
      if (match) return match[1];
    }
    const meta = document.querySelector('meta[name="userId"], meta[property="userId"]');
    if (meta) return meta.getAttribute("content");
    return null;
  }

  function extractTransferData() {
    const players = [];
    const cards = document.querySelectorAll("div.transferPlayerInfo");
    if (cards.length === 0) return players;

    for (const card of cards) {
      const flexParent = card.closest("div.flex");
      if (!flexParent) continue;

      const nameEl = card.querySelector("h3.transfer_search_playername > a");
      if (!nameEl) continue;

      const href = nameEl.getAttribute("href") || "";
      const playerId = new URLSearchParams(href.split("?")[1]).get("playerId") || null;

      const rightPanel = flexParent.querySelector(":scope > div.flex-grow");
      const deadlineEl = rightPanel?.querySelector("span[id*='lblDeadline']");
      const priceEl = rightPanel?.querySelector("strong");
      const viewsEl = rightPanel?.querySelector("span[id*='lblViews']");
      const bidsEl = rightPanel?.querySelector("span[id*='lblBids']");

      const categoryEl = card.querySelector("div.player-category, span.player-category");
      const specialtyEl = card.querySelector("i[class*='icon-speciality-']");
      const specialtyMap = { "icon-speciality-1": "technical", "icon-speciality-2": "quick", "icon-speciality-3": "powerful", "icon-speciality-4": "unpredictable", "icon-speciality-5": "head" };

      const infoRows = card.querySelectorAll(".transferPlayerInformation table tr");
      const info = {};
      for (const row of infoRows) {
        const label = row.querySelector("td.right")?.textContent?.trim();
        const value = row.querySelector("td:nth-child(2)")?.textContent?.trim();
        if (label && value) info[label] = value;
      }

      const tsiMatch = info["TSI"]?.match(/([\d\s]+)/);
      const salaryMatch = info["Salario"]?.match(/([\d\s]+)\s*€/);
      const ageMatch = info["Edad"]?.match(/(\d+)\s*años?\s*y\s*(\d+)\s*días?/);

      const skillsTable = card.querySelector(".transferPlayerSkills table");
      const skills = {};
      if (skillsTable) {
        const skillRows = skillsTable.querySelectorAll("tr");
        const skillOrder = ["keeper", "defending", "playmaking", "winger", "passing", "scoring", "setpieces"];
        let i = 0;
        for (const row of skillRows) {
          const valueEl = row.querySelector("td.right span.denominationNumber");
          if (valueEl && i < skillOrder.length) {
            const val = parseInt(valueEl.textContent?.trim());
            if (!isNaN(val)) skills[skillOrder[i]] = val;
          }
          i++;
        }
      }

      const player = {
        playerId,
        name: nameEl.textContent?.trim(),
        href,
        category: categoryEl?.textContent?.trim() || null,
        specialty: specialtyEl ? (Object.entries(specialtyMap).find(([cls]) => specialtyEl.classList.contains(cls))?.[1] || null) : null,
        ageYears: ageMatch ? parseInt(ageMatch[1]) : null,
        ageDays: ageMatch ? parseInt(ageMatch[2]) : null,
        tsi: tsiMatch ? parseInt(tsiMatch[1].replace(/\s/g, "")) : null,
        salary: salaryMatch ? parseInt(salaryMatch[1].replace(/\s/g, "")) : null,
        deadline: deadlineEl?.getAttribute("data-isodate") || deadlineEl?.textContent?.trim() || null,
        currentBid: priceEl ? parseCurrency(priceEl.textContent?.trim()) : null,
        views: viewsEl ? parseInt(viewsEl.textContent?.trim()) : null,
        bids: bidsEl ? parseInt(bidsEl.textContent?.trim()) : null,
        skills,
        owner: info["Dueño"] || null,
        url: window.location.href,
        captured_at: new Date().toISOString(),
      };

      players.push(player);
    }

    return players;
  }

  function parseCurrency(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^0-9.,]/g, "").replace(",", ".");
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
  }

  function showToast(count, message) {
    const existing = document.getElementById("h2s-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "h2s-toast";
    toast.textContent = message || `Hattrick2Shopping: ${count} jugadores capturados`;
    Object.assign(toast.style, {
      position: "fixed",
      top: "12px",
      right: "12px",
      zIndex: 999999,
      background: "#166534",
      color: "#fff",
      padding: "10px 18px",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "Arial, sans-serif",
      boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      opacity: "0",
      transition: "opacity 0.3s ease",
      pointerEvents: "none",
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = "1"; });

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  function dedupByPlayerId(players) {
    const seen = new Map();
    for (const p of players) {
      const id = p.playerId || p.name;
      const existing = seen.get(id);
      if (!existing || new Date(p.captured_at) > new Date(existing.captured_at)) {
        seen.set(id, p);
      }
    }
    return Array.from(seen.values());
  }

  async function solvePow(nonce, difficulty, payload) {
    const encoder = new TextEncoder();
    const payloadStr = JSON.stringify(payload);

    function countLeadingZeroBits(bytes) {
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === 0) continue;
        let leading = i * 8;
        let byte = bytes[i];
        for (let b = 7; b >= 0; b--) {
          if ((byte >> b) & 1) break;
          leading++;
        }
        return leading;
      }
      return bytes.length * 8;
    }

    let counter = 0;
    while (true) {
      const data = encoder.encode(nonce + counter + payloadStr);
      const hash = await crypto.subtle.digest("SHA-256", data);
      const leading = countLeadingZeroBits(new Uint8Array(hash));
      if (leading >= difficulty) return counter;
      counter++;
      if (counter % 1000 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }

  async function sendHeartbeat() {
    try {
      await browser.runtime.sendMessage({
        type: "HEARTBEAT",
        session_id: SESSION_ID,
        url: window.location.href,
        contributor_id: CONTRIBUTOR_ID,
      });
    } catch {}
  }

  async function captureAndSend() {
    const raw = extractTransferData();
    const data = dedupByPlayerId(raw);
    if (data.length === 0) return { ok: true, count: 0 };

    await sendHeartbeat();

    try {
      showToast(data.length, `Hattrick2Shopping: resolviendo prueba de trabajo...`);

      const challenge = await browser.runtime.sendMessage({
        type: "GET_CHALLENGE",
      });
      if (!challenge?.nonce) {
        showToast(0, "Error: no se pudo obtener challenge");
        return { ok: false, error: "No challenge" };
      }

      const counter = await solvePow(challenge.nonce, challenge.difficulty, data);

      const response = await browser.runtime.sendMessage({
        type: "TRANSFER_DATA",
        payload: data,
        nonce: challenge.nonce,
        counter,
        session_id: SESSION_ID,
        contributor_id: CONTRIBUTOR_ID,
      });

      if (!response?.ok) {
        showToast(0, "Error: " + (response?.error || "el servidor rechazó los datos"));
        return { ok: false, error: response?.error };
      }

      showToast(data.length, `Hattrick2Shopping: ${data.length} jugadores capturados`);
      return { ok: true, count: data.length };
    } catch (err) {
      showToast(0, "Error al capturar: " + (err.message || "desconocido"));
      return { ok: false, error: err.message };
    }
  }

  CONTRIBUTOR_ID = extractContributorId();
  await sendHeartbeat();
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "MANUAL_CAPTURE") {
      captureAndSend().then(sendResponse);
      return true;
    }
  });

  browser.storage.local.get("autoCapture").then(({ autoCapture }) => {
    if (autoCapture) {
      setTimeout(captureAndSend, 2000);
    }
  });
})();
