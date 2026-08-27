/**
 * ApiResponse
 * { 
 *     statusCode: Number,
 *     success: Boolean, 
 *     message: String, 
 *     data: Any 
 *  }
 */

class ApiResponse {
  /**
   * Core method - sends a uniform JSON response
   * @param {import('express').Response} res - Express response object
   * @param {Object} options
   * @param {number} options.statusCode - HTTP status code
   * @param {boolean} options.success - Whether the request was successful
   * @param {string} options.message - Human-readable message
   * @param {*} options.data - Response payload (any type)
   */
  static send(res, { statusCode = 200, success = true, message = '', data = null } = {}) {
    return res.status(statusCode).json({
      statusCode,
      success,
      message,
      data
    });
  }

  // ── Success Shortcuts ──────────────────────────────────────────────

  /**
   * 200 OK
   */
  static success(res, { statusCode = 200, message = 'Request successful', data = null } = {}) {
    return ApiResponse.send(res, { statusCode, success: true, message, data });
  }

  /**
   * 201 Created
   */
  static created(res, { message = 'Resource created successfully', data = null } = {}) {
    return ApiResponse.send(res, { statusCode: 201, success: true, message, data });
  }

  // ── Error Shortcuts ────────────────────────────────────────────────

  /**
   * Generic error - any status code
   */
  static error(res, { statusCode = 500, message = 'Internal server error', data = null } = {}) {
    return ApiResponse.send(res, { statusCode, success: false, message, data });
  }

  /**
   * 400 Bad Request
   */
  static badRequest(res, { message = 'Bad request', data = null } = {}) {
    return ApiResponse.send(res, { statusCode: 400, success: false, message, data });
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(res, { message = 'Unauthorized', data = null } = {}) {
    return ApiResponse.send(res, { statusCode: 401, success: false, message, data });
  }

  /**
   * 403 Forbidden
   */
  static forbidden(res, { message = 'Forbidden', data = null } = {}) {
    return ApiResponse.send(res, { statusCode: 403, success: false, message, data });
  }

  /**
   * 404 Not Found
   */
  static notFound(res, { message = 'Resource not found', data = null } = {}) {
    return ApiResponse.send(res, { statusCode: 404, success: false, message, data });
  }

  /**
   * 409 Conflict
   */
  static conflict(res, { message = 'Resource conflict', data = null } = {}) {
    return ApiResponse.send(res, { statusCode: 409, success: false, message, data });
  }

  /**
   * 422 Unprocessable Entity (Validation Error)
   */
  static validationError(res, { message = 'Input validation failed', data = null } = {}) {
    return ApiResponse.send(res, { statusCode: 422, success: false, message, data });
  }

  /**
   * 429 Too Many Requests
   */
  static tooManyRequests(res, { message = 'Too many requests, please try again later', data = null } = {}) {
    return ApiResponse.send(res, { statusCode: 429, success: false, message, data });
  }

  /**
   * 500 Internal Server Error
   */
  static internalError(res, { message = 'Internal server error', data = null } = {}) {
    return ApiResponse.send(res, { statusCode: 500, success: false, message, data });
  }
}

module.exports = ApiResponse;
