import { prisma } from '../config/database.js';

/**
 * VerificationLog Model (ESM)
 * Wrapper around Prisma VerificationLog model for additional business logic
 */
export default class VerificationLog {
  static async findById(id) {
    return await prisma.verificationLog.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            referenceNumber: true,
            recipientName: true
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

  static async create(data) {
    return await prisma.verificationLog.create({
      data
    });
  }

  static async update(id, data) {
    return await prisma.verificationLog.update({
      where: { id },
      data
    });
  }
}
