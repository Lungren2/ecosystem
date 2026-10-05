import { safeFilename, sanitizeHar, summarizeHar } from "./capture-core.mjs";
import { sanitizeDomAttribute, sanitizeDomUrl } from "./dom-attributes.mjs";
import {
  classifyResponseShapeRequest,
  createResponseShapeFailure,
  createResponseShapeRecord,
  mergeResponseShapeRecords,
  responseShapeLimits,
} from "./response-shape.mjs";
import { isStyleTargetAttribute, sanitizeStyleTargetValue } from "./style-targets.mjs";

const labelInput = document.querySelector("#label");
const responseShapesInput = document.querySelector("#response-shapes");
const startButton = document.querySelector("#start");
const exportButton = document.querySelector("#export");
const status = document.querySelector("#status");

let startedAt = null;
let startedUrl = null;
let responseShapesEnabledForFlow = false;
let responseShapeRecords = new Map();
let responseShapeFailures = [];
const pendingResponseShapeCaptures = new Set();

const DOM_CAPTURE_EXPRESSION = String.raw`(() => {
  const sanitizeAttribute = ${sanitizeDomAttribute.toString()};
  const sanitizeUrlValue = ${sanitizeDomUrl.toString()};
  const isTargetAttribute = ${isStyleTargetAttribute.toString()};
  const sanitizeTargetValue = ${sanitizeStyleTargetValue.toString()};
  const sanitizeUrl = (raw) => sanitizeUrlValue(raw, location.href);

  const increment = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
  const sortCounts = (map, limit = 300) => [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));

  const dataAttributes = new Map();
  const dataAttributeValues = new Map();
  const selectors = new Map();
  const standardSelectors = new Map();
  const standardTargetNames = new Set([
    "role", "type", "dir", "contenteditable",
    "aria-hidden", "aria-expanded", "aria-disabled", "aria-selected",
    "aria-checked", "aria-pressed", "aria-busy", "aria-modal",
    "aria-live", "aria-orientation",
  ]);

  for (const element of document.querySelectorAll("*")) {
    const tag = element.localName;
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (/^data-[a-z0-9-]{1,80}$/.test(name)
        && !/(?:auth|token|cookie|csrf|xsrf|session|secret|password|api[-_]?key)/i.test(name)) {
        increment(dataAttributes, name);

        const targetable = isTargetAttribute(name);
        if (targetable) increment(selectors, tag + "[" + name + "]");

        const safeValue = sanitizeTargetValue(name, value);
        if (safeValue !== null) {
          if (!dataAttributeValues.has(name)) dataAttributeValues.set(name, new Map());
          increment(dataAttributeValues.get(name), safeValue);
          if (targetable) increment(selectors, tag + "[" + name + "=\"" + safeValue + "\"]");
        }
      }

      if (standardTargetNames.has(name)) {
        const safeValue = sanitizeAttribute(name, value, sanitizeUrl, sanitizeTargetValue);
        if (safeValue !== "[REDACTED]" && safeValue !== null && safeValue !== "") {
          increment(standardSelectors, tag + "[" + name + "=\"" + safeValue + "\"]");
        }
      }
    }
  }

  const styleTargets = {
    classValuesRetained: false,
    dataAttributes: sortCounts(dataAttributes).map((entry) => ({
      ...entry,
      values: dataAttributeValues.has(entry.name)
        ? sortCounts(dataAttributeValues.get(entry.name), 32).map(({ name, count }) => ({ value: name, count }))
        : [],
    })),
    selectors: sortCounts(selectors),
    standardSelectors: sortCounts(standardSelectors),
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

        const sanitized = sanitizeAttribute(name, value, sanitizeUrl, sanitizeTargetValue);
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
    styleTargets,
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

function decodeResponseContent(content, encoding) {
  if (!encoding) return content;
  if (encoding !== "base64") throw new Error("unsupported-response-encoding");

  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new TextDecoder().decode(bytes);
}

function readRequestContent(request) {
  return new Promise((resolve, reject) => {
    try {
      request.getContent((first, second) => {
        try {
          if (first && typeof first === "object" && "content" in first) {
            resolve({ content: first.content ?? "", encoding: first.encoding ?? "" });
            return;
          }
          resolve({ content: first ?? "", encoding: second ?? "" });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function addResponseShapeFailure(classification, response, reason) {
  responseShapeFailures.push(createResponseShapeFailure(classification, response, reason));
}

async function captureResponseShape(request, classification) {
  const mimeType = String(request?.response?.content?.mimeType ?? "");
  if (!mimeType.includes("json")) {
    addResponseShapeFailure(classification, request.response, "not-json");
    return;
  }

  const declaredSize = Number(request?.response?.content?.size ?? 0);
  if (declaredSize > responseShapeLimits.maxResponseBytes) {
    addResponseShapeFailure(classification, request.response, "response-too-large");
    return;
  }

  let stage = "read-content";
  try {
    const { content, encoding } = await readRequestContent(request);
    stage = "decode-content";
    const decoded = decodeResponseContent(String(content), String(encoding));
    if (!decoded.trim()) {
      addResponseShapeFailure(classification, request.response, "empty-response");
      return;
    }
    if (decoded.length > responseShapeLimits.maxResponseBytes * 2) {
      addResponseShapeFailure(classification, request.response, "response-too-large");
      return;
    }

    stage = "parse-json";
    const parsed = JSON.parse(decoded);
    stage = "reduce-shape";
    const record = createResponseShapeRecord(classification, request.response, parsed);
    responseShapeRecords.set(
      classification.kind,
      mergeResponseShapeRecords(responseShapeRecords.get(classification.kind), record),
    );
  } catch {
    addResponseShapeFailure(classification, request.response, stage + "-failed");
  }
}

chrome.devtools.network.onRequestFinished.addListener((request) => {
  if (!startedAt || !responseShapesEnabledForFlow) return;
  const requestStartedAt = Date.parse(request?.startedDateTime ?? "");
  if (Number.isFinite(requestStartedAt) && requestStartedAt < startedAt) return;

  const classification = classifyResponseShapeRequest(request?.request?.method, request?.request?.url);
  if (!classification) return;

  const pending = captureResponseShape(request, classification)
    .finally(() => pendingResponseShapeCaptures.delete(pending));
  pendingResponseShapeCaptures.add(pending);
});

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
  responseShapesEnabledForFlow = responseShapesInput.checked;
  responseShapeRecords = new Map();
  responseShapeFailures = [];
  responseShapesInput.disabled = true;
  exportButton.disabled = false;
  setStatus(responseShapesEnabledForFlow
    ? "Recording. Conversation response bodies will be read transiently and reduced to structure only."
    : "Recording. Perform one small flow, then export the capture.");
});

exportButton.addEventListener("click", async () => {
  if (!startedAt) return;

  exportButton.disabled = true;
  setStatus("Sanitizing capture locally...");

  try {
    if (pendingResponseShapeCaptures.size > 0) {
      await Promise.allSettled([...pendingResponseShapeCaptures]);
    }

    const [har, page] = await Promise.all([getHar(), inspect(DOM_CAPTURE_EXPRESSION)]);
    const sanitizedHar = sanitizeHar(har, { startedAt });
    const summary = summarizeHar(sanitizedHar);
    const label = safeFilename(labelInput.value);
    const capturedAt = new Date().toISOString();

    const bundle = {
      schemaVersion: 3,
      kind: "chatgpt-extension-evidence",
      label,
      capturedAt,
      startedAt: new Date(startedAt).toISOString(),
      startedUrl: startedUrl ? "https://chatgpt.com/" : null,
      privacy: {
        responseBodiesReadForShape: responseShapesEnabledForFlow,
        responseBodiesPersisted: false,
        responseShapeEndpointsAllowlisted: true,
        rawHarRetained: false,
        networkFieldsAllowlisted: true,
        visibleTextRedacted: true,
        formValuesRedacted: true,
        sensitiveHeadersRedacted: true,
        cookiesRedacted: true,
        identifiersPseudonymized: true,
        unknownDomAttributeValuesRedacted: true,
        externalDomUrlsRedacted: true,
        styleAttributeValuesAllowlisted: true,
        classValuesRetained: false,
      },
      page,
      responseShapes: {
        enabled: responseShapesEnabledForFlow,
        records: [...responseShapeRecords.values()].sort((left, right) => left.kind.localeCompare(right.kind)),
        failures: responseShapeFailures,
      },
      summary,
      har: sanitizedHar,
    };

    downloadJson(`${label}-${capturedAt.replace(/[:.]/g, "-")}.chatgpt-capture.json`, bundle);
    setStatus(`Exported ${summary.entryCount} network entries and ${bundle.responseShapes.records.length} response shapes. Inspect the file before sharing it.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), "error");
  } finally {
    exportButton.disabled = false;
    responseShapesInput.disabled = false;
  }
});
