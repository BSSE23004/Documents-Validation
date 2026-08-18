const issuerService = require('../services/issuerService');

/**
 * Issuer Controller
 * Handles issuer organization management requests
 */

// Get all issuers
const getAllIssuers = async (req, res, next) => {
  try {
    const result = await issuerService.getAllIssuers();
    
    res.status(200).json({
      success: true,
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
    
    res.status(201).json({
      success: true,
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