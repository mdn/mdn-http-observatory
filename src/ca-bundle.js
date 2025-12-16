import axios from "axios";
import { writeFile } from "fs/promises";
import Papa from "papaparse";

const INTERMEDIATE_CA_URL =
  "https://ccadb.my.salesforce-sites.com/mozilla/PublicAllIntermediateCertsWithPEMCSV";

const ROOT_CA_URL =
  "https://ccadb.my.salesforce-sites.com/mozilla/IncludedCACertificateReportPEMCSV";

/**
 * @param {string} url
 * @returns {Promise<string[]>}
 */
async function downloadCertificates(url) {
  let r;
  try {
    r = await axios.get(url);
  } catch (error) {
    throw Error(`Failed to get data: ${error}`);
  }

  const data = Papa.parse(r.data, { header: true }).data;
  const output = [];
  for (const entry of data) {
    // Remove quotes from beginning and end of certificate
    const certPem = entry["PEM Info"].slice(1, -1);
    const commonName = entry["Common Name or Certificate Name"];
    output.push(`${commonName}\n${certPem}`);
  }
  return output;
}

/**
 * @returns {Promise<string>}
 */
async function retrieveCABundle() {
  // Download at the same time
  const values = await Promise.all([
    downloadCertificates(INTERMEDIATE_CA_URL),
    downloadCertificates(ROOT_CA_URL),
  ]);

  const intermediateCACerts = values[0];
  const rootCACerts = values[1];

  const combinedCACerts = intermediateCACerts.concat(rootCACerts);
  return combinedCACerts.join("\n\n");
}

/**
 * @param {string} filePath
 */
export async function retrieveAndStoreCABundle(filePath) {
  const caBundle = await retrieveCABundle();

  try {
    await writeFile(filePath, caBundle);
    console.log(`Downloaded Mozilla CA bundle and saved it to ${filePath}`);
  } catch (error) {
    console.error("Error writing file:", error);
    return;
  }
}

/**
 *
 * @param {string} filePath
 */
export async function setupCABundle(filePath) {
  process.env.NODE_EXTRA_CA_CERTS = filePath;
}
