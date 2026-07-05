(async () => {
  const SESSION_ID = crypto.randomUUID();
  const HEARTBEAT_INTERVAL = 30000;
  let CONTRIBUTOR_ID = null;

  const CS_I18N = {
    es: { solvingPow: 'resolviendo prueba de trabajo...', noChallenge: 'Error: no se pudo obtener challenge', serverRejected: 'Error: el servidor rechazó los datos', capturedOk: '{n} jugadores capturados', captureError2: 'Error al capturar: {msg}', allDiscarded: 'Todos los jugadores están a >24h del cierre — no se envió nada', someDiscarded: '{n} enviados · {m} descartados (>24h para cierre): {names}' },
    en: { solvingPow: 'solving proof of work...', noChallenge: 'Error: could not get challenge', serverRejected: 'Error: server rejected the data', capturedOk: '{n} players captured', captureError2: 'Capture error: {msg}', allDiscarded: 'All players are >24h from deadline — nothing sent', someDiscarded: '{n} sent · {m} discarded (>24h from deadline): {names}' },
    fr: { solvingPow: 'résolution de la preuve de travail...', noChallenge: 'Erreur : impossible d\'obtenir le challenge', serverRejected: 'Erreur : le serveur a rejeté les données', capturedOk: '{n} joueurs capturés', captureError2: 'Erreur de capture : {msg}', allDiscarded: 'Tous les joueurs sont à >24h de la clôture — rien envoyé', someDiscarded: '{n} envoyés · {m} ignorés (>24h de la clôture) : {names}' },
    de: { solvingPow: 'Arbeitsnachweis wird gelöst...', noChallenge: 'Fehler: Challenge konnte nicht abgerufen werden', serverRejected: 'Fehler: Server hat Daten abgelehnt', capturedOk: '{n} Spieler erfasst', captureError2: 'Erfassungsfehler: {msg}', allDiscarded: 'Alle Spieler sind >24h von Frist entfernt — nichts gesendet', someDiscarded: '{n} gesendet · {m} verworfen (>24h bis Frist): {names}' },
    ca: { solvingPow: 'resolent prova de treball...', noChallenge: 'Error: no es va poder obtenir challenge', serverRejected: 'Error: el servidor va rebutjar les dades', capturedOk: '{n} jugadors capturats', captureError2: 'Error en capturar: {msg}', allDiscarded: 'Tots els jugadors estan a >24h del tancament — no s\'ha enviat res', someDiscarded: '{n} enviats · {m} descartats (>24h per tancament): {names}' },
    eu: { solvingPow: 'lan-proba ebazten...', noChallenge: 'Errorea: ezin izan da challenge lortu', serverRejected: 'Errorea: zerbitzariak datuak baztertu ditu', capturedOk: '{n} jokalari harrapatu', captureError2: 'Harrapaketa errorea: {msg}', allDiscarded: 'Jokalari guztiak >24h daude itxieratik — ez da ezer bidali', someDiscarded: '{n} bidali · {m} baztertu (>24h itxierarako): {names}' },
    gl: { solvingPow: 'resolvendo proba de traballo...', noChallenge: 'Erro: non se puido obter challenge', serverRejected: 'Erro: o servidor rexeitou os datos', capturedOk: '{n} xogadores capturados', captureError2: 'Erro ao capturar: {msg}', allDiscarded: 'Todos os xogadores están a >24h do peche — non se enviou nada', someDiscarded: '{n} enviados · {m} descartados (>24h para peche): {names}' },
    pt: { solvingPow: 'resolvendo prova de trabalho...', noChallenge: 'Erro: não foi possível obter challenge', serverRejected: 'Erro: o servidor rejeitou os dados', capturedOk: '{n} jogadores capturados', captureError2: 'Erro ao capturar: {msg}', allDiscarded: 'Todos os jogadores estão a >24h do fechamento — nada enviado', someDiscarded: '{n} enviados · {m} descartados (>24h para fechamento): {names}' },
  }

  function csT(key, lang, params = {}) {
    let str = (CS_I18N[lang] || CS_I18N.es)[key] || key
    for (const [k, v] of Object.entries(params)) str = str.replace(`{${k}}`, v)
    return str
  }

  function detectCSLang() {
    try {
      let uiLang
      try { uiLang = browser.i18n.getUILanguage() } catch {}
      if (!uiLang) uiLang = navigator.language || navigator.languages?.[0] || 'es'
      const code = uiLang.split('-')[0].toLowerCase()
      return CS_I18N[code] ? code : 'es'
    } catch { return 'es' }
  }

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

  function hoursUntilDeadline(deadline, capturedAt) {
    if (!deadline || !capturedAt) return 0;
    const d = new Date(deadline.replace("Z", "+00:00"));
    const c = new Date(capturedAt);
    return Math.max(0, (d - c) / 3600000);
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

  async function captureAndSend(lang) {
    const raw = extractTransferData();
    const deduped = dedupByPlayerId(raw);
    if (deduped.length === 0) return { ok: true, count: 0 };

    const now = new Date().toISOString();
    const discarded = [];
    const data = [];
    for (const p of deduped) {
      const hours = hoursUntilDeadline(p.deadline, p.captured_at || now);
      if (hours > 24) {
        discarded.push(p.name);
      } else {
        data.push(p);
      }
    }

    if (data.length === 0) {
      showToast(0, `Hattrick2Shopping: ${csT('allDiscarded', lang)}`);
      return { ok: true, count: 0, discarded: discarded.length };
    }

    if (discarded.length > 0) {
      showToast(data.length, `Hattrick2Shopping: ${csT('someDiscarded', lang, { n: data.length, m: discarded.length, names: discarded.join(', ') })}`);
    }

    await sendHeartbeat();

    try {
      if (discarded.length === 0) {
        showToast(data.length, `Hattrick2Shopping: ${csT('solvingPow', lang)}`);
      }

      const challenge = await browser.runtime.sendMessage({
        type: "GET_CHALLENGE",
      });
      if (!challenge?.nonce) {
        showToast(0, csT('noChallenge', lang));
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
        showToast(0, csT('serverRejected', lang) + (response?.error ? ` (${response.error})` : ''));
        return { ok: false, error: response?.error };
      }

      showToast(data.length, `Hattrick2Shopping: ${csT('capturedOk', lang, { n: data.length })}`);
      return { ok: true, count: data.length, discarded: discarded.length };
    } catch (err) {
      showToast(0, csT('captureError2', lang, { msg: err.message || 'desconocido' }));
      return { ok: false, error: err.message };
    }
  }

  CONTRIBUTOR_ID = extractContributorId();
  await sendHeartbeat();
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "MANUAL_CAPTURE") {
      captureAndSend(message.lang).then(sendResponse);
      return true;
    }
  });

  browser.storage.local.get(["autoCapture", "lang"]).then(({ autoCapture, lang }) => {
    if (autoCapture) {
      setTimeout(() => captureAndSend(lang || detectCSLang()), 2000);
    }
  });
})();
