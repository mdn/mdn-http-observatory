import { STATUS_CODES } from "./utils.js";

export class AppError extends Error {
  // @ts-ignore
  constructor(...args) {
    super(...args);
    this.name = "error-unknown";
    this.statusCode = STATUS_CODES.internalServerError;
  }
}

export class SiteIsDownError extends AppError {
  constructor() {
    super("Site is down");
    this.name = "site-down";
    this.statusCode = STATUS_CODES.badRequest;
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
    this.statusCode = STATUS_CODES.internalServerError;
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
