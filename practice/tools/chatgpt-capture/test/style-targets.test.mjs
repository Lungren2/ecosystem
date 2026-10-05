import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { isStyleTargetAttribute, sanitizeStyleTargetValue } from "../extension/style-targets.mjs";

test("recognizes observed semantic and layout data attributes", () => {
  for (const name of [
    "data-state",
    "data-variant",
    "data-app-shell-left-panel-appearance",
    "data-app-action-sidebar-section",
    "data-thread-title",
    "data-user-message-bubble",
    "data-conversation-role",
    "data-composer-layout",
    "data-floating-chat-surface",
  ]) {
    assert.equal(isStyleTargetAttribute(name), true, name);
  }
  assert.equal(isStyleTargetAttribute("class"), false);
  assert.equal(isStyleTargetAttribute("data-token"), false);
});

test("preserves only short enum-like values for approved styling attributes", () => {
  assert.equal(sanitizeStyleTargetValue("data-state", "open"), "open");
  assert.equal(sanitizeStyleTargetValue("data-variant", "ghost"), "ghost");
  assert.equal(sanitizeStyleTargetValue("data-composer-density", "compact"), "compact");
  assert.equal(sanitizeStyleTargetValue("data-conversation-role", "assistant"), "assistant");
  assert.equal(sanitizeStyleTargetValue("data-thread-title", "private-title"), null);
  assert.equal(sanitizeStyleTargetValue("data-variant", "private value"), null);
  assert.equal(sanitizeStyleTargetValue("data-variant", "x".repeat(40)), null);
});

test("style target helpers run without module scope", () => {
  const target = runInNewContext(`(${isStyleTargetAttribute.toString()})`);
  const value = runInNewContext(`(${sanitizeStyleTargetValue.toString()})`);
  assert.equal(target("data-thread-title"), true);
  assert.equal(value("data-state", "closed"), "closed");
});
