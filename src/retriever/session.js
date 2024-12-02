import axios, { AxiosHeaders } from "axios";
import { CONFIG } from "../config.js";
import { HttpCookieAgent, HttpsCookieAgent } from "http-cookie-agent/http";
import { CookieJar } from "tough-cookie";

const ABORT_TIMEOUT = CONFIG.retriever.abortTimeout;
const CLIENT_TIMEOUT = CONFIG.retriever.clientTimeout;

const CERT_ERROR_CODES = [
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_CRL",
  "UNABLE_TO_DECRYPT_CERT_SIGNATURE",
  "UNABLE_TO_DECRYPT_CRL_SIGNATURE",
  "UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY",
  "CERT_SIGNATURE_FAILURE",
  "CRL_SIGNATURE_FAILURE",
  "CERT_NOT_YET_VALID",
  "CERT_HAS_EXPIRED",
  "CRL_NOT_YET_VALID",
  "CRL_HAS_EXPIRED",
  "ERROR_IN_CERT_NOT_BEFORE_FIELD",
  "ERROR_IN_CERT_NOT_AFTER_FIELD",
  "ERROR_IN_CRL_LAST_UPDATE_FIELD",
  "ERROR_IN_CRL_NEXT_UPDATE_FIELD",
  "OUT_OF_MEM",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "CERT_CHAIN_TOO_LONG",
  "CERT_REVOKED",
  "INVALID_CA",
  "PATH_LENGTH_EXCEEDED",
  "INVALID_PURPOSE",
  "CERT_UNTRUSTED",
  "CERT_REJECTED",
  "HOSTNAME_MISMATCH",
  "ERR_TLS_CERT_ALTNAME_INVALID",
];

const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308];

const MAX_REDIRECTS = 10;

export class Session {
  /** @type {URL} */
  url;

  /** @type {import("axios").AxiosInstance | null} */
  clientInstanceRecordingRedirects;
  /** @type {import("axios").AxiosInstance | null} */
  clientInstance;
  /** @type {import("../types.js").HttpResponse | null} */
  response = null;
  /** @type {import("../types.js").RedirectEntry[]} */
  redirectHistory;
  /** @type {number} */
  redirectCount;
  /** @type {CookieJar} */
  jar;

  /**
   *
   * @param {URL} url
   * @param {{ headers?: string[]; cookies?: string[]; }} [options = {}]
   */
  constructor(url, { headers: headerParams, cookies } = {}) {
    this.redirectHistory = [];
    this.redirectCount = 0;
    const headers = new AxiosHeaders(headerParams?.join("\n"));
    if (!headers.getUserAgent()) {
      headers.setUserAgent(CONFIG.retriever.retrieverUserAgent);
    }
    this.url = url;
    this.jar = new CookieJar();

    // Configure the axios instance to not automatically follow redirects
    // to be able to record all redirects (and handling them manually).
    const axiosInstance = axios.create({
      headers,
      maxRedirects: 0,
      validateStatus: () => true,
      httpsAgent: new HttpsCookieAgent({
        rejectUnauthorized: true,
        cookies: { jar: this.jar },
      }),
      httpAgent: new HttpCookieAgent({
        cookies: { jar: this.jar },
      }),
      signal: AbortSignal.timeout(ABORT_TIMEOUT),
    });

    // Add an interceptor to record and request all redirections we encounter
    const ic = this.createInterceptor();
    if (ic.response) {
      axiosInstance.interceptors.response.use(ic.response, ic.error);
    }

    this.clientInstanceRecordingRedirects = axiosInstance;
    // used for additional resourece requests, without recording redirects
    this.clientInstance = axios.create({
      headers,
      maxRedirects: MAX_REDIRECTS,
    });
  }

  createInterceptor() {
    const that = this;
    return {
      response: function (
        /** @type { import("axios").AxiosResponse<any, any>} */ response
      ) {
        // push our url to the redirection chain
        const url = response.config.url ?? that.url;
        that.redirectHistory.push({
          url: new URL(url),
          status: response.status,
        });

        if (
          that.redirectCount < MAX_REDIRECTS &&
          response.status &&
          REDIRECT_STATUS_CODES.includes(response.status)
        ) {
          const url =
            that.redirectHistory[that.redirectHistory.length - 1].url.href;
          const redirectUrl = response.headers.location;
          const newUrl = new URL(redirectUrl, url);
          that.redirectCount++;
          if (!that.clientInstanceRecordingRedirects) {
            throw new Error("clientInstanceRecordingRedirects is null");
          }
          return that.clientInstanceRecordingRedirects.get(newUrl.href, {
            timeout: CLIENT_TIMEOUT,
          });
        }
        return response;
      },
      error: function (/** @type {any} */ error) {
        return Promise.reject(error);
      },
    };
  }

  async init() {
    if (!this.clientInstanceRecordingRedirects) {
      this.response = null;
      return this;
    }
    try {
      const resp = await this.clientInstanceRecordingRedirects.get(
        this.url.href,
        {
          timeout: CLIENT_TIMEOUT,
        }
      );
      this.response = {
        ...resp,
        verified:
          this.clientInstanceRecordingRedirects.defaults.httpsAgent.options
            .rejectUnauthorized,
      };
    } catch (e) {
      // Check for a cert error and replace the httpsAgent with
      // a non-verifying one
      let code;
      if (e && typeof e === "object" && "code" in e) {
        code = String(e.code);
      } else {
        code = null;
      }
      if (
        code &&
        CERT_ERROR_CODES.indexOf(code) !== -1 &&
        this.clientInstanceRecordingRedirects.defaults.httpsAgent.options
          .rejectUnauthorized
      ) {
        // console.log("retrying without TLS verification");
        this.redirectHistory = [];
        const interceptor =
          this.clientInstanceRecordingRedirects.interceptors.response;
        this.clientInstanceRecordingRedirects = axios.create({
          ...this.clientInstanceRecordingRedirects.defaults,
          httpsAgent: new HttpsCookieAgent({
            rejectUnauthorized: false,
            cookies: { jar: this.jar },
          }),
        });
        const ic = this.createInterceptor();
        this.clientInstanceRecordingRedirects.interceptors.response.use(
          ic.response,
          ic.error
        );
        if (!this.clientInstance) {
          throw new Error("clientInstance is null");
        }
        this.clientInstance = axios.create({
          ...this.clientInstance.defaults,
          signal: AbortSignal.timeout(ABORT_TIMEOUT),
          httpsAgent: new HttpsCookieAgent({
            rejectUnauthorized: false,
            cookies: { jar: this.jar },
          }),
        });
        this.clientInstance.interceptors.response.use(ic.response, ic.error);
        // retry with verification off
        await this.init();
        return this;
      }
      this.clientInstance = null;
      this.clientInstanceRecordingRedirects = null;
      this.response = null;
    }
    return this;
  }

  /**
   *
   * @param {URL} url
   * @param {{ headers?: string[]; cookies?: string[]; }} [options = {}]
   * @returns Session
   */
  static async fromUrl(url, { headers: headerParams, cookies } = {}) {
    return await new Session(url, { headers: headerParams, cookies }).init();
  }

  /**
   *
   * @param {{ url?: string, path?: string, headers?: object }} param1
   * @returns
   */
  async get({ url = this.url.href, path, headers }) {
    if (!this.clientInstance) {
      return null;
    }
    const reqUrl = path ? new URL(path, url).href : url;
    try {
      const res = await this.clientInstance.get(reqUrl, {
        headers,
        timeout: CLIENT_TIMEOUT,
      });
      return res;
    } catch (e) {
      return null;
    }
  }

  /**
   *
   * @param {{ url?: string, path?: string, headers?: object }} param1
   * @returns
   */
  async options({ url = this.url.href, path, headers }) {
    if (!this.clientInstance) {
      return null;
    }
    const reqUrl = path ? new URL(path, url).href : url;
    try {
      const res = await this.clientInstance.options(reqUrl, {
        headers,
        timeout: CLIENT_TIMEOUT,
      });
      return res;
    } catch (e) {
      return null;
    }
  }
}

/**
 *
 * @param {import("axios").AxiosResponse | null} response
 * @param {boolean} [force]
 */
export function getPageText(response, force = false) {
  if (!response) {
    return null;
  }

  if (response.status === 200 || force) {
    return response.data;
  }

  return null;
}
