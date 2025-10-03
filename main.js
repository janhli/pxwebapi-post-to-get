// POST → GET converter (all logic runs in the browser)

function parseFormOrJson(text) {
  text = text.trim();
  if (!text) return {};

  // Try JSON first
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      return flattenObject(parsed);
    } catch (e) {
      // Fall through to form parsing
    }
  }

  // Otherwise, assume x-www-form-urlencoded
  const obj = {};
  text.split("&").forEach(pair => {
    if (!pair) return;
    const eq = pair.indexOf("=");
    let k, v;
    if (eq === -1) { k = pair; v = ""; }
    else { k = pair.slice(0, eq); v = pair.slice(eq + 1); }
    const key = decodeURIComponent(k.replace(/\+/g, " "));
    const val = decodeURIComponent(v.replace(/\+/g, " "));
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

function parseBodyToObject(src) {
  // If cURL: extract base URL and data payload
  const curlUrl = src.match(/curl\s+(?:-X\s+POST\s+)?(?<url>\S+)/i);
  const curlData = src.match(/(?:--data|-d)\s+(['"]?)([\s\S]*?)\1(\s|$)/i);

  if (curlUrl || curlData) {
    const url = curlUrl?.groups?.url ?? null;
    const dataRaw = curlData ? curlData[2] : "";
    const obj = parseFormOrJson(dataRaw);
    return { url, obj };
  }

  // Else: treat whole input as a body
  return { url: null, obj: parseFormOrJson(src) };
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
  let base = s.trim();
  if (!base) return "";
  if (!/^https?:\/\//i.test(base)) {
    // If user typed "api.example.com/endpoint", add https://
    base = "https://" + base.replace(/^\/+/, "");
  }
  return base;
}

document.getElementById("btn").addEventListener("click", () => {
  const baseEl = document.getElementById("baseUrl");
  const bodyEl = document.getElementById("postBody");
  const outEl  = document.getElementById("output");
  const openBtn = document.getElementById("openBtn");

  const { url: detectedUrl, obj } = parseBodyToObject(bodyEl.value);
  const baseInput = baseEl.value;
  const base = normalizeBaseUrl(detectedUrl || baseInput);

  if (!base) {
    outEl.value = "Sett base-URL først (eller oppgi i cURL)";
    openBtn.href = "#";
    openBtn.setAttribute("aria-disabled", "true");
    return;
  }

  const sep = base.includes("?") ? "&" : "?";
  const query = buildQuery(obj);
  const result = query ? `${base}${sep}${query}` : base;

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
    // Fallback: select + manual copy
    const el = document.getElementById("output");
    el.focus();
    el.select();
    alert("Kopier manuelt (Ctrl/Cmd + C).");
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("postBody").value = "";
  document.getElementById("output").value = "";
});
