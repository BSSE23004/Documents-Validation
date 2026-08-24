# Core Backend - Secure Delivery & Verification System

Backend Squad A (Core Architecture & Security) implementation for the Secure Delivery & Verification System.

## ✅ Implementation Status

### Complete ✅
- **System Architecture**: MVC pattern with Express.js
- **Database Schema**: PostgreSQL via Supabase with Prisma ORM
- **JWT Authentication**: Complete with device-based session management
- **Token Rotation**: Refresh token system with rotation
- **Session Management**: One session per device with automatic cleanup
- **API Endpoints**: All core endpoints implemented and tested
- **Security Features**: Password hashing, rate limiting, CORS, security headers
- **Error Handling**: Centralized error handling with consistent format
- **Supabase Integration**: Successfully connected and synchronized

### Server Status
- **Development Server**: ✅ Running on http://localhost:3000
- **Database**: ✅ Connected to Supabase PostgreSQL
- **Health Check**: ✅ http://localhost:3000/health
- **API Base**: ✅ http://localhost:3000/api

## Overview

This backend provides the core API for the digital asset verification engine, supporting QR-coded, cryptographically verified documents, certificates, and project handoffs.

## Technology Stack

- **Runtime**: Node.js (LTS)
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma 5.x
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Winston

## Architecture

The project follows MVC architecture pattern:

```
core-backend/
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Data models (Prisma-based)
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic
│   └── app.js              # Express app configuration
├── prisma/
│   └── schema.prisma       # Database schema
├── tests/                  # Test files
├── server.js               # Entry point
├── package.json
└── .env.example            # Environment variables template
```

## Database Schema

The system includes the following main entities:

- **User**: Authentication and authorization with role-based access control
- **Session**: Device-based session management with JWT tokens
- **Issuer**: Organizations that issue documents
- **DocumentType**: Categories of verifiable documents
- **Document**: Core document/certificate management with QR codes
- **VerificationLog**: Verification tracking and audit logging

## API Endpoints

### Authentication ✅
- `POST /api/auth/register` - Register new user with validation
- `POST /api/auth/login` - Login with device-based session creation
- `POST /api/auth/logout` - Logout from current session
- `POST /api/auth/logout-all` - Logout from all devices
- `POST /api/auth/refresh` - Token refresh with rotation
- `GET /api/auth/sessions` - Get all user sessions
- `DELETE /api/auth/sessions/:sessionId` - Revoke specific session

### Documents
- `POST /api/documents` - Create document
- `GET /api/documents` - Get all documents (paginated)
- `GET /api/documents/:id` - Get document by ID
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Verification ✅
- `POST /api/verify/qr-code` - Verify document by QR code (public)
- `POST /api/verify/reference` - Verify document by reference number (public)
- `GET /api/verify/logs` - Get verification logs (admin/verifier)

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

### Issuers
- `GET /api/issuers` - Get all issuers
- `POST /api/issuers` - Create issuer (admin)

### Document Types
- `GET /api/document-types` - Get all document types
- `POST /api/document-types` - Create document type (admin)

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase)
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd core-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- Other configuration values as needed

4. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (for initial setup)
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Development Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Security Features ✅

- **JWT Authentication**: Complete implementation with device-based sessions
- **Token Rotation**: Refresh token system for enhanced security
- **Password Security**: bcryptjs hashing with 12 salt rounds
- **Password Validation**: Strong password requirements
- **Session Management**: One session per device with automatic cleanup
- **Rate Limiting**: Configurable per-endpoint limits
- **CORS Configuration**: Configured for frontend integration
- **Security Headers**: Helmet.js for comprehensive security
- **Input Validation**: express-validator integration
- **SQL Injection Prevention**: Parameterized queries via Prisma

## API Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... },
    "timestamp": "2026-08-20T10:00:00Z",
    "path": "/api/endpoint"
  }
}
```

## Frontend Integration

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.devlogix.online/api`

### Authentication Flow ✅
1. Frontend sends credentials to `POST /api/auth/login`
2. Backend returns JWT token, refresh token, and session info
3. Frontend stores tokens securely
4. Frontend includes JWT token in `Authorization: Bearer <token>` header
5. Backend validates token against database session
6. Token refresh implemented for extended sessions

### Verification Flow ✅
1. Frontend captures QR code
2. Frontend sends QR code ID to `POST /api/verify/qr-code`
3. Backend returns verification result with document details
4. Frontend displays verification result

## Testing ✅

All core functionality has been tested:

- ✅ User registration with validation
- ✅ User login with session creation
- ✅ JWT authentication middleware
- ✅ Token refresh with rotation
- ✅ Session management and retrieval
- ✅ Logout functionality
- ✅ Protected endpoint access
- ✅ Public verification endpoints
- ✅ Database connectivity with Supabase

## Recent Implementation Updates

### JWT Code Refactoring (Complete) ✅
- Extracted JWT-related code from authService.js to dedicated config/jwt.js module
- Reduced authService.js from 447 to 412 lines for better navigation
- Centralized JWT logic for improved maintainability
- Added utility functions for JWT operations (decode, expiration checking, validation)
- Maintained 100% backward compatibility
- All authentication functionality tested and working

### JWT Authentication System (Complete)
- Implemented comprehensive JWT authentication with device-based session management
- Added token rotation system for enhanced security
- Integrated with Supabase PostgreSQL database
- Implemented session limits and automatic cleanup
- Added comprehensive error handling and validation

### Database Integration (Complete)
- Successfully connected to Supabase PostgreSQL
- Synchronized Prisma schema with database
- Implemented proper relationships and constraints
- Added database indexes for performance optimization

## Documentation

- [BACKEND_SETUP_SUMMARY.md](./BACKEND_SETUP_SUMMARY.md) - Initial setup summary
- [AUTHENTICATION_IMPLEMENTATION_COMPLETE.md](./AUTHENTICATION_IMPLEMENTATION_COMPLETE.md) - Authentication implementation details
- [JWT_REFACTORING_COMPLETE.md](./JWT_REFACTORING_COMPLETE.md) - JWT code refactoring details

## License

ISC

## Team

Backend Squad A (Core Architecture & Security)