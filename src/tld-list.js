import axios from "axios";
import { writeFile } from "fs/promises";

const TLD_LIST_URL = new URL(
  "https://data.iana.org/TLD/tlds-alpha-by-domain.txt"
);

/**
 * Download the IANA-maintained public suffix list
 * @param {string} filePath
 */
export async function retrieveAndStoreTldList(filePath) {
  let r;
  try {
    r = await axios.get(TLD_LIST_URL.href);
  } catch (error) {
    console.error("Error getting data:", error);
    return;
  }
  const data = cleanData(r.data);
  try {
    await writeFile(filePath, data);
    console.log(`Downloaded TLD list and saved it to ${filePath}`);
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
  const ret = data
    .replace(/#.*$/gm, "")
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .filter((line) => line.trim() !== "")
    .map((line) => line.trim().toLowerCase());
  return JSON.stringify(ret);
}
