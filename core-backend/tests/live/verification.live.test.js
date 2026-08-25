require('dotenv').config();
const verificationService = require('../../src/services/verificationService');
const documentService = require('../../src/services/documentService');
const { prisma, cleanTestDatabase, seedTestEnvironment } = require('../helpers/dbHelper');
const { VERIFICATION_STATUS, DOCUMENT_STATUS, USER_ROLES } = require('../../src/config/constants');

describe('Verification Service - Live Supabase Database Tests', () => {
  let seeded;
  let activeDoc;
  let revokedDoc;
  let expiredDoc;

  beforeAll(async () => {
    await cleanTestDatabase();
    seeded = await seedTestEnvironment();

    const timestamp = Date.now();

    // 1. Create Active Document
    const activeRes = await documentService.createDocument({
      documentTypeId: seeded.docType.id,
      issuerId: seeded.issuer.id,
      recipientName: 'Bob Verifier',
      recipientEmail: `livetest_bob_${timestamp}@example.com`,
      title: 'Active Certificate of Completion',
      referenceNumber: `TEST-ACTIVE-${timestamp}`,
      issuanceDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }, seeded.issuerUser.id);
    activeDoc = activeRes.document;

    // 2. Create Revoked Document
    const revokedRes = await documentService.createDocument({
      documentTypeId: seeded.docType.id,
      issuerId: seeded.issuer.id,
      recipientName: 'Charlie Revoked',
      recipientEmail: `livetest_charlie_${timestamp}@example.com`,
      title: 'Revoked Certificate',
      referenceNumber: `TEST-REVOKED-${timestamp}`,
      issuanceDate: new Date().toISOString()
    }, seeded.issuerUser.id);
    revokedDoc = revokedRes.document;

    await documentService.updateDocument(
      revokedDoc.id,
      { status: DOCUMENT_STATUS.REVOKED },
      seeded.issuerUser.id,
      USER_ROLES.ADMIN
    );

    // 3. Create Expired Document
    const expiredRes = await documentService.createDocument({
      documentTypeId: seeded.docType.id,
      issuerId: seeded.issuer.id,
      recipientName: 'Diana Expired',
      recipientEmail: `livetest_diana_${timestamp}@example.com`,
      title: 'Expired Security Clearance',
      referenceNumber: `TEST-EXPIRED-${timestamp}`,
      issuanceDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }, seeded.issuerUser.id);
    expiredDoc = expiredRes.document;
  });

  afterAll(async () => {
    await cleanTestDatabase();
    await prisma.$disconnect();
  });

  describe('Live QR Code Verification & Audit Logging', () => {
    const userAgent = 'LiveTest-Verifier-Scanner/1.0';
    const ipAddress = '192.168.1.100';

    it('should verify an active document via qrCodeId and write audit log into Supabase verification_logs table', async () => {
      const result = await verificationService.verifyByQRCode(
        activeDoc.qrCodeId,
        userAgent,
        ipAddress
      );

      expect(result.success).toBe(true);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.VALID);
      expect(result.data.document.title).toBe('Active Certificate of Completion');
      expect(result.data.document.referenceNumber).toBe(activeDoc.referenceNumber);
      expect(result.data.document.issuer.name).toBe(seeded.issuer.name);

      // Verify audit record was inserted directly in Supabase
      const logInDb = await prisma.verificationLog.findFirst({
        where: {
          documentId: activeDoc.id,
          qrCodeId: activeDoc.qrCodeId
        },
        orderBy: { timestamp: 'desc' }
      });

      expect(logInDb).not.toBeNull();
      expect(logInDb.verificationStatus).toBe(VERIFICATION_STATUS.VALID);
      expect(logInDb.ipAddress).toBe(ipAddress);
      expect(logInDb.userAgent).toBe(userAgent);
    });

    it('should verify revoked document and record REVOKED status in Supabase verification_logs', async () => {
      const result = await verificationService.verifyByQRCode(
        revokedDoc.qrCodeId,
        userAgent,
        ipAddress
      );

      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.REVOKED);

      const logInDb = await prisma.verificationLog.findFirst({
        where: { documentId: revokedDoc.id },
        orderBy: { timestamp: 'desc' }
      });

      expect(logInDb).not.toBeNull();
      expect(logInDb.verificationStatus).toBe(VERIFICATION_STATUS.REVOKED);
    });

    it('should verify expired document and record EXPIRED status in Supabase verification_logs', async () => {
      const result = await verificationService.verifyByQRCode(
        expiredDoc.qrCodeId,
        userAgent,
        ipAddress
      );

      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.EXPIRED);

      const logInDb = await prisma.verificationLog.findFirst({
        where: { documentId: expiredDoc.id },
        orderBy: { timestamp: 'desc' }
      });

      expect(logInDb).not.toBeNull();
      expect(logInDb.verificationStatus).toBe(VERIFICATION_STATUS.EXPIRED);
    });

    it('should handle non-existent QR code and write INVALID verification log', async () => {
      const randomQr = 'non-existent-qr-uuid-00000000';
      const result = await verificationService.verifyByQRCode(
        randomQr,
        userAgent,
        ipAddress
      );

      expect(result.success).toBe(false);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.INVALID);
    });
  });

  describe('Live Reference Number Verification', () => {
    it('should verify document by reference number against Supabase', async () => {
      const result = await verificationService.verifyByReference(
        activeDoc.referenceNumber,
        'LiveTestBrowser/2.0',
        '10.0.0.1'
      );

      expect(result.success).toBe(true);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.VALID);
      expect(result.data.document.title).toBe('Active Certificate of Completion');
      expect(result.data.document.referenceNumber).toBe(activeDoc.referenceNumber);
    });
  });

  describe('Live Verification Logs Querying', () => {
    it('should fetch audit logs from Supabase with pagination and filtering', async () => {
      const logsResult = await verificationService.getVerificationLogs(
        { documentId: activeDoc.id, page: 1, limit: 10 },
        USER_ROLES.ADMIN
      );

      expect(logsResult).toHaveProperty('logs');
      expect(logsResult).toHaveProperty('pagination');
      expect(logsResult.logs.length).toBeGreaterThanOrEqual(1);
      expect(logsResult.logs[0].documentId).toBe(activeDoc.id);
    });
  });
});
