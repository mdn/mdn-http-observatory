import http from "node:http";
import { spawn } from "node:child_process";

/** @param {{ info: (msg: string) => void }} core */
export async function scanLocalServer(core) {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, {
      "Content-Security-Policy": "default-src 'self'; connect-src 'none'",
      "Content-Type": "text/html",
      "Referrer-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    });
    res.end("<html><head><title>Test</title></head><body>OK</body></html>");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const port = server.address().port;

  core.info(`Server listening on 127.0.0.1:${port}`);

  try {
    const output = await new Promise((resolve, reject) => {
      const child = spawn("mdn-http-observatory-scan", [`127.0.0.1:${port}`], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (d) => (stdout += d));
      child.stderr.on("data", (d) => (stderr += d));

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Exit ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });

    core.info(output);

    const result = JSON.parse(output);

    if (!result.scan) {
      throw new Error("missing scan in output");
    }

    if (!result.tests) {
      throw new Error("missing tests in output");
    }

    core.info(`Scan completed with ${Object.keys(result.tests).length} tests`);
  } finally {
    server.close();
  }
}
