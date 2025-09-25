import { AppError } from "./errors.js";
import { STATUS_CODES } from "./utils.js";

/**
 * @type {import("../types.js").StringMap}
 */

/**
 * Global error handler
 * @param {import("fastify").FastifyError} error
 * @param {import("fastify").FastifyRequest} _request
 * @param {import("fastify").FastifyReply} reply
 * @returns {Promise<import("fastify").FastifyReply>}
 */
export default async function globalErrorHandler(error, _request, reply) {
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
