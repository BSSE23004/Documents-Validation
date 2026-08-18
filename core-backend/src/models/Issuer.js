/**
 * Issuer Model
 * Wrapper around Prisma Issuer model for additional business logic
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class Issuer {
  static async findById(id) {
    return await prisma.issuer.findUnique({
      where: { id }
    });
  }

  static async findByEmail(email) {
    return await prisma.issuer.findUnique({
      where: { email }
    });
  }

  static async findByApiKey(apiKey) {
    return await prisma.issuer.findUnique({
      where: { apiKey }
    });
  }
}

module.exports = Issuer;