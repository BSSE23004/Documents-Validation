import documentTypeService from '../services/document-type.service.js';
import ApiResponse from '../utils/api-response.js';

/**
 * Document Type Controller (ESM)
 * Handles document type management requests
 */

// Get all document types
export const getAllDocumentTypes = async (req, res, next) => {
  try {
    const result = await documentTypeService.getAllDocumentTypes();
    
    return ApiResponse.success(res, {
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Create document type
export const createDocumentType = async (req, res, next) => {
  try {
    const documentTypeData = req.body;
    
    const result = await documentTypeService.createDocumentType(documentTypeData);
    
    return ApiResponse.created(res, {
      message: 'Document type created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllDocumentTypes,
  createDocumentType
};
