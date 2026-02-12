#!/usr/bin/env node

import { Command } from "commander";
import { scan } from "./scanner/index.js";
import { Site } from "./site.js";

const NAME = "mdn-http-observatory-scan";
const program = new Command();

program
  .name(NAME)
  .description("CLI for the MDN HTTP Observatory scan functionality")
  .version("1.0.0")
  .argument("<hostname>", "hostname to scan")
  .option("--headers <json>", "extra request headers as JSON")
  .action(async (siteString, options) => {
    try {
      /** @type {import("./types.js").ScanOptions} */
      const scanOptions = {};
      if (options.headers) {
        let parsed;
        try {
          parsed = JSON.parse(options.headers);
        } catch {
          console.log(JSON.stringify({ error: "Invalid JSON for --headers" }));
          process.exit(1);
        }
        scanOptions.headers = Object.entries(parsed).map(
          ([k, v]) => `${k}: ${v}`
        );
      }
      const site = Site.fromSiteString(siteString);
      const result = await scan(site, scanOptions);
      const tests = Object.fromEntries(
        Object.entries(result.tests).map(([key, test]) => {
          const { scoreDescription, ...rest } = test;
          return [key, rest];
        })
      );
      const ret = {
        scan: result.scan,
        tests: tests,
      };
      console.log(JSON.stringify(ret, null, 2));
    } catch (e) {
      if (e instanceof Error) {
        console.log(JSON.stringify({ error: e.message }));
        process.exit(1);
      }
    }
  });

program.parse();
