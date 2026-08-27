import 'dotenv/config';
import authService from '../../services/auth.service.js';
import { prisma, cleanTestDatabase } from '../helpers/db.helper.js';
import { USER_ROLES } from '../../config/constants.js';

describe('Auth Service - Live Supabase Database Tests', () => {
  const timestamp = Date.now();
  const testEmail = `livetest_auth_${timestamp}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Supabase Live Test User';
  let createdUserId;
  let sessionToken;
  let currentSessionId;
  let currentRefreshToken;

  beforeAll(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await prisma.$disconnect();
  });

  describe('Live User Registration', () => {
    it('should successfully register a new user and persist in Supabase users table', async () => {
      const result = await authService.register(
        testEmail,
        testPassword,
        testName,
        USER_ROLES.USER
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(testEmail);
      expect(result.user.name).toBe(testName);
      expect(result.user.role).toBe(USER_ROLES.USER);
      expect(result.user.isActive).toBe(true);

      createdUserId = result.user.id;

      // Direct verification via Supabase query
      const userInDb = await prisma.user.findUnique({
        where: { id: createdUserId }
      });

      expect(userInDb).not.toBeNull();
      expect(userInDb.email).toBe(testEmail);
      expect(userInDb.password).not.toBe(testPassword); // Must be bcrypt hashed
    });

    it('should throw error when trying to register with the same email (duplicate constraint)', async () => {
      await expect(
        authService.register(testEmail, 'AnotherPass123!', 'Duplicate User', USER_ROLES.USER)
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('Live User Login & Device Session Management', () => {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36';
    const ipAddress = '127.0.0.1';

    it('should authenticate user and create an active session record in Supabase', async () => {
      const loginResult = await authService.login(
        testEmail,
        testPassword,
        userAgent,
        ipAddress
      );

      expect(loginResult).toHaveProperty('token');
      expect(loginResult).toHaveProperty('refreshToken');
      expect(loginResult).toHaveProperty('user');
      expect(loginResult.user.id).toBe(createdUserId);

      sessionToken = loginResult.token;
      currentSessionId = loginResult.sessionId;
      currentRefreshToken = loginResult.refreshToken;

      // Verify session record in Supabase sessions table
      const sessionsInDb = await prisma.session.findMany({
        where: { userId: createdUserId }
      });

      expect(sessionsInDb.length).toBe(1);
      expect(sessionsInDb[0].token).toBe(sessionToken);
      expect(sessionsInDb[0].ipAddress).toBe(ipAddress);
    });

    it('should validate an active session against Supabase', async () => {
      const validation = await authService.validateSession(sessionToken);

      expect(validation).toHaveProperty('user');
      expect(validation.user.id).toBe(createdUserId);
      expect(validation.user.email).toBe(testEmail);
      expect(validation.sessionId).toBe(currentSessionId);
    });

    it('should refresh token using live Supabase token rotation', async () => {
      const refreshResult = await authService.refreshToken(currentRefreshToken);

      expect(refreshResult).toHaveProperty('token');
      expect(refreshResult).toHaveProperty('refreshToken');
      expect(refreshResult.token).not.toBe(sessionToken);

      // Verify updated token in Supabase
      const sessionInDb = await prisma.session.findUnique({
        where: { id: currentSessionId }
      });

      expect(sessionInDb.token).toBe(refreshResult.token);
      expect(sessionInDb.refreshToken).toBe(refreshResult.refreshToken);

      sessionToken = refreshResult.token;
      currentRefreshToken = refreshResult.refreshToken;
    });

    it('should handle session replacement on re-login from the same device', async () => {
      const secondLogin = await authService.login(
        testEmail,
        testPassword,
        userAgent,
        ipAddress
      );

      expect(secondLogin.token).toBeDefined();

      // Ensure only 1 active session exists for this device in Supabase
      const sessionsInDb = await prisma.session.findMany({
        where: { userId: createdUserId }
      });

      expect(sessionsInDb.length).toBe(1);
      expect(sessionsInDb[0].token).toBe(secondLogin.token);

      sessionToken = secondLogin.token;
      currentSessionId = secondLogin.sessionId;
    });

    it('should successfully logout and delete session from Supabase', async () => {
      await authService.logout(createdUserId, currentSessionId);

      // Verify session was removed from Supabase
      const sessionAfterLogout = await prisma.session.findUnique({
        where: { id: currentSessionId }
      });

      expect(sessionAfterLogout).toBeNull();
    });
  });
});
