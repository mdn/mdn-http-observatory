import { STATUS_CODES } from "./utils.js";

export class AppError extends Error {
  // @ts-expect-error
  constructor(...args) {
    super(...args);
    this.name = "error-unknown";
    this.statusCode = STATUS_CODES.internalServerError;
  }
}

export class SiteIsDownError extends AppError {
  constructor() {
    super("The site seems to be down.");
    this.name = "site-down";
    this.statusCode = STATUS_CODES.unprocessableEntity;
  }
}

export class UnexpectedStatusCodeError extends AppError {
  /**
   * @param {number} responseStatusCode - The status code the scanned site responded with
   */
  constructor(responseStatusCode) {
    super(
      `Site did respond with an unexpected HTTP status code ${responseStatusCode}.`
    );
    this.name = "unexpected-status-code";
    this.statusCode = STATUS_CODES.unprocessableEntity;
  }
}

export class NotFoundError extends AppError {
  constructor() {
    super("Resource Not Found");
    this.name = "not-found";
    this.statusCode = STATUS_CODES.notFound;
  }
}
export class ScanFailedError extends AppError {
  /**
   * @param {Error} e
   */
  constructor(e) {
    super("Scan Failed");
    this.name = "scan-failed";
    // A scan can fail because the scanned site is unusable, which is not our
    // fault. Keep the status code of the underlying `AppError` in that case,
    // and only report a server error for genuinely unexpected failures.
    this.statusCode =
      e instanceof AppError ? e.statusCode : STATUS_CODES.internalServerError;
    this.message = e.message;
  }
}
export class InvalidHostNameIpError extends AppError {
  constructor() {
    super("Cannot scan IP addresses");
    this.name = "invalid-hostname-ip";
    this.statusCode = STATUS_CODES.unprocessableEntity;
  }
}

export class InvalidHostNameError extends AppError {
  constructor() {
    super(`Invalid hostname`);
    this.name = "invalid-hostname";
    this.statusCode = STATUS_CODES.unprocessableEntity;
  }
}

export class InvalidHostNameLookupError extends AppError {
  /**
   *
   * @param {string} hostname
   */
  constructor(hostname) {
    super(`${hostname} cannot be resolved`);
    this.name = "invalid-hostname-lookup";
    this.statusCode = STATUS_CODES.unprocessableEntity;
  }
}

export class InvalidSiteError extends AppError {
  /**
   * @param {string} siteString
   * @param {string} reason
   */
  constructor(siteString, reason) {
    super(`${siteString} is invalid: ${reason}`);
    this.name = "invalid-site";
    this.statusCode = STATUS_CODES.unprocessableEntity;
  }
}
