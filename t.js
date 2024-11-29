import axios from "axios";
import { HttpsCookieAgent } from "http-cookie-agent/http";
import { getCaIntermediateRootBundle } from "extra_certs";

const cas = getCaIntermediateRootBundle();
const httpsAgent = new HttpsCookieAgent({
  ca: cas, // Pass your custom CA here
  rejectUnauthorized: true, // Ensures the server certificate is verified
});

axios
  .get("https://avu.de/", {
    httpsAgent,
  })
  .then((response) => {
    console.log("Data:", response.data);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
