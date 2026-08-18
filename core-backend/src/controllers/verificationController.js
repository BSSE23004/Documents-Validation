const verificationService = require('../services/verificationService');

/**
 * Verification Controller
 * Handles document verification requests
 */

// Verify document by QR code
const verifyByQRCode = async (req, res, next) => {
  try {
    const { qrCodeId } = req.body;
    const { userAgent, ipAddress } = req;
    
    const result = await verificationService.verifyByQRCode(qrCodeId, userAgent, ipAddress);
    
    res.status(200).json({
      success: result.success,
      verificationStatus: result.verificationStatus,
      message: result.message,
      errorCode: result.errorCode,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

// Verify document by reference number
const verifyByReference = async (req, res, next) => {
  try {
    const { referenceNumber } = req.body;
    const { userAgent, ipAddress } = req;
    
    const result = await verificationService.verifyByReference(referenceNumber, userAgent, ipAddress);
    
    res.status(200).json({
      success: result.success,
      verificationStatus: result.verificationStatus,
      message: result.message,
      errorCode: result.errorCode,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

// Get verification logs
const getVerificationLogs = async (req, res, next) => {
  try {
    const userRole = req.user?.role;
    const filters = {
      documentId: req.query.documentId,
      qrCodeId: req.query.qrCodeId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
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

module.exports = {
  verifyByQRCode,
  verifyByReference,
  getVerificationLogs
};