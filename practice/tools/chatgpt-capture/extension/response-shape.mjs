const MAX_DEPTH = 12;
const MAX_FIELDS = 200;
const MAX_ARRAY_SAMPLES = 24;
const MAX_RESPONSE_BYTES = 25 * 1024 * 1024;
const SAFE_KEY = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const ID_LIKE_KEY = /^(?:[0-9a-f]{8}-[0-9a-f-]{27,}|[0-9a-f]{20,}|\d{8,}|[A-Za-z0-9_-]{24,})$/i;

export const responseShapeLimits = {
  maxDepth: MAX_DEPTH,
  maxFields: MAX_FIELDS,
  maxArraySamples: MAX_ARRAY_SAMPLES,
  maxResponseBytes: MAX_RESPONSE_BYTES,
};

export function responseShapeRecordKey(classification, response) {
  const status = Number(response?.status ?? 0);
  return `${classification.kind}:${status}`;
}

export function classifyResponseShapeRequest(method, rawUrl) {
  if (String(method).toUpperCase() !== "GET") return null;

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!(url.hostname === "chatgpt.com" || url.hostname.endsWith(".chatgpt.com"))) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "backend-api") return null;

  if (parts.length === 2 && parts[1] === "conversations") {
    return { kind: "conversation-list", route: "/backend-api/conversations" };
  }

  if (parts.length === 4 && parts[1] === "conversations" && parts[3] === "messages") {
    return { kind: "conversation-messages", route: "/backend-api/conversations/:id/messages" };
  }

  if (parts.length === 3 && parts[1] === "conversations") {
    return { kind: "conversation-window", route: "/backend-api/conversations/:id" };
  }

  if (parts.length === 3 && parts[1] === "conversation" && parts[2] !== "init") {
    return { kind: "conversation-detail", route: "/backend-api/conversation/:id" };
  }

  return null;
}

function safeFieldName(rawKey) {
  const key = String(rawKey);
  if (!SAFE_KEY.test(key) || ID_LIKE_KEY.test(key)) return ":dynamic";
  return key;
}

function primitiveShape(type) {
  return { type };
}

export function describeJsonShape(value, depth = 0) {
  if (value === null) return primitiveShape("null");
  if (typeof value === "boolean") return primitiveShape("boolean");
  if (typeof value === "string") return primitiveShape("string");
  if (typeof value === "number") return primitiveShape(Number.isInteger(value) ? "integer" : "number");

  if (depth >= MAX_DEPTH) {
    return { type: Array.isArray(value) ? "array" : "object", truncated: true };
  }

  if (Array.isArray(value)) {
    const sampled = value.slice(0, MAX_ARRAY_SAMPLES);
    let items = null;
    for (const item of sampled) {
      items = mergeJsonShapes(items, describeJsonShape(item, depth + 1));
    }
    return {
      type: "array",
      minLength: value.length,
      maxLength: value.length,
      sampled: sampled.length,
      items,
      truncatedItems: Math.max(0, value.length - sampled.length),
    };
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    const fields = {};
    let dynamicKeys = 0;
    let truncatedFields = 0;

    for (const [rawKey, childValue] of entries.slice(0, MAX_FIELDS)) {
      const key = safeFieldName(rawKey);
      if (key === ":dynamic") {
        dynamicKeys += 1;
        continue;
      }
      fields[key] = {
        optional: false,
        shape: describeJsonShape(childValue, depth + 1),
      };
    }

    if (entries.length > MAX_FIELDS) truncatedFields = entries.length - MAX_FIELDS;

    return {
      type: "object",
      fields,
      dynamicKeys,
      truncatedFields,
    };
  }

  return primitiveShape("unknown");
}

function shapeSignature(shape) {
  return JSON.stringify(shape);
}

function mergeUnion(left, right) {
  const variants = [];
  const seen = new Set();
  for (const candidate of [left, right]) {
    const source = candidate?.type === "union" ? candidate.variants : [candidate];
    for (const variant of source) {
      if (!variant) continue;
      const signature = shapeSignature(variant);
      if (!seen.has(signature)) {
        seen.add(signature);
        variants.push(variant);
      }
    }
  }
  return { type: "union", variants };
}

export function mergeJsonShapes(left, right) {
  if (!left) return right;
  if (!right) return left;
  if (shapeSignature(left) === shapeSignature(right)) return left;
  if (left.type !== right.type) return mergeUnion(left, right);

  if (left.type === "object") {
    const fields = {};
    const names = new Set([...Object.keys(left.fields ?? {}), ...Object.keys(right.fields ?? {})]);
    for (const name of names) {
      const a = left.fields?.[name];
      const b = right.fields?.[name];
      if (a && b) {
        fields[name] = {
          optional: Boolean(a.optional || b.optional),
          shape: mergeJsonShapes(a.shape, b.shape),
        };
      } else {
        const present = a ?? b;
        fields[name] = {
          optional: true,
          shape: present.shape,
        };
      }
    }
    return {
      type: "object",
      fields,
      dynamicKeys: Math.max(left.dynamicKeys ?? 0, right.dynamicKeys ?? 0),
      truncatedFields: Math.max(left.truncatedFields ?? 0, right.truncatedFields ?? 0),
      truncated: Boolean(left.truncated || right.truncated) || undefined,
    };
  }

  if (left.type === "array") {
    return {
      type: "array",
      minLength: Math.min(left.minLength ?? 0, right.minLength ?? 0),
      maxLength: Math.max(left.maxLength ?? 0, right.maxLength ?? 0),
      sampled: Math.max(left.sampled ?? 0, right.sampled ?? 0),
      items: mergeJsonShapes(left.items, right.items),
      truncatedItems: Math.max(left.truncatedItems ?? 0, right.truncatedItems ?? 0),
      truncated: Boolean(left.truncated || right.truncated) || undefined,
    };
  }

  if (left.type === "union") return mergeUnion(left, right);
  return mergeUnion(left, right);
}

export function createResponseShapeRecord(classification, response, parsedBody) {
  return {
    kind: classification.kind,
    route: classification.route,
    captures: 1,
    statuses: [Number(response?.status ?? 0)].filter(Boolean),
    mimeTypes: [String(response?.content?.mimeType ?? "")].filter(Boolean),
    minBodyBytes: Number(response?.content?.size ?? 0),
    maxBodyBytes: Number(response?.content?.size ?? 0),
    shape: describeJsonShape(parsedBody),
  };
}

export function mergeResponseShapeRecords(left, right) {
  if (!left) return right;
  if (!right) return left;

  const leftStatuses = JSON.stringify(left.statuses ?? []);
  const rightStatuses = JSON.stringify(right.statuses ?? []);
  if (left.kind !== right.kind || left.route !== right.route || leftStatuses !== rightStatuses) {
    throw new Error("response-shape-record-mismatch");
  }

  const statuses = [...new Set([...(left.statuses ?? []), ...(right.statuses ?? [])])].sort((a, b) => a - b);
  const mimeTypes = [...new Set([...(left.mimeTypes ?? []), ...(right.mimeTypes ?? [])])].sort();
  return {
    kind: left.kind,
    route: left.route,
    captures: (left.captures ?? 0) + (right.captures ?? 0),
    statuses,
    mimeTypes,
    minBodyBytes: Math.min(left.minBodyBytes ?? 0, right.minBodyBytes ?? 0),
    maxBodyBytes: Math.max(left.maxBodyBytes ?? 0, right.maxBodyBytes ?? 0),
    shape: mergeJsonShapes(left.shape, right.shape),
  };
}


export function createResponseShapeFailure(classification, response, reason) {
  return {
    kind: classification.kind,
    route: classification.route,
    reason,
    status: Number(response?.status ?? 0),
    mimeType: String(response?.content?.mimeType ?? ""),
    declaredBodyBytes: Number(response?.content?.size ?? 0),
  };
}
