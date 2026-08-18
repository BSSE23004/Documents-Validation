/**
 * Session Model
 * Wrapper around Prisma Session model for additional business logic
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class Session {
  static async findById(id) {
    return await prisma.session.findUnique({
      where: { id },
      include: {
        user: {
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

  static async findByToken(token) {
    return await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
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

  static async findByUserId(userId) {
    return await prisma.session.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' }
    });
  }
}

module.exports = Session;