const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { ERROR_CODES, USER_ROLES } = require('../config/constants');

const prisma = new PrismaClient();

/**
 * Document Service
 * Handles document management business logic
 */

// Create a new document
const createDocument = async (documentData, userId) => {
  // Generate cryptographic QR code ID
  const qrCodeId = uuidv4();

  const document = await prisma.document.create({
    data: {
      ...documentData,
      qrCodeId,
      createdById: userId
    },
    include: {
      documentType: true,
      issuer: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  return {
    document: {
      id: document.id,
      qrCodeId: document.qrCodeId,
      title: document.title,
      referenceNumber: document.referenceNumber,
      status: document.status,
      createdAt: document.createdAt
    },
    qrCodeUrl: `/qr/${document.qrCodeId}`
  };
};

// Get document by ID
const getDocumentById = async (id, userId, userRole) => {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      documentType: true,
      issuer: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  if (!document) {
    const error = new Error('Document not found');
    error.code = ERROR_CODES.DOCUMENT_NOT_FOUND;
    throw error;
  }

  // Check access permissions
  if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.ISSUER && document.createdById !== userId) {
    const error = new Error('Insufficient permissions');
    error.code = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS;
    throw error;
  }

  return { document };
};

// Get all documents with pagination and filters
const getAllDocuments = async (filters, userId, userRole) => {
  const { page, limit, status, documentTypeId, issuerId } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  
  // Apply filters based on user role
  if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.ISSUER) {
    where.createdById = userId;
  }

  if (status) where.status = status;
  if (documentTypeId) where.documentTypeId = documentTypeId;
  if (issuerId) where.issuerId = issuerId;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      include: {
        documentType: true,
        issuer: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.document.count({ where })
  ]);

  return {
    documents,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
};

// Update document
const updateDocument = async (id, updateData, userId, userRole) => {
  const document = await prisma.document.findUnique({
    where: { id }
  });

  if (!document) {
    const error = new Error('Document not found');
    error.code = ERROR_CODES.DOCUMENT_NOT_FOUND;
    throw error;
  }

  // Check permissions
  if (userRole !== USER_ROLES.ADMIN && document.createdById !== userId) {
    const error = new Error('Insufficient permissions');
    error.code = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS;
    throw error;
  }

  const updatedDocument = await prisma.document.update({
    where: { id },
    data: updateData,
    include: {
      documentType: true,
      issuer: true
    }
  });

  return { document: updatedDocument };
};

// Delete document
const deleteDocument = async (id, userId, userRole) => {
  const document = await prisma.document.findUnique({
    where: { id }
  });

  if (!document) {
    const error = new Error('Document not found');
    error.code = ERROR_CODES.DOCUMENT_NOT_FOUND;
    throw error;
  }

  // Only admins can delete documents
  if (userRole !== USER_ROLES.ADMIN) {
    const error = new Error('Insufficient permissions');
    error.code = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS;
    throw error;
  }

  await prisma.document.delete({
    where: { id }
  });
};

module.exports = {
  createDocument,
  getDocumentById,
  getAllDocuments,
  updateDocument,
  deleteDocument
};