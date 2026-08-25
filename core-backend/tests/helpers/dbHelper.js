require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const TEST_PREFIX = 'livetest_';

/**
 * Clean up all test-related records from Supabase database
 */
async function cleanTestDatabase() {
  try {
    // Delete verification logs related to test documents
    await prisma.verificationLog.deleteMany({
      where: {
        document: {
          referenceNumber: {
            startsWith: 'TEST-'
          }
        }
      }
    });

    // Delete test documents
    await prisma.document.deleteMany({
      where: {
        OR: [
          { referenceNumber: { startsWith: 'TEST-' } },
          { recipientEmail: { contains: 'livetest' } },
          { recipientEmail: { contains: 'test@' } }
        ]
      }
    });

    // Delete test sessions
    await prisma.session.deleteMany({
      where: {
        user: {
          email: {
            contains: 'livetest'
          }
        }
      }
    });

    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'livetest'
        }
      }
    });

    // Delete test issuers
    await prisma.issuer.deleteMany({
      where: {
        email: {
          contains: 'livetest'
        }
      }
    });

    // Delete test document types
    await prisma.documentType.deleteMany({
      where: {
        name: {
          startsWith: 'Test '
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning test database in Supabase:', error.message);
  }
}

/**
 * Seed initial test fixtures in Supabase
 */
async function seedTestEnvironment() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('TestPassword123!', salt);
  const timestamp = Date.now();

  // 1. Seed or fetch Document Type
  let docType = await prisma.documentType.findFirst({
    where: { name: 'Test Offer Letter' }
  });

  if (!docType) {
    docType = await prisma.documentType.create({
      data: {
        name: `Test Offer Letter`,
        description: 'Temporary document type for automated testing',
        isActive: true
      }
    });
  }

  // 2. Seed or fetch Issuer
  let issuer = await prisma.issuer.findFirst({
    where: { email: `livetest_issuer_${timestamp}@example.com` }
  });

  if (!issuer) {
    issuer = await prisma.issuer.create({
      data: {
        name: 'Live Test University / Org',
        email: `livetest_issuer_${timestamp}@example.com`,
        apiKey: `test-api-key-${uuidv4()}`,
        logoUrl: 'https://devlogix.online/test-logo.png',
        isActive: true
      }
    });
  }

  // 3. Seed Issuer User (Admin/Issuer role)
  const issuerUser = await prisma.user.create({
    data: {
      email: `livetest_admin_${timestamp}@example.com`,
      password: hashedPassword,
      name: 'Live Test Admin',
      role: 'admin',
      isActive: true
    }
  });

  // 4. Seed Regular User
  const regularUser = await prisma.user.create({
    data: {
      email: `livetest_user_${timestamp}@example.com`,
      password: hashedPassword,
      name: 'Live Test Regular User',
      role: 'user',
      isActive: true
    }
  });

  return {
    docType,
    issuer,
    issuerUser,
    regularUser,
    plainPassword: 'TestPassword123!'
  };
}

module.exports = {
  prisma,
  TEST_PREFIX,
  cleanTestDatabase,
  seedTestEnvironment
};
