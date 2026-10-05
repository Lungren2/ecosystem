import assert from "node:assert/strict";
import test from "node:test";

import {
  createPseudonymizer,
  safeFilename,
  sanitizeHar,
  sanitizeUrl,
  summarizeHar,
} from "../extension/capture-core.mjs";

test("sanitizeUrl removes text, secrets, fragments, unsupported schemes, and identifiers", () => {
  const pseudonymize = createPseudonymizer();
  const url = sanitizeUrl(
    "https://chatgpt.com/backend-api/conversation/123e4567-e89b-12d3-a456-426614174000?offset=28&user_id=123456789&query=private&token=secret#fragment",
    pseudonymize,
  );

  assert.equal(
    url,
    "https://chatgpt.com/backend-api/conversation/id_001?offset=28&user_id=%5BREDACTED%5D&query=%5BREDACTED%5D&token=%5BREDACTED%5D",
  );
  assert.equal(sanitizeUrl("data:image/png;base64,private", pseudonymize), "[REDACTED]");
  assert.match(
    sanitizeUrl("wss://ws.chatgpt.com/p1/ws/user/user-7DxIcVzCEKHjXvnJv5n85PKM?verify=123456789012345678901234", pseudonymize),
    /^wss:\/\/ws\.chatgpt\.com\/p1\/ws\/user\/id_\d+\?verify=id_\d+$/,
  );
});

test("sanitizeHar accepts Chrome getHAR shape, filters by time, and allowlists output fields", () => {
  const har = {
    version: "1.2",
    creator: { name: "Chrome", version: "155" },
    pages: [{ title: "Private title" }],
    entries: [
      {
        startedDateTime: "2026-10-05T00:00:00.000Z",
        request: { method: "GET", url: "https://chatgpt.com/old", headers: [] },
        response: { headers: [], content: { text: "old body" } },
      },
      {
        startedDateTime: "2026-10-05T00:01:00.000Z",
        time: 42,
        request: {
          method: "POST",
          url: "https://chatgpt.com/backend-api/conversation/123e4567-e89b-12d3-a456-426614174000?limit=28",
          httpVersion: "h2",
          headers: [
            { name: "Authorization", value: "Bearer test-sensitive" },
            { name: "Cookie", value: "session=test-sensitive" },
            { name: "Content-Type", value: "application/json" },
          ],
          cookies: [{ name: "session", value: "test-sensitive" }],
          queryString: [{ name: "limit", value: "28" }],
          postData: {
            mimeType: "application/json",
            text: JSON.stringify({
              conversation_id: "123e4567-e89b-12d3-a456-426614174000",
              action: "archive",
              title: "Personal title",
              active: true,
            }),
          },
        },
        response: {
          status: 200,
          statusText: "OK",
          httpVersion: "h2",
          headers: [{ name: "Set-Cookie", value: "session=test-sensitive" }],
          cookies: [{ name: "session", value: "test-sensitive" }],
          content: { mimeType: "application/json", text: "private body", size: 12 },
          redirectURL: "",
        },
        serverIPAddress: "127.0.0.1",
      },
    ],
  };

  const sanitized = sanitizeHar(har, {
    startedAt: Date.parse("2026-10-05T00:00:30.000Z"),
  });

  assert.equal(sanitized.entries.length, 1);
  assert.equal("pages" in sanitized, false);
  const entry = sanitized.entries[0];
  assert.match(entry.request.url, /\/conversation\/id_001\?limit=28$/);
  assert.deepEqual(entry.request.headers, [{ name: "Content-Type", value: "application/json" }]);
  assert.equal("cookies" in entry.request, false);
  assert.equal("cookies" in entry.response, false);
  assert.equal("headers" in entry.response, false);
  assert.equal("serverIPAddress" in entry, false);
  assert.deepEqual(entry.response.content, { mimeType: "application/json", size: 12 });

  const body = JSON.parse(entry.request.postData.text);
  assert.equal(body.conversation_id, "id_001");
  assert.equal(body.action, "archive");
  assert.equal(body.title, "<redacted:text>");
  assert.equal(body.active, true);

  const serialized = JSON.stringify(sanitized);
  assert.equal(serialized.includes("Bearer test-sensitive"), false);
  assert.equal(serialized.includes("session=test-sensitive"), false);
  assert.equal(serialized.includes("private body"), false);
  assert.equal(serialized.includes("Private title"), false);
});

test("sanitizeHar still accepts a wrapped HAR object", () => {
  const sanitized = sanitizeHar({
    log: {
      version: "1.2",
      entries: [{
        startedDateTime: "2026-10-05T00:01:00.000Z",
        request: { method: "GET", url: "https://chatgpt.com/backend-api/conversations?offset=0" },
        response: { status: 200, content: { mimeType: "application/json", size: 10 } },
      }],
    },
  });
  assert.equal(sanitized.entries.length, 1);
});

test("summarizeHar groups methods, hosts, and sanitized routes", () => {
  const summary = summarizeHar({
    entries: [
        { request: { method: "GET", url: "https://chatgpt.com/backend-api/conversations?offset=0" } },
        { request: { method: "GET", url: "https://chatgpt.com/backend-api/conversations?offset=28" } },
        { request: { method: "POST", url: "https://chatgpt.com/backend-api/conversation/id_001" } },
    ],
  });

  assert.equal(summary.entryCount, 3);
  assert.deepEqual(summary.methods, [
    { name: "GET", count: 2 },
    { name: "POST", count: 1 },
  ]);
  assert.deepEqual(summary.hosts, [{ name: "chatgpt.com", count: 3 }]);
  assert.equal(summary.routes[0].name, "GET https://chatgpt.com/backend-api/conversations");
  assert.equal(summary.routes[0].count, 2);
});

test("safeFilename produces a bounded portable label", () => {
  assert.equal(safeFilename("  Archive one / test  "), "archive-one-test");
  assert.equal(safeFilename("***"), "capture");
});
