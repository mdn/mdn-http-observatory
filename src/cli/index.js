import { Command } from "commander";
import { scan } from "../scanner/index.js";
const program = new Command();

program
  .name("observatory")
  .description("CLI for the MDN HTTP Observatory")
  .version("1.0.0");

program
  .command("scan")
  .description("Scan a host")
  .argument("<string>", "hostname to scan")
  .action(async (hostname, _options) => {
    try {
      const result = await scan(hostname);
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
