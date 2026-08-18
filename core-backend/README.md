# Core Backend - Secure Delivery & Verification System

Backend Squad A (Core Architecture & Security) implementation for the Secure Delivery & Verification System.

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

- **User**: Authentication and authorization
- **Session**: Device-based session management
- **Issuer**: Organizations that issue documents
- **DocumentType**: Categories of verifiable documents
- **Document**: Core document/certificate management
- **VerificationLog**: Verification tracking and audit logging

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh token

### Documents
- `POST /api/documents` - Create document
- `GET /api/documents` - Get all documents (paginated)
- `GET /api/documents/:id` - Get document by ID
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Verification
- `POST /api/verify/qr-code` - Verify document by QR code (public)
- `POST /api/verify/reference` - Verify document by reference number (public)
- `GET /api/verify/logs` - Get verification logs (admin/verifier)

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/sessions` - Get user sessions

### Issuers
- `GET /api/issuers` - Get all issuers
- `POST /api/issuers` - Create issuer (admin)

### Document Types
- `GET /api/document-types` - Get all document types
- `POST /api/document-types` - Create document type (admin)

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
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
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- Other configuration values as needed

4. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
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

## Security Features

- JWT-based authentication with device-based sessions
- Password hashing with bcryptjs
- Rate limiting for API endpoints
- CORS configuration
- Security headers (Helmet)
- Input validation
- SQL injection prevention (via Prisma)

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
    "timestamp": "2026-08-18T10:00:00Z",
    "path": "/api/endpoint"
  }
}
```

## Frontend Integration

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.devlogix.online/api`

### Authentication Flow
1. Frontend sends credentials to `POST /api/auth/login`
2. Backend returns JWT token and session info
3. Frontend includes token in `Authorization: Bearer <token>` header
4. Protected endpoints validate the token

### Verification Flow
1. Frontend captures QR code
2. Frontend sends QR code ID to `POST /api/verify/qr-code`
3. Backend returns verification result with document details
4. Frontend displays verification result

## Testing

The project includes unit and integration tests. Run tests with:

```bash
npm test
```

## License

ISC

## Team

Backend Squad A (Core Architecture & Security)