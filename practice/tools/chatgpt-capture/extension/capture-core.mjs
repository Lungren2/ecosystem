const REDACTED = "[REDACTED]";
const REDACTED_TEXT = "<redacted:text>";
const ID_LIKE = /^(?:[0-9a-f]{8}-[0-9a-f-]{27,}|[0-9a-f]{20,}|\d{8,}|[A-Za-z0-9_-]{32,})$/i;
const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
const SENSITIVE_NAME = /(?:authorization|proxy-authorization|cookie|set-cookie|csrf|xsrf|token|secret|password|api[-_]?key|session)/i;
const TEXT_FIELD = /(?:message|prompt|content|text|title|query|search|email|name|description|instructions?)/i;
const ID_FIELD = /(?:^|[_-])(?:id|uuid|conversation[_-]id|message[_-]id|account[_-]id|user[_-]id)(?:$|[_-])/i;
const SAFE_STRING_FIELD = /^(?:action|type|role|status|mode|method|operation|mime_type|mimeType|content_type|contentType|sort|order)$/;

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
    url.hash = "";

    const segments = url.pathname.split("/").map((segment) => {
      if (!segment) return segment;
      return ID_LIKE.test(segment) ? pseudonymize(segment) : segment.replace(UUID_IN_TEXT, (value) => pseudonymize(value));
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

      if (!isSimpleScalar(value)) {
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

function sanitizeHeader(header, pseudonymize) {
  const name = String(header?.name ?? "");
  let value = String(header?.value ?? "");

  if (SENSITIVE_NAME.test(name)) {
    value = REDACTED;
  } else if (/^(?:origin|referer|location)$/i.test(name)) {
    value = sanitizeUrl(value, pseudonymize);
  } else if (value.length > 512) {
    value = REDACTED;
  } else {
    value = value.replace(UUID_IN_TEXT, (match) => pseudonymize(match));
  }

  return { ...header, name, value };
}

function sanitizeCookie(cookie) {
  return {
    ...cookie,
    value: REDACTED,
  };
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
  if (!postData || typeof postData !== "object") return postData;

  const sanitized = { ...postData };
  if (Array.isArray(postData.params)) {
    sanitized.params = postData.params.map((param) => ({
      ...param,
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
        const parsed = JSON.parse(postData.text);
        sanitized.text = JSON.stringify(redactJsonValue(parsed, "", pseudonymize));
      } catch {
        sanitized.text = REDACTED_TEXT;
      }
    } else {
      sanitized.text = REDACTED_TEXT;
    }
  }

  return sanitized;
}

function sanitizeEntry(entry, pseudonymize) {
  const request = entry?.request ?? {};
  const response = entry?.response ?? {};

  return {
    ...entry,
    request: {
      ...request,
      url: sanitizeUrl(request.url, pseudonymize),
      headers: Array.isArray(request.headers)
        ? request.headers.map((header) => sanitizeHeader(header, pseudonymize))
        : request.headers,
      cookies: Array.isArray(request.cookies)
        ? request.cookies.map(sanitizeCookie)
        : request.cookies,
      queryString: Array.isArray(request.queryString)
        ? request.queryString.map((param) => ({
            ...param,
            value: SENSITIVE_NAME.test(param?.name ?? "") || TEXT_FIELD.test(param?.name ?? "") || ID_FIELD.test(param?.name ?? "")
              ? REDACTED
              : ID_LIKE.test(String(param?.value ?? ""))
                ? pseudonymize(String(param.value))
                : isSimpleScalar(String(param?.value ?? ""))
                  ? String(param.value)
                  : REDACTED,
          }))
        : request.queryString,
      postData: sanitizePostData(request.postData, pseudonymize),
    },
    response: {
      ...response,
      headers: Array.isArray(response.headers)
        ? response.headers.map((header) => sanitizeHeader(header, pseudonymize))
        : response.headers,
      cookies: Array.isArray(response.cookies)
        ? response.cookies.map(sanitizeCookie)
        : response.cookies,
      content: response.content
        ? {
            ...response.content,
            text: undefined,
          }
        : response.content,
      redirectURL: sanitizeUrl(response.redirectURL, pseudonymize),
    },
  };
}

export function sanitizeHar(har, { startedAt } = {}) {
  const pseudonymize = createPseudonymizer();
  const entries = Array.isArray(har?.log?.entries) ? har.log.entries : [];
  const filtered = startedAt
    ? entries.filter((entry) => Date.parse(entry.startedDateTime) >= startedAt)
    : entries;

  return {
    ...har,
    log: {
      ...(har?.log ?? {}),
      entries: filtered.map((entry) => sanitizeEntry(entry, pseudonymize)),
    },
  };
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
  const entries = Array.isArray(har?.log?.entries) ? har.log.entries : [];
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
