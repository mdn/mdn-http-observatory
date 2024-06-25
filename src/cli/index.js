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
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log(JSON.stringify({ error: e.message }));
    }
  });

program.parse();
