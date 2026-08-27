import { prisma } from '../config/database.js';

/**
 * Issuer Model (ESM)
 * Wrapper around Prisma Issuer model for additional business logic
 */
export default class Issuer {
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
