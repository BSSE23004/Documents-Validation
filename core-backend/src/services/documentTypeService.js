const { PrismaClient } = require('@prisma/client');
const { ERROR_CODES } = require('../config/constants');

const prisma = new PrismaClient();

/**
 * Document Type Service
 * Handles document type management business logic
 */

// Get all document types
const getAllDocumentTypes = async () => {
  const documentTypes = await prisma.documentType.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { name: 'asc' }
  });

  return { documentTypes };
};

// Create document type
const createDocumentType = async (documentTypeData) => {
  // Check if document type name already exists
  const existingType = await prisma.documentType.findUnique({
    where: { name: documentTypeData.name }
  });

  if (existingType) {
    const error = new Error('Document type with this name already exists');
    error.code = ERROR_CODES.VALIDATION_DUPLICATE;
    throw error;
  }

  const documentType = await prisma.documentType.create({
    data: documentTypeData,
    select: {
      id: true,
      name: true,
      description: true,
      template: true,
      isActive: true,
      createdAt: true
    }
  });

  return { documentType };
};

module.exports = {
  getAllDocumentTypes,
  createDocumentType
};