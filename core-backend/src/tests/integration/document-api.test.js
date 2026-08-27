import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import authService from '../../services/auth.service.js';
import documentService from '../../services/document.service.js';
import verificationService from '../../services/verification.service.js';

describe('Document & Verification API Integration Tests', () => {
  const mockAdminUser = {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@devlogix.online',
    name: 'Admin User',
    role: 'admin'
  };

  const mockIssuerUser = {
    id: 'b0000000-0000-0000-0000-000000000002',
    email: 'issuer@devlogix.online',
    name: 'Issuer User',
    role: 'issuer'
  };

  const mockRegularUser = {
    id: 'c0000000-0000-0000-0000-000000000003',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/documents (Create Document)', () => {
    const validDocPayload = {
      documentTypeId: '11111111-1111-1111-1111-111111111111',
      issuerId: '22222222-2222-2222-2222-222222222222',
      recipientName: 'Jane Smith',
      recipientEmail: 'jane@example.com',
      title: 'Internship Offer Letter',
      description: 'Internship offer for Software Engineer position',
      referenceNumber: 'DL-2026-001',
      issuanceDate: '2026-08-18T10:00:00Z',
      expiryDate: '2026-12-31T23:59:59Z',
      metadata: {
        position: 'Software Engineer',
        department: 'Engineering'
      }
    };

    it('should create a document when called by issuer with valid payload (201 Created)', async () => {
      jest.spyOn(authService, 'validateSession').mockResolvedValue({
        user: mockIssuerUser,
        sessionId: 'sess-1'
      });

      jest.spyOn(documentService, 'createDocument').mockResolvedValue({
        document: {
          id: 'doc-uuid-1234',
          qrCodeId: 'qr-uuid-1234',
          title: 'Internship Offer Letter',
          referenceNumber: 'DL-2026-001',
          status: 'active',
          createdAt: '2026-08-18T10:00:00Z'
        },
        qrCodeUrl: 'https://api.devlogix.online/qr/qr-uuid-1234'
      });

      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send(validDocPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Document created successfully');
      expect(res.body.data.document.referenceNumber).toBe('DL-2026-001');
      expect(res.body.data.qrCodeUrl).toBe('https://api.devlogix.online/qr/qr-uuid-1234');
    });

    it('should fail with 422 if required fields are missing or invalid', async () => {
      jest.spyOn(authService, 'validateSession').mockResolvedValue({
        user: mockIssuerUser,
        sessionId: 'sess-1'
      });

      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({
          title: 'Missing other fields'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.data.code).toBe('VALIDATION_INVALID_INPUT');
      expect(res.body.data.details).toBeInstanceOf(Array);
    });

    it('should fail with 403 Forbidden when called by regular user role', async () => {
      jest.spyOn(authService, 'validateSession').mockResolvedValue({
        user: mockRegularUser,
        sessionId: 'sess-2'
      });

      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', 'Bearer user-jwt-token')
        .send(validDocPayload);

      expect(res.status).toBe(403);
      expect(res.body.data.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should return document details for valid UUID', async () => {
      jest.spyOn(authService, 'validateSession').mockResolvedValue({
        user: mockAdminUser,
        sessionId: 'sess-1'
      });

      jest.spyOn(documentService, 'getDocumentById').mockResolvedValue({
        document: {
          id: '11111111-1111-1111-1111-111111111111',
          qrCodeId: 'qr-123',
          title: 'Offer Letter',
          referenceNumber: 'DL-001'
        }
      });

      const res = await request(app)
        .get('/api/documents/11111111-1111-1111-1111-111111111111')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.document.id).toBe('11111111-1111-1111-1111-111111111111');
    });

    it('should return 422 if id is not a valid UUID', async () => {
      jest.spyOn(authService, 'validateSession').mockResolvedValue({
        user: mockAdminUser,
        sessionId: 'sess-1'
      });

      const res = await request(app)
        .get('/api/documents/invalid-uuid-string')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(422);
      expect(res.body.data.code).toBe('VALIDATION_INVALID_INPUT');
    });
  });

  describe('GET /api/documents (Paginated)', () => {
    it('should return paginated list of documents', async () => {
      jest.spyOn(authService, 'validateSession').mockResolvedValue({
        user: mockAdminUser,
        sessionId: 'sess-1'
      });

      jest.spyOn(documentService, 'getAllDocuments').mockResolvedValue({
        documents: [{ id: 'doc-1', title: 'Doc 1' }],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 20 }
      });

      const res = await request(app)
        .get('/api/documents?page=1&limit=20')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.documents).toHaveLength(1);
      expect(res.body.data.pagination.currentPage).toBe(1);
    });
  });

  describe('PUT /api/documents/:id', () => {
    it('should update document successfully (200 OK)', async () => {
      jest.spyOn(authService, 'validateSession').mockResolvedValue({
        user: mockAdminUser,
        sessionId: 'sess-1'
      });

      jest.spyOn(documentService, 'updateDocument').mockResolvedValue({
        document: { id: '11111111-1111-1111-1111-111111111111', status: 'revoked' }
      });

      const res = await request(app)
        .put('/api/documents/11111111-1111-1111-1111-111111111111')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({ status: 'revoked', description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Document updated successfully');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should delete document when requested by admin (200 OK)', async () => {
      jest.spyOn(authService, 'validateSession').mockResolvedValue({
        user: mockAdminUser,
        sessionId: 'sess-1'
      });

      jest.spyOn(documentService, 'deleteDocument').mockResolvedValue();

      const res = await request(app)
        .delete('/api/documents/11111111-1111-1111-1111-111111111111')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Document deleted successfully');
    });
  });

  describe('POST /api/verify/qr-code (Public Verification)', () => {
    it('should verify document by QR code without requiring authorization header', async () => {
      jest.spyOn(verificationService, 'verifyByQRCode').mockResolvedValue({
        success: true,
        verificationStatus: 'valid',
        data: {
          document: {
            documentType: 'Internship Offer Letter',
            title: 'Software Engineer Internship',
            referenceNumber: 'DL-2026-001',
            status: 'active'
          },
          verifiedAt: '2026-08-18T13:30:00Z'
        }
      });

      const res = await request(app)
        .post('/api/verify/qr-code')
        .send({ qrCodeId: 'cryptographic_qr_id' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('valid');
      expect(res.body.data.data.document.referenceNumber).toBe('DL-2026-001');
    });
  });

  describe('POST /api/verify/reference (Public Verification)', () => {
    it('should verify document by reference number', async () => {
      jest.spyOn(verificationService, 'verifyByReference').mockResolvedValue({
        success: true,
        verificationStatus: 'valid',
        data: {
          document: {
            referenceNumber: 'DL-2026-001',
            status: 'active'
          },
          verifiedAt: '2026-08-18T13:30:00Z'
        }
      });

      const res = await request(app)
        .post('/api/verify/reference')
        .send({ referenceNumber: 'DL-2026-001' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('valid');
    });
  });

  describe('GET /api/verify/logs', () => {
    it('should return verification audit logs for admin/verifier', async () => {
      jest.spyOn(authService, 'validateSession').mockResolvedValue({
        user: mockAdminUser,
        sessionId: 'sess-1'
      });

      jest.spyOn(verificationService, 'getVerificationLogs').mockResolvedValue({
        logs: [{ id: 'log-1', verificationStatus: 'valid' }],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 20 }
      });

      const res = await request(app)
        .get('/api/verify/logs')
        .set('Authorization', 'Bearer admin-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logs).toHaveLength(1);
    });
  });
});
