const issuerService = require('../services/issuerService');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Issuer Controller
 * Handles issuer organization management requests
 */

// Get all issuers
const getAllIssuers = async (req, res, next) => {
  try {
    const result = await issuerService.getAllIssuers();
    
    return ApiResponse.success(res, {
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Create issuer
const createIssuer = async (req, res, next) => {
  try {
    const issuerData = req.body;
    
    const result = await issuerService.createIssuer(issuerData);
    
    return ApiResponse.created(res, {
      message: 'Issuer created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllIssuers,
  createIssuer
};