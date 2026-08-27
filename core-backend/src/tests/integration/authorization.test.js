import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app.js';
import { generateJWTToken } from '../../services/auth.service.js';

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
        // Clean sessions
        if (adminUser?.id) {
            await prisma.session.deleteMany({
                where: {
                    userId: {
                        in: [
                            adminUser.id,
                            issuerUser.id,
                            verifierUser.id,
                            normalUser.id,
                        ],
                    },
                },
            });
        }

        // Clean users
        if (adminUser?.id) {
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: [
                            adminUser.id,
                            issuerUser.id,
                            verifierUser.id,
                            normalUser.id,
                        ],
                    },
                },
            });
        }

        await prisma.$disconnect();
    });

    // POST /api/issuers
    test('POST /api/issuers allows admin', async () => {
        const response = await request(app)
            .post('/api/issuers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test Org Admin',
                email: `org-${Date.now()}@example.com`,
            });

        expect(response.status).toBe(201);
    });

    test('POST /api/issuers rejects issuer', async () => {
        const response = await request(app)
            .post('/api/issuers')
            .set('Authorization', `Bearer ${issuerToken}`)
            .send({
                name: 'Test Org Issuer',
                email: `org-issuer-${Date.now()}@example.com`,
            });

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('POST /api/issuers rejects verifier', async () => {
        const response = await request(app)
            .post('/api/issuers')
            .set('Authorization', `Bearer ${verifierToken}`)
            .send({
                name: 'Test Org Verifier',
                email: `org-verifier-${Date.now()}@example.com`,
            });

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('POST /api/issuers rejects normal user', async () => {
        const response = await request(app)
            .post('/api/issuers')
            .set('Authorization', `Bearer ${normalUserToken}`)
            .send({
                name: 'Test Org Normal',
                email: `org-user-${Date.now()}@example.com`,
            });

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // POST /api/document-types
    test('POST /api/document-types allows admin', async () => {
        const response = await request(app)
            .post('/api/document-types')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: `Degree-${Date.now()}`,
                description: 'University Degree Document',
            });

        expect(response.status).toBe(201);
    });

    test('POST /api/document-types rejects issuer', async () => {
        const response = await request(app)
            .post('/api/document-types')
            .set('Authorization', `Bearer ${issuerToken}`)
            .send({
                name: `Degree-Issuer-${Date.now()}`,
            });

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('POST /api/document-types rejects verifier', async () => {
        const response = await request(app)
            .post('/api/document-types')
            .set('Authorization', `Bearer ${verifierToken}`)
            .send({
                name: `Degree-Verifier-${Date.now()}`,
            });

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('POST /api/document-types rejects normal user', async () => {
        const response = await request(app)
            .post('/api/document-types')
            .set('Authorization', `Bearer ${normalUserToken}`)
            .send({
                name: `Degree-User-${Date.now()}`,
            });

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // POST /api/documents
    test('POST /api/documents rejects verifier', async () => {
        const response = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${verifierToken}`)
            .send({});

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('POST /api/documents rejects normal user', async () => {
        const response = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${normalUserToken}`)
            .send({});

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // PUT /api/documents/:id
    test('PUT /api/documents/:id rejects verifier', async () => {
        const response = await request(app)
            .put('/api/documents/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${verifierToken}`)
            .send({});

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('PUT /api/documents/:id rejects normal user', async () => {
        const response = await request(app)
            .put('/api/documents/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${normalUserToken}`)
            .send({});

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // DELETE /api/documents/:id
    test('DELETE /api/documents/:id allows admin', async () => {
        const response = await request(app)
            .delete('/api/documents/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
    });

    test('DELETE /api/documents/:id rejects issuer', async () => {
        const response = await request(app)
            .delete('/api/documents/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${issuerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('DELETE /api/documents/:id rejects verifier', async () => {
        const response = await request(app)
            .delete('/api/documents/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${verifierToken}`);

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('DELETE /api/documents/:id rejects normal user', async () => {
        const response = await request(app)
            .delete('/api/documents/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    // GET /api/verify/logs
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
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });

    test('GET /api/verify/logs rejects normal user', async () => {
        const response = await request(app)
            .get('/api/verify/logs')
            .set('Authorization', `Bearer ${normalUserToken}`);

        expect(response.status).toBe(403);
        expect(response.body.data.code).toBe(
            'AUTH_INSUFFICIENT_PERMISSIONS'
        );
    });
});