const documentTypeService = require('../services/documentTypeService');

/**
 * Document Type Controller
 * Handles document type management requests
 */

// Get all document types
const getAllDocumentTypes = async (req, res, next) => {
  try {
    const result = await documentTypeService.getAllDocumentTypes();
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Create document type
const createDocumentType = async (req, res, next) => {
  try {
    const documentTypeData = req.body;
    
    const result = await documentTypeService.createDocumentType(documentTypeData);
    
    res.status(201).json({
      success: true,
      message: 'Document type created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDocumentTypes,
  createDocumentType
};