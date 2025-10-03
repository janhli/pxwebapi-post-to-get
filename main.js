// PXWeb v0 → v2 converter (STRICT, forced base).

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
    const joined = values.map(v => encodeURIComponent(String(v))).join(","); // encode each value; commas remain
    const key = `valueCodes[${code}]`; // do not encode brackets
    parts.push(`${key}=${joined}`);
  }
  return parts.join("&");
}

function extractDomainOnly(input) {
  let s = (input || "").trim();
  if (!s) return "";
  // If it looks like a full URL, use URL parser
  try {
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    const u = new URL(s);
    const port = u.port ? `:${u.port}` : "";
    return `${u.protocol}//${u.hostname}${port}`;
  } catch {
    // Fallback: strip path after first /
    return s.replace(/^(https?:\/\/)?([^\/]+).*/i, (m, p1, host) => (p1 || "https://") + host);
  }
}

function buildForcedV2Base(hostInput, tableId, lang) {
  const domain = extractDomainOnly(hostInput); // e.g., https://data.ssb.no
  const table = (tableId || "").trim();
  const language = (lang || "no").trim();
  if (!domain) throw new Error("Mangler domene (host).");
  if (!table) throw new Error("Mangler tabell-ID.");
  const langParam = encodeURIComponent(language || "no");
  return `${domain}/api/pxwebapi/v2/tables/${table}/data?lang=${langParam}`;
}

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
