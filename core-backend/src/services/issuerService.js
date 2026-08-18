const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { ERROR_CODES } = require('../config/constants');

const prisma = new PrismaClient();

/**
 * Issuer Service
 * Handles issuer organization management business logic
 */

// Get all issuers
const getAllIssuers = async () => {
  const issuers = await prisma.issuer.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      logoUrl: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { name: 'asc' }
  });

  return { issuers };
};

// Create issuer
const createIssuer = async (issuerData) => {
  // Check if issuer email already exists
  const existingIssuer = await prisma.issuer.findUnique({
    where: { email: issuerData.email }
  });

  if (existingIssuer) {
    const error = new Error('Issuer with this email already exists');
    error.code = ERROR_CODES.VALIDATION_DUPLICATE;
    throw error;
  }

  // Generate API key
  const apiKey = uuidv4();

  const issuer = await prisma.issuer.create({
    data: {
      ...issuerData,
      apiKey
    },
    select: {
      id: true,
      name: true,
      email: true,
      apiKey: true,
      isActive: true,
      createdAt: true
    }
  });

  return { issuer };
};

module.exports = {
  getAllIssuers,
  createIssuer
};