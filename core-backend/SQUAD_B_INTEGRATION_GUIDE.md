# Backend Squad A & Squad B Integration Guide
**Project:** Secure Delivery & Verification System  
**From:** Backend Squad A (Core Architecture & Digital Asset Verification)  
**To:** Backend Squad B (Communications & Generation)  
**Version:** 1.0  
**Status:** Active  

---

## 1. Overview
This document provides the API specifications and contract between **Backend Squad A** (Core CRUD & Verification Engine) and **Backend Squad B** (Email Notifications & QR Code Generation Service).

---

## 2. Squad B Integration Hooks (Triggered by Squad A)

Whenever a digital asset (document/certificate) is created via `POST /api/documents`, Squad A automatically executes integration hooks implemented in [`src/services/qrCodeService.js`](./src/services/qrCodeService.js).

### 2.1 Notification Hook (Email Trigger)
* **Trigger Point:** Dispatched immediately after document creation in `documentService.createDocument()`.
* **Method:** `triggerNotificationHook(recipientEmail, documentDetails)`

#### Payload dispatched to Squad B:
```json
{
  "recipientEmail": "jane@example.com",
  "document": {
    "id": "856093a0-1e5a-435a-8586-180dfa4c7f37",
    "title": "Internship Offer Letter",
    "referenceNumber": "DL-2026-001",
    "qrCodeUrl": "https://api.devlogix.online/qr/1d6c6ef2-e2b7-45e5-95e1-967d140c3dec"
  },
  "timestamp": "2026-08-20T12:00:00.000Z"
}
```
* **Squad B Action:** Squad B email queue consumes this payload, generates the email template containing the `title`, `referenceNumber`, and `qrCodeUrl`, and sends it to `recipientEmail` with duplicate-send protection.

---

### 2.2 QR Code Generation Hook
* **Trigger Point:** Dispatched immediately after document creation.
* **Method:** `triggerQRCodeGenerationHook(documentId, qrCodeId)`

#### Payload dispatched to Squad B:
```json
{
  "documentId": "856093a0-1e5a-435a-8586-180dfa4c7f37",
  "qrCodeId": "1d6c6ef2-e2b7-45e5-95e1-967d140c3dec",
  "timestamp": "2026-08-20T12:00:00.000Z"
}
```
* **Squad B Action:** Squad B generates the cryptographic QR code image asset using `qrCodeId`.

---

## 3. Squad A Core Endpoints Reference

### 3.1 Digital Asset (Document) Endpoints

#### `POST /api/documents` (Create Document)
* **Auth:** Required (`Bearer <JWT>`, Roles: `admin`, `issuer`)
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "documentTypeId": "fb6cf71d-abeb-4b3f-b3c3-b09e30286a29",
  "issuerId": "31cb6e6a-c631-43a9-a969-ed252b63ad84",
  "recipientName": "Jane Smith",
  "recipientEmail": "jane@example.com",
  "title": "Internship Offer Letter",
  "description": "Internship offer for Software Engineer position",
  "referenceNumber": "DL-2026-001",
  "issuanceDate": "2026-08-18T10:00:00Z",
  "expiryDate": "2026-12-31T23:59:59Z",
  "metadata": {
    "position": "Software Engineer",
    "department": "Engineering"
  }
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "document": {
      "id": "856093a0-1e5a-435a-8586-180dfa4c7f37",
      "qrCodeId": "1d6c6ef2-e2b7-45e5-95e1-967d140c3dec",
      "title": "Internship Offer Letter",
      "referenceNumber": "DL-2026-001",
      "status": "active",
      "createdAt": "2026-08-20T12:00:00.000Z"
    },
    "qrCodeUrl": "https://api.devlogix.online/qr/1d6c6ef2-e2b7-45e5-95e1-967d140c3dec"
  }
}
```

---

#### `GET /api/documents/:id` (Get Document by ID)
* **Auth:** Required (`Bearer <JWT>`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "856093a0-1e5a-435a-8586-180dfa4c7f37",
      "qrCodeId": "1d6c6ef2-e2b7-45e5-95e1-967d140c3dec",
      "documentType": {
        "id": "fb6cf71d-abeb-4b3f-b3c3-b09e30286a29",
        "name": "Internship Offer Letter"
      },
      "issuer": {
        "id": "31cb6e6a-c631-43a9-a969-ed252b63ad84",
        "name": "DevLogix",
        "logoUrl": "https://devlogix.online/logo.png"
      },
      "recipientName": "Jane Smith",
      "recipientEmail": "jane@example.com",
      "title": "Internship Offer Letter",
      "description": "Internship offer for Software Engineer position",
      "referenceNumber": "DL-2026-001",
      "issuanceDate": "2026-08-18T10:00:00Z",
      "expiryDate": "2026-12-31T23:59:59Z",
      "status": "active",
      "metadata": {
        "position": "Software Engineer",
        "department": "Engineering"
      },
      "createdAt": "2026-08-20T12:00:00.000Z"
    }
  }
}
```

---

#### `GET /api/documents` (Get All Documents Paginated)
* **Auth:** Required (`Bearer <JWT>`)
* **Query Parameters:** `page`, `limit`, `status` (active/revoked/expired), `documentTypeId`, `issuerId`, `recipientEmail`, `search`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [ ... ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

---

#### `PUT /api/documents/:id` (Update Document)
* **Auth:** Required (`Bearer <JWT>`, Roles: `admin`, `issuer`)
* **Request Body:**
```json
{
  "status": "revoked",
  "description": "Revoked due to policy change"
}
```

---

### 3.2 Verification Endpoints (Public)

#### `POST /api/verify/qr-code` (Verify Document by QR Code)
* **Auth:** None (Public Endpoint)
* **Request Body:**
```json
{
  "qrCodeId": "1d6c6ef2-e2b7-45e5-95e1-967d140c3dec"
}
```
* **Response (200 OK - Valid):**
```json
{
  "success": true,
  "verificationStatus": "valid",
  "data": {
    "document": {
      "documentType": "Internship Offer Letter",
      "title": "Internship Offer Letter",
      "issuer": {
        "name": "DevLogix",
        "logoUrl": "https://devlogix.online/logo.png"
      },
      "recipient": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "issuanceDate": "2026-08-18T10:00:00Z",
      "referenceNumber": "DL-2026-001",
      "status": "active"
    },
    "verifiedAt": "2026-08-20T12:30:00.000Z"
  }
}
```

---

#### `POST /api/verify/reference` (Verify by Reference Number)
* **Auth:** None (Public Endpoint)
* **Request Body:**
```json
{
  "referenceNumber": "DL-2026-001"
}
```

---

## 4. Contact & Code Locations
* **Squad A Service File:** `src/services/qrCodeService.js`
* **Document Service:** `src/services/documentService.js`
* **Verification Service:** `src/services/verificationService.js`
