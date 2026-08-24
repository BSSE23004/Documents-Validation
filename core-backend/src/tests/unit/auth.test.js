const { verifyJWTToken, generateJWTToken } = require('../../services/authService');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Database connection', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should connect to the test database', async () => {
    const users = await prisma.user.findMany();

    expect(Array.isArray(users)).toBe(true);
  });
});

describe("verifyJWTToken", () => {
    process.env.TEST_JWT_SECRET = 'test-secret';

    test("accepts a valid JWT and returns a decoded payload", () => {
        const payload = {
            userId: '123',
            email: 'test@example.com',
            role: 'user'
        }

        const token = generateJWTToken(payload, '1h');
        const decoded = verifyJWTToken(token);

        expect(decoded.userId).toBe(payload.userId);
        expect(decoded.email).toBe(payload.email);
        expect(decoded.role).toBe(payload.role);
    });

    test("rejects a malformed JWT", () => {
        const malformedToken = 'fake-jwt-token';

        expect(() => verifyJWTToken(malformedToken)).toThrow('Invalid token');
    });


    test("rejects a tampered JWT", () => {
        const payload = {
            userId: '123',
            email: 'test@example.com',
            role: 'user'
        }

        const token = generateJWTToken(payload, '1h');
        // Tamper with the token by changing a character
        const parts = token.split('.');
        const tamperedPayload = Buffer
            .from(JSON.stringify({
                ...payload,
                role: 'admin'
            }))
            .toString('base64url');
        const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

        expect(() => verifyJWTToken(tamperedToken)).toThrow('Invalid token');
    });


    test("rejects an exprired JWT", () => {
        const payload = {
            userId: '123',
            email: 'test@example.com',
            role: 'user'
        }
        const token = generateJWTToken(payload, '-1s');

        expect(() => verifyJWTToken(token)).toThrow('Token expired');

    });
});