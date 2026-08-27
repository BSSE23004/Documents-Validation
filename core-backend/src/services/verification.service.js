import { prisma } from '../config/database.js';
import { ERROR_CODES, VERIFICATION_STATUS, DOCUMENT_STATUS, USER_ROLES } from '../config/constants.js';

/**
 * Verification Service (ESM)
 * Handles digital asset verification and audit logging business logic
 * Compliant with Technical Specification Section 4.5
 */

/**
 * Helper function to format document payload for verification responses
 */
export const formatDocumentForVerification = (document) => {
  let safeMetadata = null;
  if (document.metadata) {
    try {
      safeMetadata = typeof document.metadata === 'string'
        ? JSON.parse(document.metadata)
        : document.metadata;
    } catch (e) {
      safeMetadata = document.metadata;
    }
  }

  return {
    documentType: document.documentType ? document.documentType.name : 'Unknown',
    title: document.title,
    issuer: {
      name: document.issuer ? document.issuer.name : 'Unknown',
      logoUrl: document.issuer ? document.issuer.logoUrl : null
    },
    recipient: {
      name: document.recipientName,
      email: document.recipientEmail
    },
    issuanceDate: document.issuanceDate,
    referenceNumber: document.referenceNumber,
    status: document.status,
    metadata: safeMetadata
  };
};

/**
 * Verify digital asset by QR Code identifier
 * @param {string} qrCodeId - Unique cryptographic QR code ID
 * @param {string} [userAgent] - Client User Agent
 * @param {string} [ipAddress] - Client IP Address
 * @returns {Promise<Object>} Verification result payload
 */
export const verifyByQRCode = async (qrCodeId, userAgent, ipAddress) => {
  // Find document by QR code ID
  const document = await prisma.document.findUnique({
    where: { qrCodeId },
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

  if (!document) {
    return {
      success: false,
      verificationStatus: VERIFICATION_STATUS.INVALID,
      message: 'QR code not found or invalid',
      errorCode: 'QR_NOT_FOUND'
    };
  }

  // 1. Check if document has been revoked
  if (document.status === DOCUMENT_STATUS.REVOKED) {
    await prisma.verificationLog.create({
      data: {
        documentId: document.id,
        qrCodeId,
        verificationStatus: VERIFICATION_STATUS.REVOKED,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        errorMessage: 'Document has been revoked'
      }
    });

    return {
      success: false,
      verificationStatus: VERIFICATION_STATUS.REVOKED,
      message: 'Document has been revoked by issuer',
      data: {
        document: formatDocumentForVerification(document),
        revokedAt: document.updatedAt
      }
    };
  }

  // 2. Check if document has expired
  const isExpiredByDate = document.expiryDate && new Date(document.expiryDate) < new Date();
  const isExpiredByStatus = document.status === DOCUMENT_STATUS.EXPIRED;

  if (isExpiredByDate || isExpiredByStatus) {
    await prisma.verificationLog.create({
      data: {
        documentId: document.id,
        qrCodeId,
        verificationStatus: VERIFICATION_STATUS.EXPIRED,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        errorMessage: 'Document has expired'
      }
    });

    return {
      success: false,
      verificationStatus: VERIFICATION_STATUS.EXPIRED,
      message: 'Document has expired',
      data: {
        document: formatDocumentForVerification(document),
        expiredAt: document.expiryDate || document.updatedAt
      }
    };
  }

  // 3. Document is active and valid - log successful verification
  await prisma.verificationLog.create({
    data: {
      documentId: document.id,
      qrCodeId,
      verificationStatus: VERIFICATION_STATUS.VALID,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    }
  });

  return {
    success: true,
    verificationStatus: VERIFICATION_STATUS.VALID,
    data: {
      document: formatDocumentForVerification(document),
      verifiedAt: new Date().toISOString()
    }
  };
};

/**
 * Verify digital asset by Reference Number
 * @param {string} referenceNumber - Business reference number
 * @param {string} [userAgent] - Client User Agent
 * @param {string} [ipAddress] - Client IP Address
 * @returns {Promise<Object>} Verification result payload
 */
export const verifyByReference = async (referenceNumber, userAgent, ipAddress) => {
  const document = await prisma.document.findUnique({
    where: { referenceNumber },
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

  if (!document) {
    return {
      success: false,
      verificationStatus: VERIFICATION_STATUS.INVALID,
      message: 'Reference number not found',
      errorCode: 'DOCUMENT_NOT_FOUND'
    };
  }

  // Use the verified document's qrCodeId to execute standard verification
  return verifyByQRCode(document.qrCodeId, userAgent, ipAddress);
};

/**
 * Get Verification Audit Logs with filters and pagination
 * @param {Object} filters - Query parameters
 * @param {string} userRole - Requesting user role
 * @returns {Promise<Object>} Paginated verification logs
 */
export const getVerificationLogs = async (filters, userRole) => {
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {};

  if (filters.documentId) {
    where.documentId = filters.documentId;
  }

  if (filters.qrCodeId) {
    where.qrCodeId = filters.qrCodeId;
  }

  if (filters.status) {
    where.verificationStatus = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
    if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.verificationLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            referenceNumber: true,
            recipientName: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.verificationLog.count({ where })
  ]);

  return {
    logs: logs.map(log => ({
      id: log.id,
      documentId: log.documentId,
      qrCodeId: log.qrCodeId,
      verificationStatus: log.verificationStatus,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      errorMessage: log.errorMessage,
      timestamp: log.timestamp,
      document: log.document
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
 * Get a single verification log by ID
 * @param {string} id - Verification log UUID
 * @returns {Promise<Object>} Single verification log record
 */
export const getVerificationLogById = async (id) => {
  const log = await prisma.verificationLog.findUnique({
    where: { id },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          referenceNumber: true,
          recipientName: true,
          recipientEmail: true,
          status: true
        }
      }
    }
  });

  if (!log) {
    const error = new Error('Verification log record not found');
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  return { log };
};

/**
 * Update a verification log record (e.g. annotations / error notes)
 * @param {string} id - Verification log UUID
 * @param {Object} updateData - Update fields
 * @returns {Promise<Object>} Updated verification log record
 */
export const updateVerificationLog = async (id, updateData) => {
  const log = await prisma.verificationLog.findUnique({
    where: { id }
  });

  if (!log) {
    const error = new Error('Verification log record not found');
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  const updatedLog = await prisma.verificationLog.update({
    where: { id },
    data: {
      errorMessage: updateData.errorMessage !== undefined ? updateData.errorMessage : log.errorMessage
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          referenceNumber: true
        }
      }
    }
  });

  return { log: updatedLog };
};

export default {
  verifyByQRCode,
  verifyByReference,
  getVerificationLogs,
  getVerificationLogById,
  updateVerificationLog,
  formatDocumentForVerification
};
