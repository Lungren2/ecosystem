import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { sanitizeDomAttribute } from "../extension/dom-attributes.mjs";

test("unknown DOM attributes redact private values regardless of length", () => {
  for (const name of ["data-profile", "data-account", "data-preview", "custom", "class", "name", "aria-description", "aria-valuetext", "__proto__", "constructor"]) {
    for (const value of ["", "a@example.test", "paid", "My private conversation", "42", "x".repeat(161)]) {
      assert.equal(sanitizeDomAttribute(name, value), "[REDACTED]", `${name}: ${value}`);
    }
  }
});

test("structural DOM attributes preserve only allowed values", () => {
  for (const [name, value] of [
    ["role", "button"], ["type", "email"], ["dir", "rtl"], ["tabindex", "-1"],
    ["contenteditable", "plaintext-only"], ["aria-expanded", "false"],
    ["aria-checked", "mixed"], ["aria-live", "polite"], ["data-state", "open"],
  ]) {
    assert.equal(sanitizeDomAttribute(name, value), value);
    assert.equal(sanitizeDomAttribute(name.toUpperCase(), value), value);
    assert.equal(sanitizeDomAttribute(name, "private@example.test"), "[REDACTED]");
    assert.equal(sanitizeDomAttribute(name, `${value}\nprivate`), "[REDACTED]");
  }
  assert.equal(sanitizeDomAttribute("disabled", "private@example.test"), "");
});

test("DOM attributes keep existing text, identifier, URL, and executable redaction", () => {
  assert.equal(sanitizeDomAttribute("data-user-id", "account-42"), ":id");
  assert.equal(sanitizeDomAttribute("id", "account-42"), ":id");
  assert.equal(sanitizeDomAttribute("aria-label", "Private title"), "TEXT");
  assert.equal(sanitizeDomAttribute("value", "private@example.test"), "TEXT");
  assert.equal(sanitizeDomAttribute("href", "https://example.test/private"), "[REDACTED]");
  assert.equal(sanitizeDomAttribute("href", "raw", () => "sanitized-url"), "sanitized-url");
  for (const name of ["onclick", "srcdoc", "style", "data-token", "data-session", "data-auth"]) {
    assert.equal(sanitizeDomAttribute(name, "secret"), null);
  }
});

test("the inspected-window attribute policy runs without module scope", () => {
  const sanitize = runInNewContext(`(${sanitizeDomAttribute.toString()})`);
  assert.equal(sanitize("data-preview", "Private conversation"), "[REDACTED]");
  assert.equal(sanitize("aria-expanded", "true"), "true");
});
