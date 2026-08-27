import { prisma } from '../config/database.js';

/**
 * Document Model (ESM)
 * Wrapper around Prisma Document model for additional business logic
 */
export default class Document {
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
            name: true,
            role: true
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
            name: true,
            role: true
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
            name: true,
            role: true
          }
        }
      }
    });
  }

  static async create(data) {
    return await prisma.document.create({
      data,
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
  }

  static async update(id, data) {
    return await prisma.document.update({
      where: { id },
      data,
      include: {
        documentType: true,
        issuer: true
      }
    });
  }

  static async delete(id) {
    return await prisma.document.delete({
      where: { id }
    });
  }
}
