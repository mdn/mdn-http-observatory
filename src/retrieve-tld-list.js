import axios from "axios";
import { writeFile } from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TLD_LIST_URL = new URL(
  "https://data.iana.org/TLD/tlds-alpha-by-domain.txt"
);

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Download the IANA-maintained public suffix list
 */
export async function retrieveAndStoreTldList() {
  let r;
  try {
    r = await axios.get(TLD_LIST_URL.href);
  } catch (error) {
    console.error("Error getting data:", error);
    return;
  }
  const data = cleanData(r.data);
  const filePath = path.join(dirname, "..", "conf", "tld-list.json");
  try {
    await writeFile(filePath, `[${data}]`);
    console.log(`File written to ${filePath}`);
  } catch (error) {
    console.error("Error writing file:", error);
    return;
  }
}

/**
 *
 * @param {string} data
 * @returns {string}
 */
function cleanData(data) {
  return data
    .replace(/#.*$/gm, "")
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .filter((line) => line.trim() !== "")
    .map((line) => `"${line.trim().toLowerCase()}"`)
    .join(",\n");
}

// Execute when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  retrieveAndStoreTldList().catch(console.error);
}
