import documentService from '../services/document.service.js';
import ApiResponse from '../utils/api-response.js';

/**
 * Document Controller (ESM)
 * Handles digital asset & document management requests
 * Specification Section 4.4
 */

// POST /api/documents - Create a new digital asset (document)
export const createDocument = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const documentData = req.body;
    
    const result = await documentService.createDocument(documentData, userId);
    
    return ApiResponse.created(res, {
      message: 'Document created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/documents/:id - Get document by ID
export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    
    const result = await documentService.getDocumentById(id, userId, userRole, userEmail);
    
    return ApiResponse.success(res, {
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/documents - Get all documents with pagination, search, and filters
export const getAllDocuments = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      documentTypeId: req.query.documentTypeId,
      issuerId: req.query.issuerId,
      recipientEmail: req.query.recipientEmail,
      search: req.query.search
    };
    
    const result = await documentService.getAllDocuments(filters, userId, userRole, userEmail);
    
    return ApiResponse.success(res, {
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/documents/:id - Update document
export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const updateData = req.body;
    
    const result = await documentService.updateDocument(id, updateData, userId, userRole);
    
    return ApiResponse.success(res, {
      message: 'Document updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/documents/:id - Delete document
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    await documentService.deleteDocument(id, userId, userRole);
    
    return ApiResponse.success(res, {
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createDocument,
  getDocumentById,
  getAllDocuments,
  updateDocument,
  deleteDocument
};
