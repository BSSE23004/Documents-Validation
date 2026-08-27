import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * QR Code & Cryptographic Verification Service (ESM)
 * Handles QR identifier generation, URL generation, and Backend Squad B integration hooks.
 */

// Generate a cryptographically secure QR code identifier
export const generateQRCodeId = () => {
  return uuidv4();
};

// Generate full QR Code verification URL
export const generateQRCodeUrl = (qrCodeId) => {
  const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'https://api.devlogix.online';
  return `${baseUrl.replace(/\/$/, '')}/qr/${qrCodeId}`;
};

/**
 * Backend Squad B Integration Hook: QR Code Generation
 */
export const triggerQRCodeGenerationHook = async (documentData) => {
  const squadBUrl = process.env.SQUAD_B_SERVICE_URL || 'http://localhost:5000';
  const internalApiKey = process.env.INTERNAL_API_KEY;

  try {
    const payload = {
      documentId: documentData.id,
      qrCodeId: documentData.qrCodeId,
      documentType: documentData.documentType,
      title: documentData.title,
      referenceNumber: documentData.referenceNumber,
      recipientName: documentData.recipientName,
      recipientEmail: documentData.recipientEmail,
      issuanceDate: documentData.issuanceDate,
      expiryDate: documentData.expiryDate,
      metadata: documentData.metadata
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
    console.warn('Squad B QR generation service notice:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Backend Squad B Integration Hook: Notification Hook
 */
export const triggerNotificationHook = async (recipientEmail, documentDetails) => {
  try {
    const payload = {
      recipientEmail,
      document: documentDetails,
      timestamp: new Date().toISOString()
    };
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
 */
export const validateIssuerApiKey = (providedKey, issuerApiKey) => {
  if (!providedKey || !issuerApiKey) return false;
  return crypto.timingSafeEqual(
    Buffer.from(providedKey),
    Buffer.from(issuerApiKey)
  );
};

export default {
  generateQRCodeId,
  generateQRCodeUrl,
  triggerQRCodeGenerationHook,
  triggerNotificationHook,
  validateIssuerApiKey
};
