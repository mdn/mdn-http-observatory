#!/usr/bin/env node
"use strict";

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve __dirname from ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the environment variable for extra CA certificates
let caCertPath = import.meta.resolve("node_extra_ca_certs_mozilla_bundle");
caCertPath = new URL(caCertPath).pathname;
caCertPath = path.dirname(caCertPath);
caCertPath = path.join(caCertPath, "ca_bundle", "ca_intermediate_bundle.pem");
process.env.NODE_EXTRA_CA_CERTS = caCertPath;

// The target script you want to run (relative to this script's directory)
const targetScript = path.join(__dirname, "..", "src", "scan.js");

// Forward any arguments passed to this script
const args = process.argv.slice(2);

// Spawn a new Node process to run the target script with inherited stdio
const result = spawnSync(process.execPath, [targetScript, ...args], {
  stdio: "inherit",
  env: process.env,
});

// Exit with the same code the spawned script returned
process.exit(result.status ?? 1);
