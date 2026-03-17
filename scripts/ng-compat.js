#!/usr/bin/env node

const { spawn } = require("child_process");

const ngCliPath = require.resolve("@angular/cli/bin/ng");
const args = process.argv.slice(2);
const major = Number(process.versions.node.split(".")[0]);
const env = { ...process.env };

if (major >= 17) {
  const flag = "--openssl-legacy-provider";
  const existing = env.NODE_OPTIONS || "";
  if (!existing.includes(flag)) {
    env.NODE_OPTIONS = `${existing} ${flag}`.trim();
  }
}

const child = spawn(process.execPath, [ngCliPath, ...args], {
  env,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code == null ? 1 : code));
child.on("error", () => process.exit(1));
