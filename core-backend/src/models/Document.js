/**
 * Document Model
 * Wrapper around Prisma Document model for additional business logic
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class Document {
  static async findById(id) {
    return await prisma.document.findUnique({
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
  }

  static async findByQRCodeId(qrCodeId) {
    return await prisma.document.findUnique({
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
  }

  static async findByReferenceNumber(referenceNumber) {
    return await prisma.document.findUnique({
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
  }
}

module.exports = Document;