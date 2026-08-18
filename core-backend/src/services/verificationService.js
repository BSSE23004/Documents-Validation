const { PrismaClient } = require('@prisma/client');
const { ERROR_CODES, VERIFICATION_STATUS, DOCUMENT_STATUS } = require('../config/constants');

const prisma = new PrismaClient();

/**
 * Verification Service
 * Handles document verification business logic
 */

// Verify document by QR code
const verifyByQRCode = async (qrCodeId, userAgent, ipAddress) => {
  // Find document by QR code ID
  const document = await prisma.document.findUnique({
    where: { qrCodeId },
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
    // Log failed verification
    await prisma.verificationLog.create({
      data: {
        documentId: 'unknown',
        qrCodeId,
        verificationStatus: VERIFICATION_STATUS.INVALID,
        ipAddress,
        userAgent,
        errorMessage: 'QR code not found'
      }
    });

    return {
      success: false,
      verificationStatus: VERIFICATION_STATUS.INVALID,
      message: 'QR code not found or invalid',
      errorCode: ERROR_CODES.DOCUMENT_QR_NOT_FOUND
    };
  }

  // Check document status
  if (document.status === DOCUMENT_STATUS.REVOKED) {
    await prisma.verificationLog.create({
      data: {
        documentId: document.id,
        qrCodeId,
        verificationStatus: VERIFICATION_STATUS.REVOKED,
        ipAddress,
        userAgent,
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

  // Check if document has expired
  if (document.expiryDate && new Date(document.expiryDate) < new Date()) {
    await prisma.verificationLog.create({
      data: {
        documentId: document.id,
        qrCodeId,
        verificationStatus: VERIFICATION_STATUS.EXPIRED,
        ipAddress,
        userAgent,
        errorMessage: 'Document has expired'
      }
    });

    return {
      success: false,
      verificationStatus: VERIFICATION_STATUS.EXPIRED,
      message: 'Document has expired',
      data: {
        document: formatDocumentForVerification(document),
        expiredAt: document.expiryDate
      }
    };
  }

  // Document is valid - log successful verification
  await prisma.verificationLog.create({
    data: {
      documentId: document.id,
      qrCodeId,
      verificationStatus: VERIFICATION_STATUS.VALID,
      ipAddress,
      userAgent
    }
  });

  return {
    success: true,
    verificationStatus: VERIFICATION_STATUS.VALID,
    data: {
      document: formatDocumentForVerification(document),
      verifiedAt: new Date()
    }
  };
};

// Verify document by reference number
const verifyByReference = async (referenceNumber, userAgent, ipAddress) => {
  // Find document by reference number
  const document = await prisma.document.findUnique({
    where: { referenceNumber },
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
    await prisma.verificationLog.create({
      data: {
        documentId: 'unknown',
        qrCodeId: 'unknown',
        verificationStatus: VERIFICATION_STATUS.INVALID,
        ipAddress,
        userAgent,
        errorMessage: 'Reference number not found'
      }
    });

    return {
      success: false,
      verificationStatus: VERIFICATION_STATUS.INVALID,
      message: 'Reference number not found',
      errorCode: ERROR_CODES.DOCUMENT_NOT_FOUND
    };
  }

  // Use the same verification logic as QR code
  return verifyByQRCode(document.qrCodeId, userAgent, ipAddress);
};

// Get verification logs
const getVerificationLogs = async (filters, userRole) => {
  const { documentId, qrCodeId, status, startDate, endDate, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where = {};

  if (documentId) where.documentId = documentId;
  if (qrCodeId) where.qrCodeId = qrCodeId;
  if (status) where.verificationStatus = status;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
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
            referenceNumber: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.verificationLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
};

// Helper function to format document for verification response
const formatDocumentForVerification = (document) => {
  return {
    documentType: document.documentType.name,
    title: document.title,
    issuer: {
      name: document.issuer.name,
      logoUrl: document.issuer.logoUrl
    },
    recipient: {
      name: document.recipientName,
      email: document.recipientEmail
    },
    issuanceDate: document.issuanceDate,
    referenceNumber: document.referenceNumber,
    status: document.status,
    // Include only safe metadata fields
    metadata: document.metadata ? {
      position: document.metadata.position,
      department: document.metadata.department
    } : null
  };
};

module.exports = {
  verifyByQRCode,
  verifyByReference,
  getVerificationLogs
};