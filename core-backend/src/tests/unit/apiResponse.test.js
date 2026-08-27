const ApiResponse = require('../../utils/ApiResponse');

describe('ApiResponse Unit Tests', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      statusCode: 200,
      jsonData: null,
      status: jest.fn().mockImplementation(function (code) {
        this.statusCode = code;
        return this;
      }),
      json: jest.fn().mockImplementation(function (data) {
        this.jsonData = data;
        return this;
      })
    };
  });

  test('ApiResponse.send formats response with 4 required properties', () => {
    ApiResponse.send(mockRes, {
      statusCode: 200,
      success: true,
      message: 'Test message',
      data: { key: 'value' }
    });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.jsonData).toEqual({
      statusCode: 200,
      success: true,
      message: 'Test message',
      data: { key: 'value' }
    });
  });

  test('ApiResponse.success returns 200 OK by default', () => {
    ApiResponse.success(mockRes, {
      message: 'OK',
      data: [1, 2, 3]
    });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.jsonData).toEqual({
      statusCode: 200,
      success: true,
      message: 'OK',
      data: [1, 2, 3]
    });
  });

  test('ApiResponse.created returns 201 Created', () => {
    ApiResponse.created(mockRes, {
      message: 'Created',
      data: { id: 1 }
    });

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.jsonData).toEqual({
      statusCode: 201,
      success: true,
      message: 'Created',
      data: { id: 1 }
    });
  });

  test('ApiResponse.badRequest returns 400 with success=false', () => {
    ApiResponse.badRequest(mockRes, {
      message: 'Invalid input',
      data: { code: 'INVALID_INPUT' }
    });

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.jsonData).toEqual({
      statusCode: 400,
      success: false,
      message: 'Invalid input',
      data: { code: 'INVALID_INPUT' }
    });
  });

  test('ApiResponse.unauthorized returns 401 with success=false', () => {
    ApiResponse.unauthorized(mockRes, {
      message: 'Unauthorized',
      data: { code: 'AUTH_TOKEN_MISSING' }
    });

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.jsonData).toEqual({
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
      data: { code: 'AUTH_TOKEN_MISSING' }
    });
  });

  test('ApiResponse.forbidden returns 403 with success=false', () => {
    ApiResponse.forbidden(mockRes, {
      message: 'Forbidden',
      data: { code: 'AUTH_INSUFFICIENT_PERMISSIONS' }
    });

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.jsonData).toEqual({
      statusCode: 403,
      success: false,
      message: 'Forbidden',
      data: { code: 'AUTH_INSUFFICIENT_PERMISSIONS' }
    });
  });

  test('ApiResponse.notFound returns 404 with success=false', () => {
    ApiResponse.notFound(mockRes, {
      message: 'Not found',
      data: { code: 'NOT_FOUND' }
    });

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.jsonData).toEqual({
      statusCode: 404,
      success: false,
      message: 'Not found',
      data: { code: 'NOT_FOUND' }
    });
  });

  test('ApiResponse.conflict returns 409 with success=false', () => {
    ApiResponse.conflict(mockRes, {
      message: 'Conflict',
      data: { code: 'VALIDATION_DUPLICATE' }
    });

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.jsonData).toEqual({
      statusCode: 409,
      success: false,
      message: 'Conflict',
      data: { code: 'VALIDATION_DUPLICATE' }
    });
  });

  test('ApiResponse.validationError returns 422 with success=false', () => {
    ApiResponse.validationError(mockRes, {
      message: 'Validation failed',
      data: { code: 'VALIDATION_INVALID_INPUT', details: [] }
    });

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.jsonData).toEqual({
      statusCode: 422,
      success: false,
      message: 'Validation failed',
      data: { code: 'VALIDATION_INVALID_INPUT', details: [] }
    });
  });

  test('ApiResponse.tooManyRequests returns 429 with success=false', () => {
    ApiResponse.tooManyRequests(mockRes, {
      message: 'Rate limit exceeded',
      data: { code: 'RATE_LIMIT_EXCEEDED' }
    });

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.jsonData).toEqual({
      statusCode: 429,
      success: false,
      message: 'Rate limit exceeded',
      data: { code: 'RATE_LIMIT_EXCEEDED' }
    });
  });

  test('ApiResponse.internalError returns 500 with success=false', () => {
    ApiResponse.internalError(mockRes, {
      message: 'Internal error',
      data: { code: 'INTERNAL_ERROR' }
    });

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.jsonData).toEqual({
      statusCode: 500,
      success: false,
      message: 'Internal error',
      data: { code: 'INTERNAL_ERROR' }
    });
  });
});
