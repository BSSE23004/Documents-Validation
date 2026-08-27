import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  refreshToken,
  generateJWTToken,
} from '../../services/auth.service.js';

const prisma = new PrismaClient();

describe('Refresh Token Integration Tests', () => {
  let testUser;
  let session;
  let originalRefreshToken;

  beforeEach(async () => {
    // Create a unique user for every test
    const uniqueId = Date.now() + Math.random();

    testUser = await prisma.user.create({
      data: {
        email: `refresh-test-${uniqueId}@example.com`,
        password: await bcrypt.hash('Password123!', 10),
        name: 'Refresh Test User',
        role: 'user',
        isActive: true,
      },
    });

    // Create a session with a valid refresh token
    originalRefreshToken = `refresh-token-${uniqueId}`;

    const accessToken = generateJWTToken({
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role,
      sessionId: 'temporary-session-id',
    });

    session = await prisma.session.create({
      data: {
        userId: testUser.id,
        deviceId: `test-device-${uniqueId}`,
        token: accessToken,
        refreshToken: originalRefreshToken,
        userAgent: 'Jest',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });
  });

  afterEach(async () => {
    // Delete sessions first because they reference the user
    await prisma.session.deleteMany({
      where: {
        userId: testUser.id,
      },
    });

    await prisma.user.delete({
      where: {
        id: testUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('valid refresh token issues new access and refresh tokens', async () => {
    const oldRefreshToken = originalRefreshToken;

    const result = await refreshToken(oldRefreshToken);

    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    expect(result.refreshToken).not.toBe(oldRefreshToken);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});
