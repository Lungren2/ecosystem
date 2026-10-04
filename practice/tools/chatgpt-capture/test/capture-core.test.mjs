import assert from "node:assert/strict";
import test from "node:test";

import {
  createPseudonymizer,
  safeFilename,
  sanitizeHar,
  sanitizeUrl,
  summarizeHar,
} from "../extension/capture-core.mjs";

test("sanitizeUrl removes text, secrets, fragments, and pseudonymizes identifiers", () => {
  const pseudonymize = createPseudonymizer();
  const url = sanitizeUrl(
    "https://chatgpt.com/backend-api/conversation/123e4567-e89b-12d3-a456-426614174000?offset=28&user_id=123456789&query=private&token=secret#fragment",
    pseudonymize,
  );

  assert.equal(
    url,
    "https://chatgpt.com/backend-api/conversation/id_001?offset=28&user_id=%5BREDACTED%5D&query=%5BREDACTED%5D&token=%5BREDACTED%5D",
  );
});

test("sanitizeHar filters by start time and removes sensitive values", () => {
  const har = {
    log: {
      version: "1.2",
      entries: [
        {
          startedDateTime: "2026-10-05T00:00:00.000Z",
          request: { method: "GET", url: "https://chatgpt.com/old", headers: [] },
          response: { headers: [], content: { text: "old body" } },
        },
        {
          startedDateTime: "2026-10-05T00:01:00.000Z",
          request: {
            method: "POST",
            url: "https://chatgpt.com/backend-api/conversation/123e4567-e89b-12d3-a456-426614174000?limit=28",
            headers: [
              { name: "Authorization", value: "Bearer secret" },
              { name: "Content-Type", value: "application/json" },
            ],
            cookies: [{ name: "session", value: "secret" }],
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
            headers: [{ name: "Set-Cookie", value: "session=secret" }],
            cookies: [{ name: "session", value: "secret" }],
            content: { mimeType: "application/json", text: "private body", size: 12 },
            redirectURL: "",
          },
        },
      ],
    },
  };

  const sanitized = sanitizeHar(har, {
    startedAt: Date.parse("2026-10-05T00:00:30.000Z"),
  });

  assert.equal(sanitized.log.entries.length, 1);
  const entry = sanitized.log.entries[0];
  assert.match(entry.request.url, /\/conversation\/id_001\?limit=28$/);
  assert.equal(entry.request.headers[0].value, "[REDACTED]");
  assert.equal(entry.request.cookies[0].value, "[REDACTED]");
  assert.equal(entry.response.headers[0].value, "[REDACTED]");
  assert.equal(entry.response.cookies[0].value, "[REDACTED]");
  assert.equal(entry.response.content.text, undefined);

  const body = JSON.parse(entry.request.postData.text);
  assert.equal(body.conversation_id, "id_001");
  assert.equal(body.action, "archive");
  assert.equal(body.title, "<redacted:text>");
  assert.equal(body.active, true);
});

test("summarizeHar groups methods, hosts, and sanitized routes", () => {
  const summary = summarizeHar({
    log: {
      entries: [
        { request: { method: "GET", url: "https://chatgpt.com/backend-api/conversations?offset=0" } },
        { request: { method: "GET", url: "https://chatgpt.com/backend-api/conversations?offset=28" } },
        { request: { method: "POST", url: "https://chatgpt.com/backend-api/conversation/id_001" } },
      ],
    },
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
