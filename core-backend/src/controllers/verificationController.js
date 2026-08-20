const verificationService = require('../services/verificationService');

/**
 * Verification Controller
 * Handles document verification and audit logging requests
 * Specification Section 4.5
 */

// POST /api/verify/qr-code - Verify document by QR code (public)
const verifyByQRCode = async (req, res, next) => {
  try {
    const { qrCodeId } = req.body;
    const { userAgent, ipAddress } = req;
    
    const result = await verificationService.verifyByQRCode(qrCodeId, userAgent, ipAddress);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// POST /api/verify/reference - Verify document by reference number (public)
const verifyByReference = async (req, res, next) => {
  try {
    const { referenceNumber } = req.body;
    const { userAgent, ipAddress } = req;
    
    const result = await verificationService.verifyByReference(referenceNumber, userAgent, ipAddress);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/verify/logs - Get verification logs (admin/verifier)
const getVerificationLogs = async (req, res, next) => {
  try {
    const userRole = req.user?.role;
    const filters = {
      documentId: req.query.documentId,
      qrCodeId: req.query.qrCodeId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit
    };
    
    const result = await verificationService.getVerificationLogs(filters, userRole);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/verify/logs/:id - Get single verification log (admin/verifier)
const getVerificationLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await verificationService.getVerificationLogById(id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/verify/logs/:id - Update verification log record (admin/verifier)
const updateVerificationLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const result = await verificationService.updateVerificationLog(id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Verification log updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyByQRCode,
  verifyByReference,
  getVerificationLogs,
  getVerificationLogById,
  updateVerificationLog
};