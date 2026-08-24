const { PrismaClient } = require('@prisma/client');
const { ERROR_CODES, USER_ROLES, DOCUMENT_STATUS } = require('../config/constants');
const {
  generateQRCodeId,
  generateQRCodeUrl,
  triggerQRCodeGenerationHook,
  triggerNotificationHook
} = require('./qrCodeService');

const prisma = new PrismaClient();

/**
 * Document Service
 * Handles Digital Asset & Document management business logic
 * Compliant with Technical Specification Section 4.4 & Section 6.1
 */

/**
 * Create / Upload a new digital asset (document)
 * @param {Object} documentData - Document creation attributes
 * @param {string} userId - ID of the authenticated user (creator)
 * @returns {Promise<Object>} Created document summary with QR verification URL
 */
const createDocument = async (documentData, userId) => {
  const {
    documentTypeId,
    issuerId,
    recipientName,
    recipientEmail,
    title,
    description,
    referenceNumber,
    issuanceDate,
    expiryDate,
    metadata
  } = documentData;

  // 1. Verify DocumentType exists and is active
  const documentType = await prisma.documentType.findUnique({
    where: { id: documentTypeId }
  });

  if (!documentType) {
    const error = new Error(`Document type with ID '${documentTypeId}' not found`);
    error.code = ERROR_CODES.VALIDATION_INVALID_INPUT;
    throw error;
  }

  // 2. Verify Issuer exists and is active
  const issuer = await prisma.issuer.findUnique({
    where: { id: issuerId }
  });

  if (!issuer) {
    const error = new Error(`Issuer with ID '${issuerId}' not found`);
    error.code = ERROR_CODES.VALIDATION_INVALID_INPUT;
    throw error;
  }

  if (!issuer.isActive) {
    const error = new Error(`Issuer '${issuer.name}' is currently inactive`);
    error.code = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS;
    throw error;
  }

  // 3. Check for referenceNumber uniqueness
  const existingDoc = await prisma.document.findUnique({
    where: { referenceNumber }
  });

  if (existingDoc) {
    const error = new Error(`Document with reference number '${referenceNumber}' already exists`);
    error.code = ERROR_CODES.VALIDATION_DUPLICATE;
    throw error;
  }

  // 4. Generate cryptographic QR code identifier & URL
  const qrCodeId = generateQRCodeId();
  const qrCodeUrl = generateQRCodeUrl(qrCodeId);

  // 5. Parse dates
  const parsedIssuanceDate = issuanceDate ? new Date(issuanceDate) : new Date();
  const parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;

  // 6. Create document in database
  const document = await prisma.document.create({
    data: {
      qrCodeId,
      documentTypeId,
      issuerId,
      createdById: userId,
      recipientName,
      recipientEmail: recipientEmail.toLowerCase(),
      title,
      description: description || null,
      referenceNumber,
      issuanceDate: parsedIssuanceDate,
      expiryDate: parsedExpiryDate,
      status: DOCUMENT_STATUS.ACTIVE,
      metadata: metadata || null
    },
    include: {
      documentType: true,
      issuer: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      }
    }
  });

  // 7. Trigger Backend Squad B Integration Hooks asynchronously (Sections 6.1.1 & 6.1.2)
  triggerQRCodeGenerationHook(document.id, document.qrCodeId).catch(() => {});
  triggerNotificationHook(document.recipientEmail, {
    id: document.id,
    title: document.title,
    referenceNumber: document.referenceNumber,
    qrCodeUrl
  }).catch(() => {});

  // 8. Return response formatted per Specification Section 4.4.1
  return {
    document: {
      id: document.id,
      qrCodeId: document.qrCodeId,
      title: document.title,
      referenceNumber: document.referenceNumber,
      status: document.status,
      createdAt: document.createdAt
    },
    qrCodeUrl
  };
};

/**
 * Get Document by ID
 * @param {string} id - Document UUID
 * @param {string} userId - Requesting user ID
 * @param {string} userRole - Requesting user role
 * @param {string} [userEmail] - Requesting user email
 * @returns {Promise<Object>} Full document details
 */
const getDocumentById = async (id, userId, userRole, userEmail) => {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      documentType: {
        select: {
          id: true,
          name: true,
          description: true
        }
      },
      issuer: {
        select: {
          id: true,
          name: true,
          email: true,
          logoUrl: true
        }
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      }
    }
  });

  if (!document) {
    const error = new Error('Document not found');
    error.code = ERROR_CODES.DOCUMENT_NOT_FOUND;
    throw error;
  }

  // Check RBAC permissions (Admin, Issuer, Verifier, or User's own document)
  const isElevatedRole = [USER_ROLES.ADMIN, USER_ROLES.ISSUER, USER_ROLES.VERIFIER].includes(userRole);
  const isOwner = document.createdById === userId;
  const isRecipient = userEmail && document.recipientEmail.toLowerCase() === userEmail.toLowerCase();

  if (!isElevatedRole && !isOwner && !isRecipient) {
    const error = new Error('Insufficient permissions to view this document');
    error.code = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS;
    throw error;
  }

  return {
    document: {
      id: document.id,
      qrCodeId: document.qrCodeId,
      documentType: {
        id: document.documentType.id,
        name: document.documentType.name
      },
      issuer: {
        id: document.issuer.id,
        name: document.issuer.name,
        logoUrl: document.issuer.logoUrl
      },
      recipientName: document.recipientName,
      recipientEmail: document.recipientEmail,
      title: document.title,
      description: document.description,
      referenceNumber: document.referenceNumber,
      issuanceDate: document.issuanceDate,
      expiryDate: document.expiryDate,
      status: document.status,
      metadata: document.metadata,
      createdAt: document.createdAt
    }
  };
};

/**
 * Get all documents with pagination, filters, and role-based scoping
 * @param {Object} filters - Query parameters (page, limit, status, documentTypeId, issuerId, recipientEmail, search)
 * @param {string} userId - Requesting user ID
 * @param {string} userRole - Requesting user role
 * @param {string} [userEmail] - Requesting user email
 * @returns {Promise<Object>} Paginated documents list
 */
const getAllDocuments = async (filters, userId, userRole, userEmail) => {
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {};

  // Role-based visibility scoping
  const isElevated = [USER_ROLES.ADMIN, USER_ROLES.ISSUER, USER_ROLES.VERIFIER].includes(userRole);
  if (!isElevated) {
    where.OR = [
      { createdById: userId },
      ...(userEmail ? [{ recipientEmail: userEmail.toLowerCase() }] : [])
    ];
  }

  // Filters
  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.documentTypeId) {
    where.documentTypeId = filters.documentTypeId;
  }

  if (filters.issuerId) {
    where.issuerId = filters.issuerId;
  }

  if (filters.recipientEmail) {
    where.recipientEmail = filters.recipientEmail.toLowerCase();
  }

  if (filters.search) {
    const searchTerm = filters.search.trim();
    where.OR = [
      ...(where.OR || []),
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { referenceNumber: { contains: searchTerm, mode: 'insensitive' } },
      { recipientName: { contains: searchTerm, mode: 'insensitive' } }
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      include: {
        documentType: {
          select: {
            id: true,
            name: true
          }
        },
        issuer: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        },
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
    documents: documents.map(doc => ({
      id: doc.id,
      qrCodeId: doc.qrCodeId,
      documentType: doc.documentType,
      issuer: doc.issuer,
      recipientName: doc.recipientName,
      recipientEmail: doc.recipientEmail,
      title: doc.title,
      description: doc.description,
      referenceNumber: doc.referenceNumber,
      issuanceDate: doc.issuanceDate,
      expiryDate: doc.expiryDate,
      status: doc.status,
      metadata: doc.metadata,
      createdAt: doc.createdAt
    })),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      totalItems: total,
      itemsPerPage: limit
    }
  };
};

/**
 * Update Document record
 * @param {string} id - Document UUID
 * @param {Object} updateData - Fields to update
 * @param {string} userId - Requesting user ID
 * @param {string} userRole - Requesting user role
 * @returns {Promise<Object>} Updated document object
 */
const updateDocument = async (id, updateData, userId, userRole) => {
  const document = await prisma.document.findUnique({
    where: { id }
  });

  if (!document) {
    const error = new Error('Document not found');
    error.code = ERROR_CODES.DOCUMENT_NOT_FOUND;
    throw error;
  }

  // Check RBAC permissions (Admin or Issuer who created/manages document)
  if (userRole !== USER_ROLES.ADMIN && document.createdById !== userId) {
    const error = new Error('Insufficient permissions to update this document');
    error.code = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS;
    throw error;
  }

  // Filter allowed fields for update
  const allowedFields = ['status', 'description', 'title', 'recipientName', 'recipientEmail', 'expiryDate', 'metadata'];
  const sanitizedData = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'expiryDate') {
        sanitizedData[field] = updateData[field] ? new Date(updateData[field]) : null;
      } else if (field === 'recipientEmail') {
        sanitizedData[field] = updateData[field].toLowerCase();
      } else {
        sanitizedData[field] = updateData[field];
      }
    }
  }

  const updatedDocument = await prisma.document.update({
    where: { id },
    data: sanitizedData,
    include: {
      documentType: {
        select: {
          id: true,
          name: true
        }
      },
      issuer: {
        select: {
          id: true,
          name: true,
          logoUrl: true
        }
      }
    }
  });

  return {
    document: updatedDocument
  };
};

/**
 * Delete Document record
 * @param {string} id - Document UUID
 * @param {string} userId - Requesting user ID
 * @param {string} userRole - Requesting user role
 */
const deleteDocument = async (id, userId, userRole) => {
  const document = await prisma.document.findUnique({
    where: { id }
  });

  if (!document) {
    const error = new Error('Document not found');
    error.code = ERROR_CODES.DOCUMENT_NOT_FOUND;
    throw error;
  }

  // Only admins can delete documents (Section 4.4.5 & 5.4.2)
  if (userRole !== USER_ROLES.ADMIN) {
    const error = new Error('Insufficient permissions to delete document');
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