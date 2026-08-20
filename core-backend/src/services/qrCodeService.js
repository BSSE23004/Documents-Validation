const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * QR Code & Cryptographic Verification Service
 * Handles QR identifier generation, URL generation, and Backend Squad B integration hooks.
 */

// Generate a cryptographically secure QR code identifier
const generateQRCodeId = () => {
  // Generates standard UUID v4 or cryptographic token
  return uuidv4();
};

// Generate full QR Code verification URL
const generateQRCodeUrl = (qrCodeId) => {
  const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'https://api.devlogix.online';
  return `${baseUrl.replace(/\/$/, '')}/qr/${qrCodeId}`;
};

/**
 * Backend Squad B Integration Hook: QR Code Generation
 * Specification Section 6.1.1:
 * Endpoint: POST /documents (Squad A)
 * Trigger: After document creation
 * Data: Document ID, QR code ID
 * Purpose: Trigger QR code generation by Squad B
 */
const triggerQRCodeGenerationHook = async (documentId, qrCodeId) => {
  try {
    const payload = {
      documentId,
      qrCodeId,
      timestamp: new Date().toISOString()
    };
    // In production, this can emit an event or call Squad B webhook/queue
    return {
      success: true,
      data: payload
    };
  } catch (error) {
    console.error('Error triggering Squad B QR generation hook:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Backend Squad B Integration Hook: Notification Hook
 * Specification Section 6.1.2:
 * Endpoint: POST /documents (Squad A)
 * Trigger: After document creation
 * Data: Recipient email, document details
 * Purpose: Trigger email notification by Squad B
 */
const triggerNotificationHook = async (recipientEmail, documentDetails) => {
  try {
    const payload = {
      recipientEmail,
      document: documentDetails,
      timestamp: new Date().toISOString()
    };
    // In production, this can emit an event or call Squad B webhook/queue
    return {
      success: true,
      data: payload
    };
  } catch (error) {
    console.error('Error triggering Squad B Notification hook:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * API Key Validation Helper
 * Specification Section 6.1.3:
 * Service: Shared validation service
 * Purpose: Validate issuer API keys for document generation
 */
const validateIssuerApiKey = (providedKey, issuerApiKey) => {
  if (!providedKey || !issuerApiKey) return false;
  return crypto.timingSafeEqual(
    Buffer.from(providedKey),
    Buffer.from(issuerApiKey)
  );
};

module.exports = {
  generateQRCodeId,
  generateQRCodeUrl,
  triggerQRCodeGenerationHook,
  triggerNotificationHook,
  validateIssuerApiKey
};
