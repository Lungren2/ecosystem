import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("a first installation handles CRLF selection and guards local divergence", (t) => {
  const root = mkdtempSync(join(tmpdir(), "acf-baseline-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const upstream = join(root, "upstream");
  const checkout = join(root, "checkout");
  const scripts = join(checkout, "practice/reference/acf");
  mkdirSync(upstream);
  mkdirSync(scripts, { recursive: true });
  const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(upstream, "init");
  git(checkout, "init");
  for (const [path, content] of [
    ["AGENTS.md", "Fixture instructions\n"],
    ["LICENSE", "Fixture license\n"],
    [".gitattributes", "* text=auto eol=lf\n"],
    ["registry/sources/instructions/fixture.md", "Historical only\n"],
    [".codex/skills/fixture/SKILL.md", "Fixture skill\n"],
    [".codex/skills/fixture/references/example.md", "Owned reference\n"],
  ]) {
    const target = join(upstream, path);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, content);
  }
  git(upstream, "add", ".");
  git(upstream, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "commit", "-m", "fixture");
  const commit = git(upstream, "rev-parse", "HEAD");
  const tree = git(upstream, "rev-parse", "HEAD^{tree}");
  for (const name of ["fetch-acf-reference.sh", "verify-acf-reference.sh", "install-selected-skills.sh", "verify-selected-skills-baseline.sh"]) {
    cpSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), join(scripts, name));
  }
  // Use local fixture history, not the network or the user's reference checkout.
  writeFileSync(join(scripts, "upstream.env"), `ACF_REPOSITORY='${upstream.replaceAll("\\", "/")}'\nACF_COMMIT=${commit}\nACF_TREE=${tree}\nACF_REFERENCE_PATH=.references/agent-context-framework\n`);
  writeFileSync(join(scripts, "selected-skills.txt"), "fixture\r\n");
  const bash = process.platform === "win32"
    ? join(process.env.ProgramFiles || "C:\\Program Files", "Git/bin/bash.exe")
    : "bash";
  const run = (name) => spawnSync(bash, [join(scripts, name)], { cwd: checkout, encoding: "utf8" });
  const install = run("install-selected-skills.sh");
  assert.equal(install.status, 0, install.stdout + install.stderr);
  const verify = run("verify-selected-skills-baseline.sh");
  assert.equal(verify.status, 0, verify.stdout + verify.stderr);
  const again = run("install-selected-skills.sh");
  assert.equal(again.status, 0, again.stdout + again.stderr);
  assert.match(again.stdout, /Already installed: fixture/);
  const installedSkill = join(checkout, ".codex/skills/fixture/SKILL.md");
  writeFileSync(installedSkill, "Local adaptation\n");
  const divergence = run("install-selected-skills.sh");
  assert.notEqual(divergence.status, 0);
  assert.match(divergence.stderr, /Refusing to overwrite modified skill/);
  assert.equal(readFileSync(installedSkill, "utf8"), "Local adaptation\n");
  assert.notEqual(run("verify-selected-skills-baseline.sh").status, 0);
  const referenceSkill = join(checkout, ".references/agent-context-framework/.codex/skills/fixture/SKILL.md");
  writeFileSync(referenceSkill, "Local reference edit\n");
  const dirty = run("fetch-acf-reference.sh");
  assert.notEqual(dirty.status, 0);
  assert.match(dirty.stderr, /Reference clone has local changes/);
  assert.equal(readFileSync(referenceSkill, "utf8"), "Local reference edit\n");
});
