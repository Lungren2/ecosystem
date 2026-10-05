import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyResponseShapeRequest,
  createResponseShapeRecord,
  describeJsonShape,
  mergeJsonShapes,
  mergeResponseShapeRecords,
} from "../extension/response-shape.mjs";

test("classifies only allowlisted conversation GET responses", () => {
  assert.deepEqual(classifyResponseShapeRequest("GET", "https://chatgpt.com/backend-api/conversations?offset=20"), {
    kind: "conversation-list",
    route: "/backend-api/conversations",
  });
  assert.deepEqual(classifyResponseShapeRequest("GET", "https://chatgpt.com/backend-api/conversations/abc/messages?before=x"), {
    kind: "conversation-messages",
    route: "/backend-api/conversations/:id/messages",
  });
  assert.deepEqual(classifyResponseShapeRequest("GET", "https://chatgpt.com/backend-api/conversations/abc"), {
    kind: "conversation-window",
    route: "/backend-api/conversations/:id",
  });
  assert.deepEqual(classifyResponseShapeRequest("GET", "https://chatgpt.com/backend-api/conversation/abc"), {
    kind: "conversation-detail",
    route: "/backend-api/conversation/:id",
  });
  assert.equal(classifyResponseShapeRequest("GET", "https://chatgpt.com/backend-api/conversation/abc/stream_status"), null);
  assert.equal(classifyResponseShapeRequest("POST", "https://chatgpt.com/backend-api/conversations"), null);
  assert.equal(classifyResponseShapeRequest("GET", "https://example.com/backend-api/conversations"), null);
});

test("describes response structure without preserving string values or dynamic keys", () => {
  const shape = describeJsonShape({
    items: [
      { id: "secret-id", title: "Private title", archived: false, create_time: 12.5 },
      { id: "other", title: "Another", archived: true, create_time: 13, extra: null },
    ],
    "123e4567-e89b-12d3-a456-426614174000": { value: "secret" },
  });

  assert.equal(shape.type, "object");
  assert.equal(shape.dynamicKeys, 1);
  assert.equal(shape.fields.items.shape.type, "array");
  const item = shape.fields.items.shape.items;
  assert.equal(item.type, "object");
  assert.equal(item.fields.id.shape.type, "string");
  assert.equal(item.fields.title.shape.type, "string");
  assert.equal(item.fields.archived.shape.type, "boolean");
  assert.equal(item.fields.extra.optional, true);
  assert.equal(JSON.stringify(shape).includes("Private title"), false);
  assert.equal(JSON.stringify(shape).includes("secret-id"), false);
});

test("merges compatible shapes and marks missing fields optional", () => {
  const left = describeJsonShape({ a: 1, shared: "x" });
  const right = describeJsonShape({ b: true, shared: "y" });
  const merged = mergeJsonShapes(left, right);
  assert.equal(merged.fields.a.optional, true);
  assert.equal(merged.fields.b.optional, true);
  assert.equal(merged.fields.shared.optional, false);
  assert.equal(merged.fields.shared.shape.type, "string");
});

test("aggregates repeated response captures by endpoint kind", () => {
  const classification = { kind: "conversation-list", route: "/backend-api/conversations" };
  const first = createResponseShapeRecord(classification, { status: 200, content: { mimeType: "application/json", size: 100 } }, { items: [{ id: "a" }] });
  const second = createResponseShapeRecord(classification, { status: 200, content: { mimeType: "application/json", size: 180 } }, { items: [{ id: "b", title: "x" }] });
  const merged = mergeResponseShapeRecords(first, second);
  assert.equal(merged.captures, 2);
  assert.equal(merged.minBodyBytes, 100);
  assert.equal(merged.maxBodyBytes, 180);
  assert.equal(merged.shape.fields.items.shape.items.fields.title.optional, true);
});
