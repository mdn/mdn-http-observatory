import { AppError, InvalidHostNameError } from "./errors.js";
import { STATUS_CODES } from "./utils.js";

/**
 * @type {import("../types.js").StringMap}
 */
const errorInfo = {
  FST_ERR_VALIDATION: "Validation error",
};

/**
 * Global error handler
 * @param {import("fastify").FastifyError} error
 * @param {import("fastify").FastifyRequest} request
 * @param {import("fastify").FastifyReply} reply
 * @returns {Promise<import("fastify").FastifyReply>}
 */
export default async function globalErrorHandler(error, request, reply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
  }
  return reply
    .status(error.statusCode ?? STATUS_CODES.internalServerError)
    .send({
      error: "error-unknown",
      message: error.message,
    });
}
