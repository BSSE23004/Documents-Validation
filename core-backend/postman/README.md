# Documents Validation Platform — Postman Collection & Testing Guide

 This directory contains the complete Postman collection and environment files for testing and development

---

## 📁 Directory Contents

| File | Description |
| :--- | :--- |
| **[`Documents_Validation_API.postman_collection.json`](./Documents_Validation_API.postman_collection.json)** | Complete Postman Collection v2.1.0 containing all 21 endpoints with pre-configured headers, sample payloads, and automated test scripts. |
| **[`Documents_Validation_API.postman_environment.json`](./Documents_Validatc:\Users\Suleman\Downloads\Document Validation - Local.postman_environment.jsonion_API.postman_environment.json)** | Pre-configured environment file with local server variables (`baseUrl`, tokens, sample IDs). |

---

## 🚀 Quick Start in 3 Steps

### 1. Import Files into Postman
1. Open **Postman**.
2. Click the **Import** button (top-left).
3. Drag & drop or select both files from this `/postman` folder:
   - `Documents_Validation_API.postman_collection.json`
   - `Documents_Validation_API.postman_environment.json`

### 2. Select the Environment
* In the top-right environment selector dropdown, choose:  
  **`Documents Validation API (Local Development)`**

### 3. Run Login (Automatic Token Management)
* Expand the collection ➔ Open **`1. Authentication`** ➔ Send **`Login (Admin)`**.
* **✨ Magic Test Script:** Postman will automatically extract the JWT `token`, `refreshToken`, and `sessionId` from the response and store them in your collection variables. All protected endpoints will now work automatically without manual token copying!

---

## 🔑 Environment & Collection Variables

The collection uses dynamic variables to automatically pass authentication tokens and IDs between requests:

| Variable Name | Default / Example Value | Description |
| :--- | :--- | :--- |
| `{{baseUrl}}` | `http://localhost:3000` | Target backend host and port. |
| `{{adminToken}}` | *(Auto-populated on Admin login)* | Bearer JWT token for Admin operations. |
| `{{userToken}}` | *(Auto-populated on User login)* | Bearer JWT token for standard User operations. |
| `{{refreshToken}}` | *(Auto-populated on login)* | Token used to test token rotation via `POST /api/auth/refresh`. |
| `{{sessionId}}` | *(Auto-populated on login)* | Active database session ID for revocation tests. |
| `{{docTypeId}}` | `71011bee-28a3-494f-a66c-57427328859e` | Document Type UUID (e.g. *Offer Letter*). |
| `{{issuerId}}` | `8483c2fb-92a1-43f9-b96d-f0ecc7874520` | Issuing Organization UUID (e.g. *Nova Tech Corp*). |
| `{{docId}}` | *(Auto-populated on doc creation)* | UUID of the newly issued document. |
| `{{qrCodeId}}` | *(Auto-populated on doc creation)* | Cryptographic QR code identifier for scanning tests. |
| `{{referenceNumber}}` | `OFFER-2026-DEV-001` | Human-readable document reference number. |

---

## 📚 Detailed Collection Folder Breakdown

### `0. System & Health`
Contains basic health checks to verify server and database status.

* **`GET /health`**
  * **Access:** Public (No Auth)
  * **Purpose:** Checks database connection and server uptime.
  * **Response:** `{ statusCode: 200, success: true, message: "Server is running", data: { timestamp, environment } }`

---

### `1. Authentication (/api/auth)`
Full authentication flow with device session management and token rotation.

* **`POST /api/auth/register` (User)**
  * **Payload:** `{ "email": "user@example.com", "password": "UserPass123!", "name": "Standard User", "role": "user" }`
  * **Success:** `201 Created`
* **`POST /api/auth/register` (Admin)**
  * **Payload:** `{ "email": "admin@example.com", "password": "AdminPass123!", "name": "Admin User", "role": "admin" }`
* **`POST /api/auth/login` (Admin)**
  * **Payload:** `{ "email": "admin@testflow.com", "password": "AdminPass123!" }`
  * **Test Script:** Automatically stores `data.token` into `{{adminToken}}`.
* **`POST /api/auth/login` (User)**
  * **Payload:** `{ "email": "alice@testflow.com", "password": "AlicePass123!" }`
  * **Test Script:** Automatically stores `data.token` into `{{userToken}}`.
* **`POST /api/auth/refresh`**
  * **Payload:** `{ "refreshToken": "{{refreshToken}}" }`
  * **Purpose:** Rotates refresh token and issues a new access token.
* **`GET /api/auth/sessions`**
  * **Header:** `Authorization: Bearer {{adminToken}}`
  * **Purpose:** Lists all devices/browsers currently logged into this account.
* **`DELETE /api/auth/sessions/{{sessionId}}`**
  * **Purpose:** Remotely logs out / revokes a specific device session.
* **`POST /api/auth/logout`**
  * **Purpose:** Terminate current device session.
* **`POST /api/auth/logout-all`**
  * **Purpose:** Terminate all active device sessions across all phones/laptops.

---

### `2. User Management (/api/users)`
Profile querying and updating.

* **`GET /api/users/profile`**
  * **Header:** `Authorization: Bearer {{adminToken}}`
  * **Purpose:** Returns the authenticated user's profile details (`id`, `email`, `name`, `role`).
* **`PUT /api/users/profile`**
  * **Payload:** `{ "name": "Admin Name Updated" }`
  * **Purpose:** Update user details.
* **`GET /api/users/sessions`**
  * **Purpose:** User route to view active device sessions.
* **`DELETE /api/users/sessions/{{sessionId}}`**
  * **Purpose:** User route to revoke an active session.

---

### `3. Document Types (/api/document-types)`
Category management for digital credentials.

* **`GET /api/document-types`**
  * **Header:** `Authorization: Bearer {{adminToken}}`
  * **Purpose:** Fetches all active document categories (e.g. *Offer Letter*, *Degree Certificate*).
* **`POST /api/document-types`**
  * **Access:** Admin only
  * **Payload:**
    ```json
    {
      "name": "Experience Certificate",
      "description": "Official employment experience certificate",
      "template": { "fields": ["employeeId", "role", "yearsOfService"] }
    }
    ```
  * **Test Script:** Automatically stores `data.documentType.id` into `{{docTypeId}}`.

---

### `4. Issuing Organizations (/api/issuers)`
Institutions and companies authorized to issue certificates.

* **`GET /api/issuers`**
  * **Header:** `Authorization: Bearer {{adminToken}}`
  * **Purpose:** Returns all registered issuing institutions.
* **`POST /api/issuers`**
  * **Access:** Admin only
  * **Payload:**
    ```json
    {
      "name": "Global Tech Institute",
      "email": "admin@globaltech.edu",
      "logoUrl": "https://globaltech.edu/logo.png"
    }
    ```
  * **Test Script:** Automatically stores `data.issuer.id` into `{{issuerId}}`.

---

### `5. Documents Management (/api/documents)`
Core digital asset lifecycle (Issuance, Retrieval, Listing, Revocation, Deletion).

* **`POST /api/documents` (Create / Issue)**
  * **Access:** Admin & Issuer
  * **Payload:**
    ```json
    {
      "documentTypeId": "{{docTypeId}}",
      "issuerId": "{{issuerId}}",
      "recipientName": "John Doe",
      "recipientEmail": "john@example.com",
      "title": "Senior Engineer Offer Letter",
      "description": "Official offer letter for Senior Full Stack Engineer",
      "referenceNumber": "OFFER-2026-DEV-001",
      "issuanceDate": "2026-08-27T00:00:00Z",
      "expiryDate": "2028-08-27T23:59:59Z",
      "metadata": {
        "position": "Senior Engineer",
        "salary": "120,000 USD",
        "department": "Engineering"
      }
    }
    ```
  * **Test Script:** Automatically saves `data.document.id` to `{{docId}}`, `data.document.qrCodeId` to `{{qrCodeId}}`, and `referenceNumber` to `{{referenceNumber}}`.
* **`GET /api/documents` (Paginated List)**
  * **Query Params:** `?page=1&limit=10&status=active&search=Senior`
  * **Purpose:** Query documents with full-text search and pagination metadata.
* **`GET /api/documents/{{docId}}`**
  * **Purpose:** Fetch single document details with embedded issuer and documentType objects.
* **`PUT /api/documents/{{docId}}`**
  * **Payload:** `{ "title": "Senior Engineer Offer Letter (Updated)", "status": "active" }`
* **`PATCH /api/documents/{{docId}}` (Revoke)**
  * **Payload:** `{ "status": "revoked" }`
  * **Purpose:** Revoke an active certificate. Verification scanners will immediately flag it as revoked.
* **`DELETE /api/documents/{{docId}}`**
  * **Access:** Admin only
  * **Purpose:** Permanently remove document record from database.

---

### `6. Public Verification Scanner (/api/verify)`
Public scanner endpoints designed for QR code cameras, verifier portals, and audit trails.

* **`POST /api/verify/qr-code`**
  * **Access:** **Public (No Authorization Header)**
  * **Payload:** `{ "qrCodeId": "{{qrCodeId}}" }`
  * **Behavior:**
    * Automatically records client IP and User-Agent in `verification_logs`.
    * If document is Active: Returns `data.verificationStatus: "valid"` ✅
    * If document is Revoked: Returns `data.verificationStatus: "revoked"` ❌
    * If document is Expired: Returns `data.verificationStatus: "expired"` ⚠️
    * If QR code is not found: Returns `data.verificationStatus: "invalid"` 🚫
* **`POST /api/verify/reference`**
  * **Access:** **Public (No Authorization Header)**
  * **Payload:** `{ "referenceNumber": "{{referenceNumber}}" }`
  * **Purpose:** Manual reference number lookup for physical paper certificates.
* **`GET /api/verify/logs`**
  * **Access:** Admin & Verifier
  * **Query Params:** `?page=1&limit=20&documentId={{docId}}`
  * **Purpose:** Query the immutable verification audit trail.

---

## 🔄 Recommended End-to-End Test Sequence

To test the entire platform lifecycle from scratch, execute requests in this order:

1. **`0. System & Health` ➔ `Health Check`** *(Verify API is live)*
2. **`1. Authentication` ➔ `Login (Admin)`** *(Populates `{{adminToken}}`)*
3. **`3. Document Types` ➔ `Create Document Type`** *(Populates `{{docTypeId}}`)*
4. **`4. Issuers` ➔ `Create Issuer`** *(Populates `{{issuerId}}`)*
5. **`5. Documents` ➔ `Create / Issue Document`** *(Populates `{{docId}}` & `{{qrCodeId}}`)*
6. **`6. Public Verification` ➔ `Verify by QR Code ID`** *(Expects: `status: "valid"`)*
7. **`5. Documents` ➔ `Revoke Document (PATCH)`** *(Sets `status: "revoked"`)*
8. **`6. Public Verification` ➔ `Verify by QR Code ID`** *(Expects: `status: "revoked"`)*
9. **`1. Authentication` ➔ `Login (User)`** *(Populates `{{userToken}}`)*
10. **`3. Document Types` ➔ `Create Document Type` with User Token** *(Expects: `403 Forbidden`)*

---

## 🛡️ Global Response & Error Handling

Every response follows the standard 4-property envelope:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Descriptive message",
  "data": { ... }
}
```

Common Error Codes:
* `401 Unauthorized` ➔ `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_INVALID`, `AUTH_TOKEN_EXPIRED`
* `403 Forbidden` ➔ `AUTH_INSUFFICIENT_PERMISSIONS`
* `404 Not Found` ➔ `NOT_FOUND`, `DOCUMENT_NOT_FOUND`
* `409 Conflict` ➔ `VALIDATION_DUPLICATE_EMAIL`, `VALIDATION_DUPLICATE`
* `422 Unprocessable` ➔ `VALIDATION_INVALID_INPUT`
