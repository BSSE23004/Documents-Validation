const documentService = require('../../src/services/documentService');
const { ERROR_CODES, USER_ROLES, DOCUMENT_STATUS } = require('../../src/config/constants');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mPrisma = {
    documentType: {
      findUnique: jest.fn(),
    },
    issuer: {
      findUnique: jest.fn(),
    },
    document: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    verificationLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

// Mock qrCodeService hooks
jest.mock('../../src/services/qrCodeService', () => ({
  generateQRCodeId: jest.fn(() => 'mock-qr-uuid-1234'),
  generateQRCodeUrl: jest.fn((id) => `https://api.devlogix.online/qr/${id}`),
  triggerQRCodeGenerationHook: jest.fn().mockResolvedValue({ success: true }),
  triggerNotificationHook: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Document Service Unit Tests', () => {
  let prisma;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('createDocument', () => {
    const validDocData = {
      documentTypeId: 'type-123',
      issuerId: 'issuer-123',
      recipientName: 'Jane Smith',
      recipientEmail: 'jane@example.com',
      title: 'Internship Offer Letter',
      description: 'Internship offer for Software Engineer position',
      referenceNumber: 'DL-2026-001',
      issuanceDate: '2026-08-18T10:00:00Z',
      expiryDate: '2026-12-31T23:59:59Z',
      metadata: { position: 'Software Engineer' }
    };

    it('should successfully create a document and return formatted response with QR code URL', async () => {
      prisma.documentType.findUnique.mockResolvedValue({ id: 'type-123', name: 'Internship Offer', isActive: true });
      prisma.issuer.findUnique.mockResolvedValue({ id: 'issuer-123', name: 'DevLogix', isActive: true });
      prisma.document.findUnique.mockResolvedValue(null); // Reference number uniqueness check

      const createdDocMock = {
        id: 'doc-123',
        qrCodeId: 'mock-qr-uuid-1234',
        title: 'Internship Offer Letter',
        referenceNumber: 'DL-2026-001',
        status: 'active',
        createdAt: new Date('2026-08-18T10:00:00Z'),
        recipientEmail: 'jane@example.com',
      };
      prisma.document.create.mockResolvedValue(createdDocMock);

      const result = await documentService.createDocument(validDocData, 'user-admin-id');

      expect(result.document.id).toBe('doc-123');
      expect(result.document.qrCodeId).toBe('mock-qr-uuid-1234');
      expect(result.document.referenceNumber).toBe('DL-2026-001');
      expect(result.qrCodeUrl).toBe('https://api.devlogix.online/qr/mock-qr-uuid-1234');
    });

    it('should throw error if document type does not exist', async () => {
      prisma.documentType.findUnique.mockResolvedValue(null);

      await expect(documentService.createDocument(validDocData, 'user-admin-id'))
        .rejects.toThrow(/Document type with ID/);
    });

    it('should throw error if issuer does not exist or is inactive', async () => {
      prisma.documentType.findUnique.mockResolvedValue({ id: 'type-123', name: 'Internship Offer' });
      prisma.issuer.findUnique.mockResolvedValue({ id: 'issuer-123', name: 'DevLogix', isActive: false });

      await expect(documentService.createDocument(validDocData, 'user-admin-id'))
        .rejects.toThrow(/is currently inactive/);
    });

    it('should throw conflict error if reference number already exists', async () => {
      prisma.documentType.findUnique.mockResolvedValue({ id: 'type-123', name: 'Internship Offer' });
      prisma.issuer.findUnique.mockResolvedValue({ id: 'issuer-123', name: 'DevLogix', isActive: true });
      prisma.document.findUnique.mockResolvedValue({ id: 'existing-doc', referenceNumber: 'DL-2026-001' });

      await expect(documentService.createDocument(validDocData, 'user-admin-id'))
        .rejects.toThrow(/already exists/);
    });
  });

  describe('getDocumentById', () => {
    const mockDocument = {
      id: 'doc-123',
      qrCodeId: 'qr-123',
      createdById: 'user-issuer-id',
      recipientEmail: 'jane@example.com',
      recipientName: 'Jane Smith',
      title: 'Internship Offer',
      description: 'Test Desc',
      referenceNumber: 'DL-2026-001',
      issuanceDate: new Date(),
      expiryDate: new Date('2026-12-31'),
      status: 'active',
      metadata: { position: 'Software Engineer' },
      createdAt: new Date(),
      documentType: { id: 'type-1', name: 'Internship Offer', description: 'desc' },
      issuer: { id: 'issuer-1', name: 'DevLogix', email: 'info@devlogix.online', logoUrl: 'logo.png' },
      createdBy: { id: 'user-issuer-id', email: 'issuer@devlogix.online', name: 'Issuer Admin', role: 'issuer' }
    };

    it('should return document for admin user', async () => {
      prisma.document.findUnique.mockResolvedValue(mockDocument);

      const result = await documentService.getDocumentById('doc-123', 'admin-id', USER_ROLES.ADMIN, 'admin@example.com');
      expect(result.document.id).toBe('doc-123');
      expect(result.document.issuer.name).toBe('DevLogix');
    });

    it('should return document for recipient user matching email', async () => {
      prisma.document.findUnique.mockResolvedValue(mockDocument);

      const result = await documentService.getDocumentById('doc-123', 'user-jane-id', USER_ROLES.USER, 'jane@example.com');
      expect(result.document.id).toBe('doc-123');
    });

    it('should throw 403 for unauthorized regular user who is neither creator nor recipient', async () => {
      prisma.document.findUnique.mockResolvedValue(mockDocument);

      await expect(documentService.getDocumentById('doc-123', 'other-user-id', USER_ROLES.USER, 'other@example.com'))
        .rejects.toThrow(/Insufficient permissions/);
    });

    it('should throw 404 if document is not found', async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      await expect(documentService.getDocumentById('non-existent', 'admin-id', USER_ROLES.ADMIN))
        .rejects.toThrow(/Document not found/);
    });
  });

  describe('getAllDocuments', () => {
    it('should return paginated documents with metadata', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          qrCodeId: 'qr-1',
          documentType: { id: 'type-1', name: 'Offer' },
          issuer: { id: 'iss-1', name: 'DevLogix', logoUrl: null },
          recipientName: 'Jane',
          recipientEmail: 'jane@example.com',
          title: 'Offer 1',
          description: null,
          referenceNumber: 'DL-001',
          issuanceDate: new Date(),
          expiryDate: null,
          status: 'active',
          metadata: null,
          createdAt: new Date()
        }
      ];

      prisma.document.findMany.mockResolvedValue(mockDocs);
      prisma.document.count.mockResolvedValue(1);

      const result = await documentService.getAllDocuments({ page: 1, limit: 10 }, 'admin-id', USER_ROLES.ADMIN);

      expect(result.documents).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.currentPage).toBe(1);
    });
  });

  describe('updateDocument', () => {
    it('should update document and return updated object', async () => {
      prisma.document.findUnique.mockResolvedValue({ id: 'doc-1', createdById: 'issuer-id' });
      prisma.document.update.mockResolvedValue({
        id: 'doc-1',
        status: DOCUMENT_STATUS.REVOKED,
        description: 'Revoked reason',
        documentType: { id: 'type-1', name: 'Offer' },
        issuer: { id: 'iss-1', name: 'DevLogix', logoUrl: null }
      });

      const result = await documentService.updateDocument('doc-1', { status: 'revoked', description: 'Revoked reason' }, 'issuer-id', USER_ROLES.ISSUER);

      expect(result.document.status).toBe(DOCUMENT_STATUS.REVOKED);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document if user is admin', async () => {
      prisma.document.findUnique.mockResolvedValue({ id: 'doc-1' });
      prisma.document.delete.mockResolvedValue({ id: 'doc-1' });

      await expect(documentService.deleteDocument('doc-1', 'admin-id', USER_ROLES.ADMIN)).resolves.not.toThrow();
    });

    it('should reject delete if user is not admin', async () => {
      prisma.document.findUnique.mockResolvedValue({ id: 'doc-1' });

      await expect(documentService.deleteDocument('doc-1', 'user-id', USER_ROLES.USER))
        .rejects.toThrow(/Insufficient permissions/);
    });
  });
});
