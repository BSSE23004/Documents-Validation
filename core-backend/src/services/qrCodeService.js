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
 * Target: POST /api/internal/qr/generate (Squad B)
 * Headers: x-internal-api-key
 * Data: Document ID, QR code ID
 * Purpose: Trigger QR code generation by Squad B
 */
const triggerQRCodeGenerationHook = async (documentId, qrCodeId) => {
  const squadBUrl = process.env.SQUAD_B_SERVICE_URL || 'http://localhost:5000';
  const internalApiKey = process.env.INTERNAL_API_KEY;

  try {
    const payload = {
      documentId,
      qrCodeId,
      timestamp: new Date().toISOString()
    };

    // Call Squad B endpoint with 5 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${squadBUrl.replace(/\/$/, '')}/api/internal/qr/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': internalApiKey
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Squad B QR generation returned status ${response.status}`);
      return { success: false, status: response.status };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    // If Squad B is offline during development/testing, log warning gracefully without failing document creation
    console.warn('Squad B QR generation service notice:', error.message);
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
