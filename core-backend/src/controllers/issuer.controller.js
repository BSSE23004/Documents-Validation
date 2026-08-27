import issuerService from '../services/issuer.service.js';
import ApiResponse from '../utils/api-response.js';

/**
 * Issuer Controller (ESM)
 * Handles issuer organization management requests
 */

// Get all issuers
export const getAllIssuers = async (req, res, next) => {
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
export const createIssuer = async (req, res, next) => {
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

export default {
  getAllIssuers,
  createIssuer
};
