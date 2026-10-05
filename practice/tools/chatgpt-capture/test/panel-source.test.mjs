import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("DevTools panel source parses", () => {
  const panelPath = fileURLToPath(new URL("../extension/panel.js", import.meta.url));
  const result = spawnSync(process.execPath, ["--check", panelPath], {
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    result.stderr || result.stdout || "panel.js failed node --check",
  );
});
