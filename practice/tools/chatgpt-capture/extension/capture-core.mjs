const REDACTED = "[REDACTED]";
const REDACTED_TEXT = "<redacted:text>";
const ID_LIKE = /^(?:[0-9a-f]{8}-[0-9a-f-]{27,}|[0-9a-f]{20,}|\d{8,}|[A-Za-z0-9_-]{24,})$/i;
const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
const LONG_TOKEN_IN_TEXT = /[A-Za-z0-9_-]{24,}/g;
const SENSITIVE_NAME = /(?:authorization|proxy-authorization|cookie|set-cookie|csrf|xsrf|token|secret|password|api[-_]?key|session)/i;
const TEXT_FIELD = /(?:message|prompt|content|text|title|query|search|email|name|description|instructions?)/i;
const ID_FIELD = /(?:^|[_-])(?:id|uuid|conversation[_-]id|message[_-]id|account[_-]id|user[_-]id)(?:$|[_-])/i;
const SAFE_STRING_FIELD = /^(?:action|type|role|status|mode|method|operation|mime_type|mimeType|content_type|contentType|sort|order)$/;
const SAFE_HEADER = /^(?:content-type)$/i;

export function createPseudonymizer() {
  const values = new Map();
  return (value) => {
    if (!values.has(value)) {
      values.set(value, `id_${String(values.size + 1).padStart(3, "0")}`);
    }
    return values.get(value);
  };
}

export function sanitizeUrl(rawUrl, pseudonymize = createPseudonymizer()) {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    if (!/^(?:https?|wss?):$/.test(url.protocol)) return REDACTED;
    url.hash = "";

    const segments = url.pathname.split("/").map((segment) => {
      if (!segment) return segment;
      if (ID_LIKE.test(segment)) return pseudonymize(segment);
      return segment
        .replace(UUID_IN_TEXT, (value) => pseudonymize(value))
        .replace(LONG_TOKEN_IN_TEXT, (value) => pseudonymize(value));
    });
    url.pathname = segments.join("/");

    for (const [key, value] of [...url.searchParams.entries()]) {
      if (SENSITIVE_NAME.test(key) || TEXT_FIELD.test(key) || ID_FIELD.test(key)) {
        url.searchParams.set(key, REDACTED);
        continue;
      }

      if (ID_LIKE.test(value)) {
        url.searchParams.set(key, pseudonymize(value));
        continue;
      }

      if (!isSimpleScalar(value) && !isSafeEnumQuery(key, value)) {
        url.searchParams.set(key, REDACTED);
      }
    }

    return url.toString();
  } catch {
    return REDACTED;
  }
}

function isSimpleScalar(value) {
  return /^(?:true|false|null|-?\d+(?:\.\d+)?)$/i.test(value);
}

function isSafeEnumQuery(key, value) {
  return /^(?:order|sort|mode|expand|(?:exclude_)?conversation_origin)$/i.test(key)
    && /^[A-Za-z][A-Za-z0-9_-]{0,24}$/.test(value);
}

function sanitizeQueryString(queryString, pseudonymize) {
  if (!Array.isArray(queryString)) return undefined;
  return queryString.map((param) => {
    const name = String(param?.name ?? "");
    const value = String(param?.value ?? "");
    let sanitized = REDACTED;

    if (!(SENSITIVE_NAME.test(name) || TEXT_FIELD.test(name) || ID_FIELD.test(name))) {
      if (ID_LIKE.test(value)) sanitized = pseudonymize(value);
      else if (isSimpleScalar(value) || isSafeEnumQuery(name, value)) sanitized = value;
    }

    return { name, value: sanitized };
  });
}

function redactJsonValue(value, key, pseudonymize) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    if (SENSITIVE_NAME.test(key) || TEXT_FIELD.test(key)) return REDACTED_TEXT;
    if (ID_FIELD.test(key) || ID_LIKE.test(value)) return pseudonymize(value);
    if (SAFE_STRING_FIELD.test(key) && value.length <= 80) return value;
    if (isSimpleScalar(value)) return value;
    return REDACTED_TEXT;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactJsonValue(item, key, pseudonymize));
  }

  if (typeof value === "object") {
    const result = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      result[childKey] = redactJsonValue(childValue, childKey, pseudonymize);
    }
    return result;
  }

  return null;
}

function sanitizePostData(postData, pseudonymize) {
  if (!postData || typeof postData !== "object") return undefined;

  const sanitized = {};
  if (typeof postData.mimeType === "string") sanitized.mimeType = postData.mimeType;

  if (Array.isArray(postData.params)) {
    sanitized.params = postData.params.map((param) => ({
      name: String(param?.name ?? ""),
      value: SENSITIVE_NAME.test(param?.name ?? "") || TEXT_FIELD.test(param?.name ?? "") || ID_FIELD.test(param?.name ?? "")
        ? REDACTED
        : isSimpleScalar(String(param?.value ?? ""))
          ? String(param.value)
          : REDACTED,
    }));
  }

  if (typeof postData.text === "string" && postData.text.length > 0) {
    const mimeType = String(postData.mimeType ?? "");
    if (mimeType.includes("json") || /^[\[{]/.test(postData.text.trim())) {
      try {
        sanitized.text = JSON.stringify(redactJsonValue(JSON.parse(postData.text), "", pseudonymize));
      } catch {
        sanitized.text = REDACTED_TEXT;
      }
    } else {
      sanitized.text = REDACTED_TEXT;
    }
  }

  return sanitized;
}

function allowlistedHeaders(headers) {
  if (!Array.isArray(headers)) return undefined;
  const kept = headers
    .filter((header) => SAFE_HEADER.test(String(header?.name ?? "")))
    .map((header) => ({ name: String(header.name), value: String(header.value ?? "") }));
  return kept.length > 0 ? kept : undefined;
}

function compactEntry(entry, pseudonymize) {
  const request = entry?.request ?? {};
  const response = entry?.response ?? {};
  const content = response?.content ?? {};

  const compact = {
    startedDateTime: entry?.startedDateTime,
    time: typeof entry?.time === "number" ? entry.time : undefined,
    request: {
      method: String(request.method ?? "UNKNOWN"),
      url: sanitizeUrl(request.url, pseudonymize),
      httpVersion: request.httpVersion,
      headers: allowlistedHeaders(request.headers),
      queryString: sanitizeQueryString(request.queryString, pseudonymize),
      postData: sanitizePostData(request.postData, pseudonymize),
    },
    response: {
      status: response.status,
      statusText: response.statusText,
      httpVersion: response.httpVersion,
      content: response.content
        ? {
            size: content.size,
            mimeType: content.mimeType,
          }
        : undefined,
      redirectURL: sanitizeUrl(response.redirectURL, pseudonymize),
    },
  };

  return JSON.parse(JSON.stringify(compact));
}

function sourceLog(har) {
  if (Array.isArray(har?.entries)) return har;
  if (har?.log && Array.isArray(har.log.entries)) return har.log;
  return { entries: [] };
}

export function sanitizeHar(har, { startedAt } = {}) {
  const pseudonymize = createPseudonymizer();
  const source = sourceLog(har);
  const entries = source.entries ?? [];
  const filtered = startedAt
    ? entries.filter((entry) => Date.parse(entry.startedDateTime) >= startedAt)
    : entries;

  return {
    version: source.version ?? "1.2",
    creator: source.creator
      ? {
          name: String(source.creator.name ?? "unknown"),
          version: String(source.creator.version ?? "unknown"),
        }
      : undefined,
    entries: filtered.map((entry) => compactEntry(entry, pseudonymize)),
  };
}

function entriesFromHar(har) {
  if (Array.isArray(har?.entries)) return har.entries;
  if (Array.isArray(har?.log?.entries)) return har.log.entries;
  return [];
}

function normalizedPath(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return rawUrl;
  }
}

export function summarizeHar(har) {
  const entries = entriesFromHar(har);
  const hosts = new Map();
  const methods = new Map();
  const routes = new Map();

  for (const entry of entries) {
    const request = entry?.request ?? {};
    const method = String(request.method ?? "UNKNOWN");
    const url = String(request.url ?? "");

    methods.set(method, (methods.get(method) ?? 0) + 1);

    try {
      const host = new URL(url).host;
      hosts.set(host, (hosts.get(host) ?? 0) + 1);
    } catch {
      hosts.set("<invalid-url>", (hosts.get("<invalid-url>") ?? 0) + 1);
    }

    const route = `${method} ${normalizedPath(url)}`;
    routes.set(route, (routes.get(route) ?? 0) + 1);
  }

  const sortCounts = (map) => [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([name, count]) => ({ name, count }));

  return {
    entryCount: entries.length,
    methods: sortCounts(methods),
    hosts: sortCounts(hosts),
    routes: sortCounts(routes),
  };
}

export function safeFilename(label) {
  const value = String(label ?? "capture")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return value || "capture";
}
