require('dotenv').config();
const documentService = require('../../src/services/documentService');
const { prisma, cleanTestDatabase, seedTestEnvironment } = require('../helpers/dbHelper');
const { DOCUMENT_STATUS, USER_ROLES } = require('../../src/config/constants');

describe('Document Service - Live Supabase Database Tests', () => {
  let seeded;
  let createdDocId;
  let testRefNumber;
  let testQrCodeId;

  beforeAll(async () => {
    await cleanTestDatabase();
    seeded = await seedTestEnvironment();
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await prisma.$disconnect();
  });

  describe('Live Document Creation', () => {
    it('should create a new document in Supabase with QR Code ID and relations', async () => {
      const timestamp = Date.now();
      testRefNumber = `TEST-DOC-${timestamp}`;

      const payload = {
        documentTypeId: seeded.docType.id,
        issuerId: seeded.issuer.id,
        recipientName: 'Alice Johnson',
        recipientEmail: `livetest_alice_${timestamp}@example.com`,
        title: 'Senior Software Engineer Offer',
        description: 'Offer letter generated during automated Supabase integration test',
        referenceNumber: testRefNumber,
        issuanceDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          position: 'Senior Engineer',
          salary: '120k',
          department: 'Core Tech'
        }
      };

      const result = await documentService.createDocument(payload, seeded.issuerUser.id);

      expect(result).toHaveProperty('document');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result.document).toHaveProperty('id');
      expect(result.document).toHaveProperty('qrCodeId');
      expect(result.document.title).toBe(payload.title);
      expect(result.document.referenceNumber).toBe(testRefNumber);

      createdDocId = result.document.id;
      testQrCodeId = result.document.qrCodeId;

      // Verify directly in Supabase PostgreSQL
      const docInDb = await prisma.document.findUnique({
        where: { id: createdDocId },
        include: {
          documentType: true,
          issuer: true,
          createdBy: true
        }
      });

      expect(docInDb).not.toBeNull();
      expect(docInDb.referenceNumber).toBe(testRefNumber);
      expect(docInDb.qrCodeId).toBe(testQrCodeId);
      expect(docInDb.status).toBe(DOCUMENT_STATUS.ACTIVE);
      expect(docInDb.issuer.id).toBe(seeded.issuer.id);
      expect(docInDb.documentType.id).toBe(seeded.docType.id);
      expect(docInDb.createdBy.id).toBe(seeded.issuerUser.id);
    });

    it('should enforce unique referenceNumber constraint in Supabase', async () => {
      const duplicatePayload = {
        documentTypeId: seeded.docType.id,
        issuerId: seeded.issuer.id,
        recipientName: 'Duplicate Test',
        recipientEmail: 'livetest_dup@example.com',
        title: 'Duplicate Title',
        referenceNumber: testRefNumber
      };

      await expect(
        documentService.createDocument(duplicatePayload, seeded.issuerUser.id)
      ).rejects.toThrow();
    });
  });

  describe('Live Document Retrieval & Filtering', () => {
    it('should retrieve document by ID directly from Supabase with relations', async () => {
      const response = await documentService.getDocumentById(
        createdDocId,
        seeded.issuerUser.id,
        USER_ROLES.ADMIN,
        seeded.issuerUser.email
      );

      expect(response).toHaveProperty('document');
      expect(response.document.id).toBe(createdDocId);
      expect(response.document.qrCodeId).toBe(testQrCodeId);
      expect(response.document.documentType.name).toBe(seeded.docType.name);
      expect(response.document.issuer.name).toBe(seeded.issuer.name);
    });

    it('should query paginated documents list with search filter from Supabase', async () => {
      const listResult = await documentService.getAllDocuments(
        {
          search: 'Senior Software Engineer',
          page: 1,
          limit: 10
        },
        seeded.issuerUser.id,
        USER_ROLES.ADMIN,
        seeded.issuerUser.email
      );

      expect(listResult).toHaveProperty('documents');
      expect(listResult).toHaveProperty('pagination');
      expect(listResult.documents.length).toBeGreaterThanOrEqual(1);

      const found = listResult.documents.find(d => d.id === createdDocId);
      expect(found).toBeDefined();
    });
  });

  describe('Live Document Updates & Lifecycle', () => {
    it('should update document details in Supabase', async () => {
      const updateData = {
        title: 'Updated Senior Software Engineer Offer',
        description: 'Updated description in Supabase live test',
        status: DOCUMENT_STATUS.REVOKED
      };

      const updateResponse = await documentService.updateDocument(
        createdDocId,
        updateData,
        seeded.issuerUser.id,
        USER_ROLES.ADMIN
      );

      expect(updateResponse.document.title).toBe(updateData.title);
      expect(updateResponse.document.status).toBe(DOCUMENT_STATUS.REVOKED);

      // Verify directly in Supabase
      const docInDb = await prisma.document.findUnique({
        where: { id: createdDocId }
      });

      expect(docInDb.title).toBe(updateData.title);
      expect(docInDb.status).toBe(DOCUMENT_STATUS.REVOKED);
    });

    it('should delete a document from Supabase', async () => {
      await documentService.deleteDocument(
        createdDocId,
        seeded.issuerUser.id,
        USER_ROLES.ADMIN
      );

      // Verify record is deleted from Supabase
      const docAfterDelete = await prisma.document.findUnique({
        where: { id: createdDocId }
      });

      expect(docAfterDelete).toBeNull();
    });
  });
});
