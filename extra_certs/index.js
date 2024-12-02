import csvtojson from "csvtojson";
import fs from "fs";
import request from "axios";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @param {string} url
 */
async function appendPEMFromUrl(url, individualFiles = false) {
  console.log(`Downloading from URL ${url}`);
  const response = await request.get(url, { responseType: "blob" });
  console.log("Parsing csv file");
  const jsonData = await csvtojson().fromString(response.data);
  const output = [];
  let i = 0;
  for (const entry of jsonData) {
    // Retrieve PEM Info column and remove quotes in beginning and end
    let certPem = entry["PEM Info"].slice(1, -1);
    const commonName =
      entry["Common Name or Certificate Name"] ||
      entry["Certificate Subject Common Name"];
    const serialNumber = entry["Certificate Serial Number"];
    const issuerOrg = entry["Certificate Issuer Organization"];

    // Remove empty lines in certPem some certificates were coming with blank line e.g.
    // Shopper SSL
    // Unizeto Technologies S.A.
    // 3ABFBB7CED7B8FFFD9862B934C02AF96
    certPem = certPem.replace(
      /-----BEGIN CERTIFICATE-----\n\n/gm,
      "-----BEGIN CERTIFICATE-----\n"
    );
    certPem = certPem.replace(
      /-----BEGIN CERTIFICATE-----\r\n\r\n/gm,
      "-----BEGIN CERTIFICATE-----\n"
    );
    certPem = certPem.replace(
      /-----BEGIN CERTIFICATE-----\r\n\n/gm,
      "-----BEGIN CERTIFICATE-----\n"
    );
    certPem = certPem.replace(
      /-----BEGIN CERTIFICATE-----\n\r\n/gm,
      "-----BEGIN CERTIFICATE-----\n"
    );

    i += 1;
    // Add common Name and serial number
    process.stdout.write(`Processing ${commonName}`.padEnd(80) + "\r");
    if (individualFiles) {
      const fileName = `${commonName.replace(/\W/g, "")}_${i}.pem`;
      fs.writeFileSync(
        fileName,
        `${commonName}\n${issuerOrg}\n${serialNumber}\n${certPem}\n\n`
      );
    }
    output.push(`${commonName}\n${issuerOrg}\n${serialNumber}\n${certPem}\n\n`);
  }
  process.stdout.write(`All certificates processed`.padEnd(80) + "\r");
  console.log(`\nURL ${url} processed\n\n`);
  return output.join("");
}

export async function build() {
  // Ensure dist directory
  if (!fs.existsSync("ca_bundle")) {
    fs.mkdirSync("ca_bundle");
  }

  // Add intermediate certificates
  const ca_intermediate_bundle = await appendPEMFromUrl(
    "https://ccadb-public.secure.force.com/mozilla/PublicAllIntermediateCertsWithPEMCSV"
  );

  // Add root certificates
  const ca_root_bundle = await appendPEMFromUrl(
    "https://ccadb-public.secure.force.com/mozilla/IncludedCACertificateReportPEMCSV"
  );

  fs.writeFileSync(
    "ca_bundle/ca_intermediate_bundle.pem",
    ca_intermediate_bundle
  );
  fs.writeFileSync("ca_bundle/ca_root_bundle.pem", ca_root_bundle);
  fs.writeFileSync(
    "ca_bundle/ca_intermediate_root_bundle.pem",
    ca_intermediate_bundle + ca_root_bundle
  );

  console.log();
  console.log(
    "Intermediate and Root Certificate Bundles from Mozilla generated"
  );
  console.log(
    "----------------------------------------------------------------"
  );
  console.log(
    "Intermediate certificates only bundle at ca_bundle/ca_intermediate_bundle.pem"
  );
  console.log("Root only certificates bundle at ca_bundle/ca_root_bundle.pem");
  console.log(
    "Intermediate and Root certificates bundle at ca_bundle/ca_intermediate_root_bundle.pem"
  );
  console.log();
  console.log("To run your Node script with the bundled certificate run:");
  console.log(
    "NODE_EXTRA_CA_CERTS=node_modules/node_extra_ca_certs_mozilla_bundle/ca_bundle/ca_intermediate_root_bundle.pem node your_script.js\n"
  );
}

export function getCaIntermediateRootBundle() {
  const p = path.join(
    __dirname,
    "ca_bundle",
    "ca_intermediate_root_bundle.pem"
  );
  const cas = fs.readFileSync(p, "utf8");
  console.log(`read cas from file system: ${cas.length} bytes`);
  return cas;
}
