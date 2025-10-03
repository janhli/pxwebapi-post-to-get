// POST → GET converter (SSB PXWeb aware). All logic runs in the browser.

function tryParseJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function isPxWebJson(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (!Array.isArray(obj.query)) return false;
  return obj.query.every(q =>
    q && typeof q === "object" &&
    typeof q.code === "string" &&
    q.selection && Array.isArray(q.selection.values)
  );
}

function buildPxWebParams(px) {
  // Preserve order of px.query
  const parts = [];
  for (const item of px.query) {
    const code = item.code;
    const values = Array.isArray(item.selection?.values) ? item.selection.values : [];
    // Join as comma-separated; encode values but keep commas and bracket key style
    const joined = values.map(v => encodeURIComponent(String(v))).join(",");
    const key = `valueCodes[${code}]`; // Avoid encoding [ ]
    parts.push(`${key}=${joined}`);
  }
  return parts.join("&");
}

function parseCurl(input) {
  // Extract URL and data payload from a cURL command
  const urlMatch = input.match(/curl\s+(?:-X\s+POST\s+)?(\S+)/i);
  const dataMatch = input.match(/(?:--data|-d)\s+(['"]?)([\s\S]*?)\1(\s|$)/i);
  return {
    url: urlMatch ? urlMatch[1] : null,
    data: dataMatch ? dataMatch[2] : ""
  };
}

function parseFormOrJson(text) {
  text = text.trim();
  if (!text) return {};

  const js = tryParseJSON(text);
  if (js !== null) {
    // Generic JSON → flatten to key=value (fallback path)
    return flattenObject(js);
  }

  // Otherwise assume x-www-form-urlencoded
  const obj = {};
  text.split("&").forEach(pair => {
    if (!pair) return;
    const [k, v=""] = pair.split("=");
    const key = decodeURIComponent((k||"").replace(/\+/g, " "));
    const val = decodeURIComponent((v||"").replace(/\+/g, " "));
    obj[key] = val;
  });
  return obj;
}

// Flatten nested JSON into simple key=value pairs e.g. user.name → "Ola"
function flattenObject(input, prefix = "", out = {}) {
  if (Array.isArray(input)) {
    input.forEach((v, i) => flattenObject(v, prefix ? `${prefix}[${i}]` : String(i), out));
    return out;
  }
  if (input && typeof input === "object") {
    Object.entries(input).forEach(([k, v]) => {
      const p = prefix ? `${prefix}.${k}` : k;
      flattenObject(v, p, out);
    });
    return out;
  }
  out[prefix] = input;
  return out;
}

function buildQuery(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

function isLikelyUrl(s) {
  return /^(https?:)?\/\//i.test(s) || /^[a-z0-9.-]+\.[a-z]{2,}([/:].*)?$/i.test(s);
}

function normalizeBaseUrl(s) {
  let base = (s || "").trim();
  if (!base) return "";
  if (!/^https?:\/\//i.test(base)) {
    base = "https://" + base.replace(/^\/+/, "");
  }
  return base;
}

document.getElementById("btn").addEventListener("click", () => {
  const baseEl = document.getElementById("baseUrl");
  const bodyEl = document.getElementById("postBody");
  const outEl  = document.getElementById("output");
  const openBtn = document.getElementById("openBtn");
  const modeEl = document.getElementById("mode");

  let detectedUrl = null;
  let dataText = bodyEl.value;
  // Check if it's a cURL input
  if (/^\s*curl\s+/i.test(dataText)) {
    const c = parseCurl(dataText);
    detectedUrl = c.url;
    dataText = c.data;
  }

  // Try parse as JSON (for PXWeb detection)
  const json = tryParseJSON(dataText);
  const base = normalizeBaseUrl(detectedUrl || baseEl.value);

  if (!base) {
    outEl.value = "Sett base-URL først (eller oppgi i cURL)";
    openBtn.href = "#";
    openBtn.setAttribute("aria-disabled", "true");
    modeEl.textContent = "Modus: ukjent (mangler base-URL)";
    return;
  }

  let result = base;
  if (json && isPxWebJson(json)) {
    // PXWeb mode
    const params = buildPxWebParams(json);
    const sep = base.includes("?") ? "&" : "?";
    result = params ? `${base}${sep}${params}` : base;
    modeEl.textContent = "Modus: SSB PXWeb";
  } else {
    // Generic fallback: form-encoded or generic JSON flatten
    const obj = parseFormOrJson(dataText);
    const query = buildQuery(obj);
    const sep = base.includes("?") ? "&" : "?";
    result = query ? `${base}${sep}${query}` : base;
    modeEl.textContent = "Modus: Generisk (form/JSON)";
  }

  outEl.value = result;
  openBtn.href = isLikelyUrl(result) ? result : "#";
  openBtn.removeAttribute("aria-disabled");
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
  document.getElementById("mode").textContent = "Modus: (ukjent)";
});
