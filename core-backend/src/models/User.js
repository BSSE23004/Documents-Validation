/**
 * User Model
 * Wrapper around Prisma User model for additional business logic
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class User {
  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  static async findAll(filters = {}) {
    const { role, isActive } = filters;
    const where = {};
    
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = User;