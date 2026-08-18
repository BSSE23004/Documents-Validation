const documentService = require('../services/documentService');

/**
 * Document Controller
 * Handles document management requests
 */

// Create a new document
const createDocument = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const documentData = req.body;
    
    const result = await documentService.createDocument(documentData, userId);
    
    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get document by ID
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    const result = await documentService.getDocumentById(id, userId, userRole);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get all documents with pagination and filters
const getAllDocuments = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      documentTypeId: req.query.documentTypeId,
      issuerId: req.query.issuerId
    };
    
    const result = await documentService.getAllDocuments(filters, userId, userRole);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Update document
const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const updateData = req.body;
    
    const result = await documentService.updateDocument(id, updateData, userId, userRole);
    
    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Delete document
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    await documentService.deleteDocument(id, userId, userRole);
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDocument,
  getDocumentById,
  getAllDocuments,
  updateDocument,
  deleteDocument
};