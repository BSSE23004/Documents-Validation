const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const app = require('../../app');
const { generateJWTToken } = require('../../services/authService');

const prisma = new PrismaClient();

describe('Endpoint Authorization Integration Tests', () => {
    let adminUser;
    let issuerUser;
    let verifierUser;
    let normalUser;

    let adminToken;
    let issuerToken;
    let verifierToken;
    let normalUserToken;

    beforeAll(async () => {
        const uniqueId = `${Date.now()}-${Math.random()}`;

        // Create test users

        adminUser = await prisma.user.create({
            data: {
                email: `admin-${uniqueId}@example.com`,
                password: 'test-password',
                name: 'Test Admin',
                role: 'admin',
                isActive: true,
            },
        });

        issuerUser = await prisma.user.create({
            data: {
                email: `issuer-${uniqueId}@example.com`,
                password: 'test-password',
                name: 'Test Issuer',
                role: 'issuer',
                isActive: true,
            },
        });

        verifierUser = await prisma.user.create({
            data: {
                email: `verifier-${uniqueId}@example.com`,
                password: 'test-password',
                name: 'Test Verifier',
                role: 'verifier',
                isActive: true,
            },
        });

        normalUser = await prisma.user.create({
            data: {
                email: `user-${uniqueId}@example.com`,
                password: 'test-password',
                name: 'Test User',
                role: 'user',
                isActive: true,
            },
        });

        // Generate JWT tokens

        adminToken = generateJWTToken({
            userId: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            sessionId: 'test-admin-session',
        });

        issuerToken = generateJWTToken({
            userId: issuerUser.id,
            email: issuerUser.email,
            role: issuerUser.role,
            sessionId: 'test-issuer-session',
        });

        verifierToken = generateJWTToken({
            userId: verifierUser.id,
            email: verifierUser.email,
            role: verifierUser.role,
            sessionId: 'test-verifier-session',
        });

        normalUserToken = generateJWTToken({
            userId: normalUser.id,
            email: normalUser.email,
            role: normalUser.role,
            sessionId: 'test-user-session',
        });

        /*
         * authenticate() calls validateSession()
         *
         * validateSession() verifies the JWT and then checks whether
         * the exact token exists in the database
         *
         * so create a matching session for every test user
         */

        // Admin session
        await prisma.session.create({
            data: {
                userId: adminUser.id,
                deviceId: `admin-device-${uniqueId}`,
                token: adminToken,
                refreshToken: `admin-refresh-${uniqueId}`,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        // Issuer session
        await prisma.session.create({
            data: {
                userId: issuerUser.id,
                deviceId: `issuer-device-${uniqueId}`,
                token: issuerToken,
                refreshToken: `issuer-refresh-${uniqueId}`,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        // Verifier session
        await prisma.session.create({
            data: {
                userId: verifierUser.id,
                deviceId: `verifier-device-${uniqueId}`,
                token: verifierToken,
                refreshToken: `verifier-refresh-${uniqueId}`,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        // Normal user session
        await prisma.session.create({
            data: {
                userId: normalUser.id,
                deviceId: `user-device-${uniqueId}`,
                token: normalUserToken,
                refreshToken: `user-refresh-${uniqueId}`,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
    });

    afterAll(async () => {
        const userIds = [
            adminUser.id,
            issuerUser.id,
            verifierUser.id,
            normalUser.id,
        ];

        // Delete test sessions
        await prisma.session.deleteMany({
            where: {
                userId: {
                    in: userIds,
                },
            },
        });

        // Delete test users
        await prisma.user.deleteMany({
            where: {
                id: {
                    in: userIds,
                },
            },
        });

        await prisma.$disconnect();
    });

    // AUTHENTICATION

    test('rejects a request without an access token', async () => {
        const response = await request(app)
            .post('/api/documents');

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    test('rejects a tampered access token', async () => {
        const parts = adminToken.split('.');

        const tamperedToken =
            `${parts[0]}.${parts[1]}.${parts[2]}tampered`;

        const response = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${tamperedToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('AUTH_TOKEN_INVALID');
    });

    // POST /api/documents
    // Required roles: admin, issuer

    test('POST /api/documents allows admin', async () => {
        const response = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('POST /api/documents allows issuer', async () => {
        const response = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${issuerToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('POST /api/documents rejects normal user', async () => {
        const response = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // 
    // PUT /api/documents/:id
    // Required roles: admin, issuer

    test('PUT /api/documents/:id allows admin', async () => {
        const response = await request(app)
            .put('/api/documents/test-document-id')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('PUT /api/documents/:id allows issuer', async () => {
        const response = await request(app)
            .put('/api/documents/test-document-id')
            .set('Authorization', `Bearer ${issuerToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('PUT /api/documents/:id rejects normal user', async () => {
        const response = await request(app)
            .put('/api/documents/test-document-id')
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // DELETE /api/documents/:id
    // Required role: admin

    test('DELETE /api/documents/:id allows admin', async () => {
        const response = await request(app)
            .delete('/api/documents/test-document-id')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('DELETE /api/documents/:id rejects issuer', async () => {
        const response = await request(app)
            .delete('/api/documents/test-document-id')
            .set('Authorization', `Bearer ${issuerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('DELETE /api/documents/:id rejects normal user', async () => {
        const response = await request(app)
            .delete('/api/documents/test-document-id')
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // POST /api/document-types
    // Required role: admin

    test('POST /api/document-types allows admin', async () => {
        const response = await request(app)
            .post('/api/document-types')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('POST /api/document-types rejects issuer', async () => {
        const response = await request(app)
            .post('/api/document-types')
            .set('Authorization', `Bearer ${issuerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('POST /api/document-types rejects normal user', async () => {
        const response = await request(app)
            .post('/api/document-types')
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // POST /api/issuers
    // Required role: admin

    test('POST /api/issuers allows admin', async () => {
        const response = await request(app)
            .post('/api/issuers')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('POST /api/issuers rejects issuer', async () => {
        const response = await request(app)
            .post('/api/issuers')
            .set('Authorization', `Bearer ${issuerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('POST /api/issuers rejects normal user', async () => {
        const response = await request(app)
            .post('/api/issuers')
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // GET /api/verify/logs
    // Required roles: admin, verifier

    test('GET /api/verify/logs allows admin', async () => {
        const response = await request(app)
            .get('/api/verify/logs')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('GET /api/verify/logs allows verifier', async () => {
        const response = await request(app)
            .get('/api/verify/logs')
            .set('Authorization', `Bearer ${verifierToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('GET /api/verify/logs rejects issuer', async () => {
        const response = await request(app)
            .get('/api/verify/logs')
            .set('Authorization', `Bearer ${issuerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('GET /api/verify/logs rejects normal user', async () => {
        const response = await request(app)
            .get('/api/verify/logs')
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });
});