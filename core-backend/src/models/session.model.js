import { prisma } from '../config/database.js';

/**
 * Session Model (ESM)
 * Wrapper around Prisma Session model for additional business logic
 */
export default class Session {
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
