# Technical Specification Document
## Secure Delivery & Verification System (MERN) - Backend Squad A

**Project:** Secure Delivery & Verification System  
**Squad:** Backend Squad A (Core Architecture & Security)  
**Version:** 1.0  
**Date:** August 18, 2026  
**Reference:** verify.devlogix.online

---

## 1. Executive Summary

### 1.1 Project Overview
The Secure Delivery & Verification System is a digital asset verification engine that enables DevLogix to issue QR-coded, cryptographically verified documents, certificates, and project handoffs to clients. The system provides instant verification of document authenticity through QR code scanning, similar to the reference implementation at verify.devlogix.online.

### 1.2 Backend Squad A Responsibilities
- Core business logic implementation
- Secure authentication and session management (JWT-based)
- Primary database integration via Supabase (PostgreSQL)
- Core architecture design and security implementation
- API endpoint definitions for core functionality
- Database schema design and optimization

### 1.3 Business Value
- Instant document verification reducing fraud and manual verification processes
- Cryptographic security ensuring document authenticity
- Scalable architecture for 2-3 new client builds
- Foundation for reusable digital asset verification module

---

## 2. System Architecture

### 2.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│              (Next.js/React - Frontend Squads)             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │ REST API
┌────────────────────▼────────────────────────────────────────┐
│                  API Gateway Layer                          │
│         (Express.js - Rate Limiting, CORS, Security)       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Business Logic Layer                           │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ Authentication   │      │ Document         │          │
│  │ Service          │      │ Service          │          │
│  └──────────────────┘      └──────────────────┘          │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ User Management  │      │ Validation       │          │
│  │ Service          │      │ Service          │          │
│  └──────────────────┘      └──────────────────┘          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Data Access Layer                             │
│         (Prisma ORM - Models/Repositories)                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Database Layer                                │
│         (Supabase PostgreSQL)                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

#### Core Technologies
- **Runtime**: Node.js (LTS)
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma 5.x
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Session Management**: Express-session + Custom device-based sessions

#### Security & Utilities
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: express-validator (to be implemented)
- **Environment**: dotenv
- **Logging**: Winston/Morgan (to be implemented)
- **Cookie Management**: cookie-parser

#### Development Tools
- **API Testing**: Postman/Insomnia
- **Database Management**: Prisma Studio
- **Code Quality**: ESLint, Prettier (to be configured)

### 2.3 MVC Architecture Pattern
```
core-backend/
├── src/
│   ├── models/              # Data models (Prisma-based)
│   │   ├── User.js
│   │   ├── Document.js
│   │   ├── Session.js
│   │   ├── Issuer.js
│   │   └── VerificationLog.js
│   │
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── documentController.js
│   │   ├── userController.js
│   │   └── verificationController.js
│   │
│   ├── routes/             # API route definitions
│   │   ├── authRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── userRoutes.js
│   │   └── verificationRoutes.js
│   │
│   ├── services/           # Business logic
│   │   ├── authService.js
│   │   ├── documentService.js
│   │   ├── verificationService.js
│   │   └── qrCodeService.js
│   │
│   ├── middleware/         # Custom middleware
│   │   ├── authMiddleware.js
│   │   ├── validationMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── loggingMiddleware.js
│   │
│   ├── config/             # Configuration files
│   │   ├── database.js
│   │   └── constants.js
│   │
│   └── app.js              # Express app configuration
│
├── prisma/
│   └── schema.prisma       # Database schema
│
├── tests/                  # Test files
│   ├── unit/
│   └── integration/
│
├── package.json
├── server.js
├── .env
└── .gitignore
```

---

## 3. Database Schema Design

### 3.1 Schema Overview
The database schema is designed to support:
- User authentication and authorization
- Document/certificate management with QR codes
- Issuer organization management
- Cryptographic verification tracking
- Audit logging for compliance

### 3.2 Entity Relationship Diagram
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Session   │       │   Issuer    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ id (PK)     │       │ id (PK)     │
│ email       │       │ userId (FK) │       │ name        │
│ password    │       │ deviceId    │       │ email       │
│ name        │       │ token       │       │ logoUrl     │
│ role        │       │ expiresAt  │       │ apiKey      │
│ isActive    │       └─────────────┘       │ isActive    │
│ createdAt   │                              │ createdAt   │
└──────┬──────┘                              └─────────────┘
       │
       │
       │
┌──────▼──────────────────────────────────────────────────┐
│                     Document                              │
├───────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ qrCodeId (UNIQUE)                                       │
│ documentType (FK)                                       │
│ issuerId (FK)                                           │
│ recipientName                                           │
│ recipientEmail                                          │
│ title                                                   │
│ description                                             │
│ referenceNumber                                         │
│ issuanceDate                                            │
│ expiryDate                                              │
│ status (active/revoked/expired)                         │
│ metadata (JSONB)                                        │
│ createdAt                                               │
│ updatedAt                                               │
└──────────┬──────────────────────────────────────────────┘
           │
           │
┌──────────▼──────────────────────────────────────────────┐
│              VerificationLog                             │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ documentId (FK)                                         │
│ qrCodeId                                                │
│ verificationStatus (valid/invalid/expired/revoked)       │
│ ipAddress                                               │
│ userAgent                                               │
│ timestamp                                               │
│ errorMessage (nullable)                                 │
└──────────────────────────────────────────────────────────┘

┌─────────────┐
│DocumentType │
├─────────────┤
│ id (PK)     │
│ name        │
│ description │
│ template    │
│ isActive    │
└─────────────┘
```

### 3.3 Detailed Schema Definition

#### 3.3.1 User Model
```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  name        String
  role        String   @default("user") // admin, issuer, verifier, user
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  sessions    Session[]
  documents   Document[]
  verificationLogs VerificationLog[]
  
  @@index([email])
  @@index([role])
  @@map("users")
}
```

**Purpose**: Core authentication entity with role-based access control.

**Index Strategy**: 
- Unique index on email for fast lookups
- Index on role for admin queries

#### 3.3.2 Session Model
```prisma
model Session {
  id           String   @id @default(uuid())
  userId       String
  deviceId     String   // Unique identifier for device/browser
  token        String   @unique // JWT token
  refreshToken String?  @unique // Refresh token for token rotation
  userAgent    String?  // Browser/device info
  ipAddress    String?  // Client IP address
  expiresAt    DateTime // Token expiration time
  createdAt    DateTime @default(now())
  lastActiveAt DateTime @default(now())
  
  // Relations
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, deviceId])
  @@index([userId])
  @@index([token])
  @@index([deviceId])
  @@index([expiresAt])
  @@map("sessions")
}
```

**Purpose**: Device-based session management ensuring one session per device.

**Security Features**:
- Unique constraint on [userId, deviceId] prevents multiple sessions per device
- Token expiration tracking
- IP and user agent logging for audit trails

#### 3.3.3 Issuer Model
```prisma
model Issuer {
  id          String   @id @default(uuid())
  name        String
  email       String   @unique
  logoUrl     String?
  apiKey      String   @unique // API key for integration
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  documents   Document[]
  
  @@index([email])
  @@index([apiKey])
  @@map("issuers")
}
```

**Purpose**: Manages organizations/authorities that issue documents.

**Security Features**:
- API key for secure document generation
- Active/inactive status for issuer management

#### 3.3.4 DocumentType Model
```prisma
model DocumentType {
  id          String   @id @default(uuid())
  name        String   @unique // e.g., "Internship Offer", "Certificate", "Project Handoff"
  description String?
  template    String?  // Template configuration (JSON)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  documents   Document[]
  
  @@index([name])
  @@map("document_types")
}
```

**Purpose**: Categorizes different types of verifiable documents.

#### 3.3.5 Document Model
```prisma
model Document {
  id              String   @id @default(uuid())
  qrCodeId        String   @unique // Cryptographic QR code identifier
  documentTypeId  String
  issuerId        String
  recipientName   String
  recipientEmail  String
  title           String
  description     String?
  referenceNumber String   @unique // Business reference number
  issuanceDate    DateTime @default(now())
  expiryDate      DateTime?
  status          String   @default("active") // active, revoked, expired
  metadata        Json?    // Flexible document-specific data
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  documentType    DocumentType @relation(fields: [documentTypeId], references: [id])
  issuer          Issuer       @relation(fields: [issuerId], references: [id])
  createdBy       User         @relation(fields: [createdById], references: [id])
  verificationLogs VerificationLog[]
  
  @@unique([qrCodeId])
  @@unique([referenceNumber])
  @@index([qrCodeId])
  @@index([referenceNumber])
  @@index([documentTypeId])
  @@index([issuerId])
  @@index([status])
  @@index([recipientEmail])
  @@map("documents")
}
```

**Purpose**: Core entity representing verifiable documents with QR codes.

**Key Features**:
- Unique QR code ID for cryptographic verification
- Reference number for business tracking
- Flexible metadata for document-specific information
- Status tracking (active, revoked, expired)
- Comprehensive indexing for performance

#### 3.3.6 VerificationLog Model
```prisma
model VerificationLog {
  id                 String   @id @default(uuid())
  documentId         String
  qrCodeId           String
  verificationStatus String   // valid, invalid, expired, revoked
  ipAddress          String?
  userAgent          String?
  timestamp          DateTime @default(now())
  errorMessage       String?
  
  // Relations
  document           Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  verifiedBy         User?    @relation(fields: [verifiedById], references: [id])
  
  @@index([documentId])
  @@index([qrCodeId])
  @@index([verificationStatus])
  @@index([timestamp])
  @@map("verification_logs")
}
```

**Purpose**: Audit trail for all verification attempts.

**Compliance Features**:
- Complete audit trail for security monitoring
- IP and user agent tracking
- Error logging for troubleshooting

### 3.4 Database Constraints & Indexes

#### Performance Optimization
- **Foreign Key Indexes**: All foreign keys have indexes for join performance
- **Unique Constraints**: qrCodeId, referenceNumber, email fields
- **Composite Indexes**: [userId, deviceId] for session management
- **Query Optimization**: Indexes on frequently queried fields (status, dates)

#### Data Integrity
- **Referential Integrity**: CASCADE deletes for related records
- **Unique Constraints**: Prevent duplicate documents and users
- **Check Constraints**: Status values limited to allowed values

#### Security Considerations
- **Sensitive Data**: Passwords hashed before storage
- **API Keys**: Encrypted at rest (to be implemented)
- **PII Protection**: Email addresses indexed but not exposed in logs

---

## 4. API Endpoint Specifications

### 4.1 API Design Principles
- RESTful architecture
- JSON request/response format
- Standard HTTP status codes
- JWT-based authentication
- Rate limiting on all endpoints
- Input validation on all endpoints
- Comprehensive error handling

### 4.2 Base URL
```
Development: http://localhost:3000/api
Production: https://api.devlogix.online/api
```

### 4.3 Authentication Endpoints

#### 4.3.1 Register User
**Endpoint**: `POST /auth/register`  
**Authentication**: None  
**Rate Limit**: 5 requests per hour per IP

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "user"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2026-08-18T10:00:00Z"
    },
    "token": "jwt_token_here",
    "sessionId": "session_uuid"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input
- `409 Conflict`: Email already exists
- `429 Too Many Requests`: Rate limit exceeded

#### 4.3.2 Login User
**Endpoint**: `POST /auth/login`  
**Authentication**: None  
**Rate Limit**: 10 requests per minute per IP

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "jwt_token_here",
    "sessionId": "session_uuid",
    "expiresAt": "2026-08-25T10:00:00Z"
  }
}
```

#### 4.3.3 Logout User
**Endpoint**: `POST /auth/logout`  
**Authentication**: Required (JWT)  
**Rate Limit**: 30 requests per minute

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### 4.3.4 Refresh Token
**Endpoint**: `POST /auth/refresh`  
**Authentication**: Optional (refresh token)  
**Rate Limit**: 10 requests per minute

**Request Body**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresAt": "2026-08-25T10:00:00Z"
  }
}
```

### 4.4 Document Management Endpoints

#### 4.4.1 Create Document
**Endpoint**: `POST /documents`  
**Authentication**: Required (JWT, issuer role)  
**Rate Limit**: 20 requests per minute

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request Body**:
```json
{
  "documentTypeId": "document_type_uuid",
  "issuerId": "issuer_uuid",
  "recipientName": "Jane Smith",
  "recipientEmail": "jane@example.com",
  "title": "Internship Offer Letter",
  "description": "Internship offer for Software Engineer position",
  "referenceNumber": "DL-2026-001",
  "issuanceDate": "2026-08-18T10:00:00Z",
  "expiryDate": "2026-12-31T23:59:59Z",
  "metadata": {
    "position": "Software Engineer",
    "department": "Engineering",
    "salary": "75000",
    "startDate": "2026-09-01"
  }
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "document": {
      "id": "document_uuid",
      "qrCodeId": "cryptographic_qr_id",
      "title": "Internship Offer Letter",
      "referenceNumber": "DL-2026-001",
      "status": "active",
      "createdAt": "2026-08-18T10:00:00Z"
    },
    "qrCodeUrl": "https://api.devlogix.online/qr/cryptographic_qr_id"
  }
}
```

#### 4.4.2 Get Document by ID
**Endpoint**: `GET /documents/:id`  
**Authentication**: Required (JWT)  
**Rate Limit**: 30 requests per minute

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "document_uuid",
      "qrCodeId": "cryptographic_qr_id",
      "documentType": {
        "id": "type_uuid",
        "name": "Internship Offer"
      },
      "issuer": {
        "id": "issuer_uuid",
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
      "createdAt": "2026-08-18T10:00:00Z"
    }
  }
}
```

#### 4.4.3 Get All Documents (Paginated)
**Endpoint**: `GET /documents`  
**Authentication**: Required (JWT)  
**Rate Limit**: 30 requests per minute

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (active, revoked, expired)
- `documentTypeId`: Filter by document type
- `issuerId`: Filter by issuer

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "documents": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

#### 4.4.4 Update Document
**Endpoint**: `PUT /documents/:id`  
**Authentication**: Required (JWT, issuer or admin role)  
**Rate Limit**: 20 requests per minute

**Request Body**:
```json
{
  "status": "revoked",
  "description": "Updated description"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "document": { /* updated document object */ }
  }
}
```

#### 4.4.5 Delete Document
**Endpoint**: `DELETE /documents/:id`  
**Authentication**: Required (JWT, admin role)  
**Rate Limit**: 10 requests per minute

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### 4.5 Verification Endpoints

#### 4.5.1 Verify Document by QR Code
**Endpoint**: `POST /verify/qr-code`  
**Authentication**: None (public endpoint)  
**Rate Limit**: 100 requests per minute per IP

**Request Body**:
```json
{
  "qrCodeId": "cryptographic_qr_id"
}
```

**Response (200 OK) - Valid Document**:
```json
{
  "success": true,
  "verificationStatus": "valid",
  "data": {
    "document": {
      "documentType": "Internship Offer Letter",
      "title": "Software Engineer Internship",
      "issuer": {
        "name": "DevLogix",
        "designation": "HR Director",
        "logoUrl": "https://devlogix.online/logo.png"
      },
      "recipient": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "issuanceDate": "2026-08-15T00:00:00Z",
      "referenceNumber": "DL-2026-001",
      "status": "active"
    },
    "verifiedAt": "2026-08-18T13:30:00Z"
  }
}
```

**Response (200 OK) - Invalid Document**:
```json
{
  "success": false,
  "verificationStatus": "invalid",
  "message": "QR code not found or invalid",
  "errorCode": "QR_NOT_FOUND"
}
```

**Response (200 OK) - Expired Document**:
```json
{
  "success": false,
  "verificationStatus": "expired",
  "message": "Document has expired",
  "data": {
    "document": { /* document details */ },
    "expiredAt": "2026-12-31T23:59:59Z"
  }
}
```

**Response (200 OK) - Revoked Document**:
```json
{
  "success": false,
  "verificationStatus": "revoked",
  "message": "Document has been revoked by issuer",
  "data": {
    "document": { /* document details */ },
    "revokedAt": "2026-08-17T10:00:00Z"
  }
}
```

#### 4.5.2 Verify Document by Reference Number
**Endpoint**: `POST /verify/reference`  
**Authentication**: None (public endpoint)  
**Rate Limit**: 50 requests per minute per IP

**Request Body**:
```json
{
  "referenceNumber": "DL-2026-001"
}
```

**Response**: Same format as QR code verification

#### 4.5.3 Get Verification Logs
**Endpoint**: `GET /verify/logs`  
**Authentication**: Required (JWT, admin role)  
**Rate Limit**: 30 requests per minute

**Query Parameters**:
- `documentId`: Filter by document
- `qrCodeId`: Filter by QR code
- `status`: Filter by verification status
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `page`: Page number
- `limit`: Items per page

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_uuid",
        "documentId": "document_uuid",
        "qrCodeId": "cryptographic_qr_id",
        "verificationStatus": "valid",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2026-08-18T13:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

### 4.6 User Management Endpoints

#### 4.6.1 Get Current User Profile
**Endpoint**: `GET /users/profile`  
**Authentication**: Required (JWT)  
**Rate Limit**: 30 requests per minute

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2026-08-01T10:00:00Z"
    }
  }
}
```

#### 4.6.2 Update User Profile
**Endpoint**: `PUT /users/profile`  
**Authentication**: Required (JWT)  
**Rate Limit**: 20 requests per minute

**Request Body**:
```json
{
  "name": "John Updated Doe"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

#### 4.6.3 Get User Sessions
**Endpoint**: `GET /users/sessions`  
**Authentication**: Required (JWT)  
**Rate Limit**: 30 requests per minute

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_uuid",
        "deviceId": "device_identifier",
        "userAgent": "Mozilla/5.0...",
        "lastActiveAt": "2026-08-18T13:30:00Z",
        "expiresAt": "2026-08-25T10:00:00Z"
      }
    ]
  }
}
```

### 4.7 Document Type Management Endpoints

#### 4.7.1 Get All Document Types
**Endpoint**: `GET /document-types`  
**Authentication**: Required (JWT)  
**Rate Limit**: 30 requests per minute

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "documentTypes": [
      {
        "id": "type_uuid",
        "name": "Internship Offer",
        "description": "Internship offer letters",
        "isActive": true
      }
    ]
  }
}
```

#### 4.7.2 Create Document Type
**Endpoint**: `POST /document-types`  
**Authentication**: Required (JWT, admin role)  
**Rate Limit**: 10 requests per minute

**Request Body**:
```json
{
  "name": "Certificate of Completion",
  "description": "Course completion certificates",
  "template": { /* template configuration */ }
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Document type created successfully",
  "data": {
    "documentType": { /* created document type */ }
  }
}
```

### 4.8 Issuer Management Endpoints

#### 4.8.1 Get All Issuers
**Endpoint**: `GET /issuers`  
**Authentication**: Required (JWT)  
**Rate Limit**: 30 requests per minute

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "issuers": [
      {
        "id": "issuer_uuid",
        "name": "DevLogix",
        "email": "info@devlogix.online",
        "logoUrl": "https://devlogix.online/logo.png",
        "isActive": true
      }
    ]
  }
}
```

#### 4.8.2 Create Issuer
**Endpoint**: `POST /issuers`  
**Authentication**: Required (JWT, admin role)  
**Rate Limit**: 10 requests per minute

**Request Body**:
```json
{
  "name": "DevLogix",
  "email": "info@devlogix.online",
  "logoUrl": "https://devlogix.online/logo.png"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Issuer created successfully",
  "data": {
    "issuer": {
      "id": "issuer_uuid",
      "name": "DevLogix",
      "email": "info@devlogix.online",
      "apiKey": "generated_api_key",
      "isActive": true
    }
  }
}
```

---

## 5. Security Specifications

### 5.1 Authentication & Authorization

#### 5.1.1 JWT Implementation
- **Algorithm**: RS256 (RSA Signature with SHA-256)
- **Token Expiration**: 7 days (configurable)
- **Token Structure**:
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "user_uuid",
    "email": "user@example.com",
    "role": "user",
    "sessionId": "session_uuid",
    "iat": 1692355200,
    "exp": 1692959999
  }
}
```

#### 5.1.2 Password Security
- **Hashing Algorithm**: bcryptjs
- **Salt Rounds**: 12
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

#### 5.1.3 Session Management
- **Device-based Sessions**: One session per device/browser
- **Session Duration**: 7 days (configurable)
- **Session Storage**: Database with JWT token
- **Session Refresh**: Automatic token refresh within valid session
- **Session Revocation**: Immediate invalidation on logout

### 5.2 API Security

#### 5.2.1 Rate Limiting
- **Authentication Endpoints**: 5-10 requests per minute
- **Document Creation**: 20 requests per minute
- **Verification Endpoints**: 100 requests per minute (public)
- **General Endpoints**: 30 requests per minute
- **Rate Limit Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

#### 5.2.2 Input Validation
- **Schema Validation**: All inputs validated against schemas
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Prevention**: Input sanitization and output encoding
- **CSRF Protection**: Token-based CSRF protection (to be implemented)

#### 5.2.3 Transport Security
- **HTTPS Required**: All endpoints require HTTPS in production
- **TLS Version**: TLS 1.2 or higher
- **HSTS**: HTTP Strict Transport Security enabled
- **Certificate**: Valid SSL certificate

#### 5.2.4 Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### 5.3 Data Security

#### 5.3.1 Data Encryption
- **Passwords**: Hashed with bcryptjs
- **API Keys**: Encrypted at rest (AES-256)
- **Sensitive PII**: Encrypted in database (to be implemented)
- **QR Code IDs**: Cryptographically generated

#### 5.3.2 Data Privacy
- **GDPR Compliance**: Right to erasure, data portability
- **Data Minimization**: Only collect necessary data
- **Consent Management**: User consent for data processing
- **Data Retention**: Configurable retention policies

#### 5.3.3 Audit Logging
- **Authentication Events**: Login, logout, failed attempts
- **Document Operations**: Create, update, delete, verify
- **Admin Actions**: All administrative operations
- **Security Events**: Rate limit violations, suspicious activities

### 5.4 Access Control

#### 5.4.1 Role-Based Access Control (RBAC)
- **Admin**: Full system access
- **Issuer**: Create and manage documents
- **Verifier**: View verification logs
- **User**: Basic access, verify documents

#### 5.4.2 Permission Matrix
| Endpoint | Admin | Issuer | Verifier | User | Public |
|----------|-------|--------|----------|------|--------|
| POST /auth/register | ✓ | - | - | ✓ | - |
| POST /auth/login | ✓ | ✓ | ✓ | ✓ | - |
| POST /documents | ✓ | ✓ | - | - | - |
| GET /documents/:id | ✓ | ✓ | ✓ | Own | - |
| POST /verify/qr-code | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /verify/logs | ✓ | - | ✓ | - | - |
| POST /issuers | ✓ | - | - | - | - |

---

## 6. Integration Points

### 6.1 Backend Squad B Integration
Backend Squad A provides the following integration points for Backend Squad B (Communications & Generation):

#### 6.1.1 QR Code Generation Hook
- **Endpoint**: `POST /documents` ( Squad A)
- **Trigger**: After document creation
- **Data**: Document ID, QR code ID
- **Purpose**: Trigger QR code generation by Squad B

#### 6.1.2 Notification Hook
- **Endpoint**: `POST /documents` (Squad A)
- **Trigger**: After document creation
- **Data**: Recipient email, document details
- **Purpose**: Trigger email notification by Squad B

#### 6.1.3 API Key Validation
- **Service**: Shared validation service
- **Purpose**: Validate issuer API keys for document generation
- **Implementation**: Squad A provides validation, Squad B consumes

### 6.2 Frontend Integration
#### 6.2.1 API Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.devlogix.online/api`

#### 6.2.2 Authentication Flow
1. Frontend sends login credentials to `POST /auth/login`
2. Backend returns JWT token and session info
3. Frontend stores token in secure storage
4. Frontend includes token in Authorization header for protected endpoints

#### 6.2.3 Verification Flow
1. Frontend captures QR code (scan/upload)
2. Frontend extracts QR code ID
3. Frontend sends QR code ID to `POST /verify/qr-code`
4. Backend returns verification result with document details
5. Frontend displays verification result

### 6.3 Supabase Integration
#### 6.3.1 Database Connection
- **Provider**: Supabase PostgreSQL
- **Connection**: Via Prisma ORM
- **Pooling**: Connection pooling configured
- **Backup**: Automated daily backups via Supabase

#### 6.3.2 Real-time Features (Future)
- **Real-time Updates**: Document status changes
- **Webhooks**: Notification triggers
- **Subscriptions**: Live verification feed

---

## 7. Performance Requirements

### 7.1 Response Time Targets
- **Authentication Endpoints**: < 500ms (95th percentile)
- **Document Creation**: < 1000ms (95th percentile)
- **Document Retrieval**: < 300ms (95th percentile)
- **QR Code Verification**: < 200ms (95th percentile)
- **Batch Operations**: < 2000ms (95th percentile)

### 7.2 Throughput Targets
- **Concurrent Users**: 1000+ concurrent users
- **Requests Per Second**: 500+ RPS
- **Database Connections**: 20+ concurrent connections
- **Document Creation**: 50+ documents per minute
- **Verifications**: 500+ verifications per minute

### 7.3 Scalability Requirements
- **Horizontal Scaling**: Stateless application servers
- **Database Scaling**: Read replicas for query performance
- **Caching**: Redis for session storage and frequently accessed data
- **Load Balancing**: Round-robin or least-connections

### 7.4 Caching Strategy
- **Session Data**: Redis cache with 7-day TTL
- **Document Types**: Redis cache with 1-hour TTL
- **Issuer Information**: Redis cache with 1-hour TTL
- **Verification Results**: Redis cache with 5-minute TTL
- **Cache Invalidation**: Automatic on data updates

---

## 8. Error Handling & Logging

### 8.1 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field that caused error",
      "value": "Invalid value provided"
    },
    "timestamp": "2026-08-18T13:30:00Z",
    "path": "/api/documents"
  }
}
```

### 8.2 HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (duplicate)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### 8.3 Error Codes
| Code | Description | HTTP Status |
|------|-------------|-------------|
| AUTH_INVALID_CREDENTIALS | Invalid email or password | 401 |
| AUTH_TOKEN_EXPIRED | JWT token has expired | 401 |
| AUTH_INSUFFICIENT_PERMISSIONS | User lacks required permissions | 403 |
| VALIDATION_INVALID_INPUT | Input validation failed | 422 |
| VALIDATION_DUPLICATE_EMAIL | Email already exists | 409 |
| DOCUMENT_NOT_FOUND | Document not found | 404 |
| DOCUMENT_QR_NOT_FOUND | QR code not found | 404 |
| DOCUMENT_EXPIRED | Document has expired | 400 |
| DOCUMENT_REVOKED | Document has been revoked | 400 |
| RATE_LIMIT_EXCEEDED | Rate limit exceeded | 429 |
| DATABASE_ERROR | Database operation failed | 500 |
| INTERNAL_ERROR | Internal server error | 500 |

### 8.4 Logging Strategy
#### 8.4.1 Log Levels
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning messages for potential issues
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information (development only)

#### 8.4.2 Log Content
- **Request Logs**: HTTP method, path, status code, response time
- **Error Logs**: Error stack traces, request context
- **Security Logs**: Authentication attempts, authorization failures
- **Audit Logs**: Document operations, verification attempts
- **Performance Logs**: Database query times, API response times

#### 8.4.3 Log Storage
- **Development**: Console output + local files
- **Production**: Cloud logging service (e.g., CloudWatch, Loggly)
- **Retention**: 30 days for production logs
- **PII Redaction**: Sensitive data redacted from logs

---

## 9. Testing Strategy

### 9.1 Unit Testing
- **Framework**: Jest or Mocha/Chai
- **Coverage Target**: 80%+ code coverage
- **Test Scope**: Individual functions and methods
- **Mocking**: External dependencies mocked

### 9.2 Integration Testing
- **Framework**: Supertest
- **Test Scope**: API endpoints with database
- **Database**: Test database with seed data
- **Cleanup**: Database cleanup after each test

### 9.3 End-to-End Testing
- **Framework**: Cypress or Playwright
- **Test Scope**: Complete user flows
- **Environment**: Staging environment
- **Scenarios**: Authentication, document creation, verification

### 9.4 Performance Testing
- **Tools**: Apache JMeter, k6
- **Test Types**: Load testing, stress testing
- **Metrics**: Response time, throughput, error rate
- **Targets**: Meet performance requirements

### 9.5 Security Testing
- **Tools**: OWASP ZAP, Burp Suite
- **Test Types**: Vulnerability scanning, penetration testing
- **Scope**: Authentication, authorization, input validation
- **Frequency**: Before major releases

---

## 10. Deployment Strategy

### 10.1 Development Environment
- **Platform**: Local development with Docker
- **Database**: Local PostgreSQL or Supabase dev instance
- **Monitoring**: Console logs and basic metrics
- **Deployment**: Manual restarts

### 10.2 Staging Environment
- **Platform**: Cloud platform (AWS/GCP/Azure)
- **Database**: Supabase staging instance
- **Monitoring**: Application performance monitoring
- **Deployment**: CI/CD pipeline

### 10.3 Production Environment
- **Platform**: Cloud platform with auto-scaling
- **Database**: Supabase production with read replicas
- **Monitoring**: Comprehensive monitoring and alerting
- **Deployment**: Blue-green deployment or canary releases

### 10.4 CI/CD Pipeline
- **Source Control**: Git with feature branches
- **CI Tool**: GitHub Actions or GitLab CI
- **Build Steps**: Install dependencies, run tests, build application
- **Deployment Steps**: Deploy to staging, run integration tests, deploy to production
- **Rollback**: Automatic rollback on deployment failure

---

## 11. Monitoring & Maintenance

### 11.1 Application Monitoring
- **Metrics**: Request rate, response time, error rate
- **Dashboard**: Real-time monitoring dashboard
- **Alerting**: Critical error alerts via email/Slack
- **Tools**: New Relic, Datadog, or Prometheus

### 11.2 Database Monitoring
- **Metrics**: Query performance, connection pool, storage usage
- **Monitoring**: Supabase dashboard
- **Alerting**: Database performance alerts
- **Optimization**: Regular query optimization

### 11.3 Security Monitoring
- **Metrics**: Failed authentication attempts, rate limit violations
- **Alerting**: Suspicious activity alerts
- **Audit**: Regular security audits
- **Compliance**: Compliance monitoring

### 11.4 Maintenance Tasks
- **Daily**: Log review, error monitoring
- **Weekly**: Performance review, security updates
- **Monthly**: Database optimization, backup verification
- **Quarterly**: Security audit, dependency updates

---

## 12. Future Enhancements

### 12.1 Phase 2 Features
- **Batch Document Generation**: Generate multiple documents at once
- **Document Templates**: Customizable document templates
- **Advanced Analytics**: Verification analytics and reporting
- **Multi-language Support**: Support for multiple languages
- **Mobile API**: Optimized API for mobile applications

### 12.2 Phase 3 Features
- **Blockchain Integration**: Blockchain-based document verification
- **Digital Signatures**: Advanced digital signature support
- **OCR Integration**: Text extraction from scanned documents
- **AI-powered Fraud Detection**: Machine learning for fraud detection
- **Integration Hub**: Third-party system integrations

---

## 13. Compliance & Legal

### 13.1 Data Protection
- **GDPR**: Compliance with EU data protection regulations
- **CCPA**: Compliance with California Consumer Privacy Act
- **Data Residency**: Data stored in compliant regions
- **Data Processing**: Lawful basis for data processing

### 13.2 Security Standards
- **ISO 27001**: Information security management
- **SOC 2**: Service organization controls
- **PCI DSS**: Payment card industry compliance (if applicable)
- **HIPAA**: Healthcare compliance (if applicable)

### 13.3 Audit Requirements
- **Audit Logs**: Complete audit trail for all operations
- **Access Logs**: Detailed access logging
- **Change Logs**: Track all system changes
- **Compliance Reports**: Regular compliance reporting

---

## 14. Documentation Requirements

### 14.1 API Documentation
- **Tool**: Swagger/OpenAPI Specification
- **Format**: Interactive API documentation
- **Content**: All endpoints, request/response formats, error codes
- **Updates**: Keep documentation synchronized with API changes

### 14.2 Code Documentation
- **Comments**: JSDoc for JavaScript functions
- **README**: Project setup and usage instructions
- **Architecture Documentation**: System architecture diagrams
- **Database Documentation**: Schema documentation

### 14.3 User Documentation
- **User Guide**: End-user documentation
- **Admin Guide**: Administrator documentation
- **API Guide**: Developer API guide
- **Troubleshooting**: Common issues and solutions

---
