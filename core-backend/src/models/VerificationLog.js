/**
 * VerificationLog Model
 * Wrapper around Prisma VerificationLog model for additional business logic
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class VerificationLog {
  static async findById(id) {
    return await prisma.verificationLog.findUnique({
      where: { id },
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
  }

  static async findByDocumentId(documentId) {
    return await prisma.verificationLog.findMany({
      where: { documentId },
      orderBy: { timestamp: 'desc' }
    });
  }

  static async findByQRCodeId(qrCodeId) {
    return await prisma.verificationLog.findMany({
      where: { qrCodeId },
      orderBy: { timestamp: 'desc' }
    });
  }
}

module.exports = VerificationLog;