// PXWeb v0 → v2 (autofill + strict v2 base)

function tryParseJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function assertPxWebJson(obj) {
  if (!obj || typeof obj !== "object" || !Array.isArray(obj.query)) {
    throw new Error("Ugyldig PXWeb-post: mangler 'query' som array.");
  }
  for (const q of obj.query) {
    if (!q || typeof q.code !== "string" || !q.selection || !Array.isArray(q.selection.values)) {
      throw new Error("Ugyldig element i 'query': krever { code: string, selection: { values: [] } }.");
    }
  }
}

function buildValueCodesParams(px) {
  const parts = [];
  for (const item of px.query) {
    const code = item.code;
    const values = Array.isArray(item.selection?.values) ? item.selection.values : [];
    const joined = values.map(v => encodeURIComponent(String(v))).join(","); // encode values; keep comma
    const key = `valueCodes[${code}]`; // do not encode brackets
    parts.push(`${key}=${joined}`);
  }
  return parts.join("&");
}

function extractDomainOnly(input) {
  let s = (input || "").trim();
  if (!s) return "";
  try {
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    const u = new URL(s);
    const port = u.port ? `:${u.port}` : "";
    return `${u.protocol}//${u.hostname}${port}`;
  } catch {
    return s.replace(/^(https?:\/\/)?([^\/]+).*/i, (m, p1, host) => (p1 || "https://") + host);
  }
}

function buildForcedV2Base(hostInput, tableId, lang) {
  const domain = extractDomainOnly(hostInput);
  const table = (tableId || "").trim();
  const language = (lang || "no").trim();
  if (!domain) throw new Error("Mangler domene (host).");
  if (!table) throw new Error("Mangler tabell-ID.");
  const langParam = encodeURIComponent(language || "no");
  return `${domain}/api/pxwebapi/v2/tables/${table}/data?lang=${langParam}`;
}

// --- Autofill from v0 URL or cURL ---
const KNOWN_LANGS = new Set(["no","nb","nn","en","se","fi","sv","da"]);
const TABLE_TOKEN_RE = /^(?:\d{4,7}[a-zA-Z]?|[A-Za-z0-9]{4,12})(?:\.px)?$/;

function parseCurlForUrl(text) {
  const m = text.match(/https?:\/\/\S+/i);
  return m ? m[0] : null;
}

function detectFromUrl(urlStr) {
  const res = { domain: "", tableId: "", lang: "" };
  if (!urlStr) return res;
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(urlStr) ? urlStr : "https://" + urlStr);
  } catch {
    return res;
  }
  res.domain = `${u.protocol}//${u.hostname}${u.port ? ":"+u.port : ""}`;

  if (u.searchParams.has("lang")) {
    const l = u.searchParams.get("lang");
    if (l) res.lang = l.toLowerCase();
  }

  const parts = u.pathname.split("/").filter(Boolean);
  for (const p of parts) {
    const t = p.toLowerCase();
    if (KNOWN_LANGS.has(t)) { res.lang = t; break; }
  }

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].toLowerCase();
    if (p === "tables" || p === "table") {
      const cand = parts[i+1] || "";
      const tid = cand.replace(/\.px$/i,"");
      if (TABLE_TOKEN_RE.test(tid)) { res.tableId = tid; break; }
    }
  }
  if (!res.tableId) {
    for (const token of parts.slice().reverse()) {
      const tid = token.replace(/\.px$/i,"");
      if (TABLE_TOKEN_RE.test(tid)) { res.tableId = tid; break; }
    }
  }
  if (!res.tableId) {
    for (const k of ["table","tableId","id"]) {
      const v = u.searchParams.get(k);
      if (v && TABLE_TOKEN_RE.test(v)) { res.tableId = v; break; }
    }
  }

  if (!res.lang) res.lang = "no";
  return res;
}

document.getElementById("autofillBtn").addEventListener("click", () => {
  const inputEl = document.getElementById("v0Input");
  const msgEl = document.getElementById("autofillMsg");
  const hostEl = document.getElementById("host");
  const tableEl = document.getElementById("tableId");
  const langEl = document.getElementById("lang");

  let source = (inputEl.value || "").trim();
  if (!source) { msgEl.textContent = "Lim inn en v0-URL eller cURL først."; return; }

  if (/^\s*curl\b/i.test(source)) {
    const url = parseCurlForUrl(source);
    if (!url) { msgEl.textContent = "Fant ikke URL i cURL-strengen."; return; }
    source = url;
  }

  const det = detectFromUrl(source);
  if (det.domain) hostEl.value = det.domain;
  if (det.tableId) tableEl.value = det.tableId;
  if (det.lang) langEl.value = det.lang;

  const parts = [];
  parts.push(`Domene: ${det.domain || "(ukjent)"}`);
  parts.push(`Tabell-ID: ${det.tableId || "(ukjent)"}`);
  parts.push(`Språk: ${det.lang || "(ukjent)"}`);
  msgEl.textContent = parts.join(" • ");
});

document.getElementById("clearUrlBtn").addEventListener("click", () => {
  document.getElementById("v0Input").value = "";
  document.getElementById("autofillMsg").textContent = "";
});

document.getElementById("btn").addEventListener("click", () => {
  const hostEl = document.getElementById("host");
  const tableEl = document.getElementById("tableId");
  const langEl  = document.getElementById("lang");
  const bodyEl  = document.getElementById("postBody");
  const outEl   = document.getElementById("output");
  const openBtn = document.getElementById("openBtn");
  const basePreview = document.getElementById("basePreview");

  try {
    const px = tryParseJSON(bodyEl.value);
    if (!px) throw new Error("POST-body er ikke gyldig JSON.");
    assertPxWebJson(px);

    const base = buildForcedV2Base(hostEl.value, tableEl.value, langEl.value);
    basePreview.textContent = `Base-URL: ${base}`;

    const params = buildValueCodesParams(px);
    const result = params ? `${base}&${params}` : base;

    outEl.value = result;
    openBtn.href = result;
  } catch (e) {
    outEl.value = `Feil: ${e.message}`;
    openBtn.href = "#";
    basePreview.textContent = "";
  }
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  const val = document.getElementById("output").value;
  if (!val) return;
  try {
    await navigator.clipboard.writeText(val);
    alert("Kopiert!");
  } catch (e) {
    const el = document.getElementById("output");
    el.focus();
    el.select();
    alert("Kopier manuelt (Ctrl/Cmd + C).");
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("postBody").value = "";
  document.getElementById("output").value = "";
  document.getElementById("basePreview").textContent = "";
});
