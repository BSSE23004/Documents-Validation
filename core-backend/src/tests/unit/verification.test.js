import { jest } from '@jest/globals';
import { prisma } from '../../config/database.js';
import { VERIFICATION_STATUS, DOCUMENT_STATUS } from '../../config/constants.js';
import * as verificationService from '../../services/verification.service.js';

describe('Verification Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyByQRCode', () => {
    const mockActiveDoc = {
      id: 'doc-123',
      qrCodeId: 'qr-valid-uuid',
      title: 'Software Engineer Internship',
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com',
      referenceNumber: 'DL-2026-001',
      issuanceDate: new Date('2026-08-15T00:00:00Z'),
      expiryDate: new Date('2099-12-31T23:59:59Z'),
      status: DOCUMENT_STATUS.ACTIVE,
      metadata: { position: 'Software Engineer', department: 'Engineering' },
      documentType: { id: 'type-1', name: 'Internship Offer Letter' },
      issuer: { id: 'iss-1', name: 'DevLogix', logoUrl: 'https://devlogix.online/logo.png' }
    };

    it('should return valid verification and log attempt for active non-expired document', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockActiveDoc);
      jest.spyOn(prisma.verificationLog, 'create').mockResolvedValue({ id: 'log-1' });

      const result = await verificationService.verifyByQRCode('qr-valid-uuid', 'Mozilla/5.0', '192.168.1.1');

      expect(result.success).toBe(true);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.VALID);
      expect(result.data.document.title).toBe('Software Engineer Internship');
      expect(result.data.document.issuer.name).toBe('DevLogix');
      expect(prisma.verificationLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          documentId: 'doc-123',
          verificationStatus: VERIFICATION_STATUS.VALID,
          ipAddress: '192.168.1.1'
        })
      }));
    });

    it('should return invalid response when QR code is not found', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(null);

      const result = await verificationService.verifyByQRCode('non-existent-qr');

      expect(result.success).toBe(false);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.INVALID);
      expect(result.errorCode).toBe('QR_NOT_FOUND');
    });

    it('should return revoked status and log attempt when document status is revoked', async () => {
      const mockRevokedDoc = {
        ...mockActiveDoc,
        status: DOCUMENT_STATUS.REVOKED,
        updatedAt: new Date('2026-08-17T10:00:00Z')
      };
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockRevokedDoc);
      jest.spyOn(prisma.verificationLog, 'create').mockResolvedValue({ id: 'log-2' });

      const result = await verificationService.verifyByQRCode('qr-revoked-uuid', 'Mozilla/5.0', '192.168.1.1');

      expect(result.success).toBe(false);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.REVOKED);
      expect(result.message).toContain('revoked');
      expect(prisma.verificationLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          verificationStatus: VERIFICATION_STATUS.REVOKED
        })
      }));
    });

    it('should return expired status and log attempt when document expiryDate has passed', async () => {
      const mockExpiredDoc = {
        ...mockActiveDoc,
        expiryDate: new Date('2020-01-01T00:00:00Z')
      };
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockExpiredDoc);
      jest.spyOn(prisma.verificationLog, 'create').mockResolvedValue({ id: 'log-3' });

      const result = await verificationService.verifyByQRCode('qr-expired-uuid', 'Mozilla/5.0', '192.168.1.1');

      expect(result.success).toBe(false);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.EXPIRED);
      expect(result.message).toContain('expired');
    });
  });

  describe('verifyByReference', () => {
    it('should find document by referenceNumber and run verification', async () => {
      const mockDoc = {
        id: 'doc-123',
        qrCodeId: 'qr-ref-uuid',
        title: 'Software Engineer Internship',
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com',
        referenceNumber: 'DL-2026-001',
        issuanceDate: new Date('2026-08-15T00:00:00Z'),
        expiryDate: new Date('2099-12-31T23:59:59Z'),
        status: DOCUMENT_STATUS.ACTIVE,
        metadata: null,
        documentType: { id: 'type-1', name: 'Internship Offer' },
        issuer: { id: 'iss-1', name: 'DevLogix', logoUrl: null }
      };

      jest.spyOn(prisma.document, 'findUnique')
        .mockResolvedValueOnce(mockDoc) // findByReference
        .mockResolvedValueOnce(mockDoc); // findByQRCodeId

      jest.spyOn(prisma.verificationLog, 'create').mockResolvedValue({ id: 'log-1' });

      const result = await verificationService.verifyByReference('DL-2026-001', 'Mozilla/5.0', '127.0.0.1');

      expect(result.success).toBe(true);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.VALID);
    });

    it('should return invalid when reference number does not match any document', async () => {
      jest.spyOn(prisma.document, 'findUnique').mockResolvedValue(null);

      const result = await verificationService.verifyByReference('UNKNOWN-REF');

      expect(result.success).toBe(false);
      expect(result.verificationStatus).toBe(VERIFICATION_STATUS.INVALID);
      expect(result.errorCode).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  describe('getVerificationLogs', () => {
    it('should return paginated verification logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          documentId: 'doc-1',
          qrCodeId: 'qr-1',
          verificationStatus: 'valid',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          errorMessage: null,
          timestamp: new Date(),
          document: { id: 'doc-1', title: 'Offer', referenceNumber: 'DL-001', recipientName: 'Jane' }
        }
      ];

      jest.spyOn(prisma.verificationLog, 'findMany').mockResolvedValue(mockLogs);
      jest.spyOn(prisma.verificationLog, 'count').mockResolvedValue(1);

      const result = await verificationService.getVerificationLogs({ page: 1, limit: 10 }, 'admin');

      expect(result.logs).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
    });
  });
});
