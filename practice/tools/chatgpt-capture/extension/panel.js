import { safeFilename, sanitizeHar, summarizeHar } from "./capture-core.mjs";
import { sanitizeDomAttribute } from "./dom-attributes.mjs";

const labelInput = document.querySelector("#label");
const startButton = document.querySelector("#start");
const exportButton = document.querySelector("#export");
const status = document.querySelector("#status");

let startedAt = null;
let startedUrl = null;

const DOM_CAPTURE_EXPRESSION = String.raw`(() => {
  const REDACTED = "[REDACTED]";
  const ID_LIKE = /^(?:[0-9a-f]{8}-[0-9a-f-]{27,}|[0-9a-f]{20,}|\d{8,}|[A-Za-z0-9_-]{32,})$/i;
  const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
  const LONG_TOKEN = /[A-Za-z0-9_-]{24,}/g;
  const sanitizeAttribute = ${sanitizeDomAttribute.toString()};

  const sanitizePath = (pathname) => pathname
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      if (ID_LIKE.test(segment)) return ":id";
      return segment.replace(UUID, ":id").replace(LONG_TOKEN, ":id");
    })
    .join("/");

  const sanitizeUrl = (raw) => {
    try {
      const url = new URL(raw, location.href);
      if (!/^https?:$/.test(url.protocol)) return REDACTED;
      return url.origin + sanitizePath(url.pathname);
    } catch {
      return REDACTED;
    }
  };

  const root = document.documentElement.cloneNode(true);
  root.querySelectorAll("script, style, noscript, template").forEach((node) => node.remove());

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT);
  let node = walker.currentNode;

  while (node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.nodeValue = "";
    } else if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue && node.nodeValue.trim()) node.nodeValue = "TEXT";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const attribute of [...node.attributes]) {
        const name = attribute.name;
        const value = attribute.value;

        const sanitized = sanitizeAttribute(name, value, sanitizeUrl);
        if (sanitized === null) {
          node.removeAttribute(name);
        } else {
          node.setAttribute(name, sanitized);
        }
      }

      if ("value" in node) {
        try { node.value = ""; } catch { /* read-only element */ }
      }
    }

    node = walker.nextNode();
  }

  return {
    url: sanitizeUrl(location.href),
    title: document.title ? "TEXT" : "",
    html: "<!doctype html>\\n" + root.outerHTML,
  };
})()`;

function setStatus(message, kind = "normal") {
  status.textContent = message;
  status.dataset.kind = kind;
}

function inspect(expression) {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(expression, (result, exceptionInfo) => {
      if (exceptionInfo) {
        reject(new Error(exceptionInfo.value || exceptionInfo.description || "Inspected window evaluation failed."));
        return;
      }
      resolve(result);
    });
  });
}

function getHar() {
  return new Promise((resolve) => chrome.devtools.network.getHAR(resolve));
}

function isChatGptUrl(rawUrl) {
  try {
    const hostname = new URL(rawUrl).hostname;
    return hostname === "chatgpt.com" || hostname.endsWith(".chatgpt.com");
  } catch {
    return false;
  }
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

startButton.addEventListener("click", async () => {
  const page = await inspect("location.href");
  if (!isChatGptUrl(page)) {
    startedAt = null;
    startedUrl = null;
    exportButton.disabled = true;
    setStatus("The inspected tab is not chatgpt.com.", "error");
    return;
  }

  startedAt = Date.now();
  startedUrl = page;
  exportButton.disabled = false;
  setStatus("Recording. Perform one small flow, then export the capture.");
});

exportButton.addEventListener("click", async () => {
  if (!startedAt) return;

  exportButton.disabled = true;
  setStatus("Sanitizing capture locally...");

  try {
    const [har, page] = await Promise.all([getHar(), inspect(DOM_CAPTURE_EXPRESSION)]);
    const sanitizedHar = sanitizeHar(har, { startedAt });
    const summary = summarizeHar(sanitizedHar);
    const label = safeFilename(labelInput.value);
    const capturedAt = new Date().toISOString();

    const bundle = {
      schemaVersion: 2,
      kind: "chatgpt-extension-evidence",
      label,
      capturedAt,
      startedAt: new Date(startedAt).toISOString(),
      startedUrl: startedUrl ? "https://chatgpt.com/" : null,
      privacy: {
        responseBodiesCollected: false,
        rawHarRetained: false,
        networkFieldsAllowlisted: true,
        visibleTextRedacted: true,
        formValuesRedacted: true,
        sensitiveHeadersRedacted: true,
        cookiesRedacted: true,
        identifiersPseudonymized: true,
        unknownDomAttributeValuesRedacted: true,
      },
      page,
      summary,
      har: sanitizedHar,
    };

    downloadJson(`${label}-${capturedAt.replace(/[:.]/g, "-")}.chatgpt-capture.json`, bundle);
    setStatus(`Exported ${summary.entryCount} network entries. Inspect the file before sharing it.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), "error");
  } finally {
    exportButton.disabled = false;
  }
});
