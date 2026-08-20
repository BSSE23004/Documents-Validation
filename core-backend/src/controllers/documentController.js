const documentService = require('../services/documentService');

/**
 * Document Controller
 * Handles digital asset & document management requests
 * Specification Section 4.4
 */

// POST /api/documents - Create a new digital asset (document)
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

// GET /api/documents/:id - Get document by ID
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    
    const result = await documentService.getDocumentById(id, userId, userRole, userEmail);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/documents - Get all documents with pagination, search, and filters
const getAllDocuments = async (req, res, next) => {
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
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/documents/:id - Update document
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

// DELETE /api/documents/:id - Delete document
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