# Secure Delivery & Verification System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue.svg)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748.svg)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

A robust, enterprise-grade digital asset verification engine designed to issue and verify QR-coded, cryptographically authenticated documents, certificates, and project handoffs.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Database Migration & Seeding](#database-migration--seeding)
  - [Running the Application](#running-the-application)
- [API Overview](#-api-overview)
- [Testing](#-testing)
- [Docker Support](#-docker-support)
- [Security & Best Practices](#-security--best-practices)

---

## 🌟 Overview

The **Secure Delivery & Verification System** provides instant, tamper-evident verification of documents and certificates. Using cryptographic references and unique QR codes, verifiers and clients can inspect and authenticate issued digital assets against a centralized, secure verification ledger.

---

## ✨ Key Features

- **🔐 Cryptographic Verification**: Instant public verification via QR code scanning or unique reference ID lookups.
- **🛡️ Secure Authentication & Device Sessions**: JWT authentication featuring multi-device session management, token rotation, and single/all-device logout capabilities.
- **👥 Role-Based Access Control (RBAC)**: Fine-grained permissions for administrators, issuers, and verifiers.
- **📄 Complete Document Lifecycle**: Support for creating, managing, categorizing, and auditing verifiable digital documents.
- **📊 Comprehensive Audit & Verification Logs**: Tracking verification attempts, client metadata, timestamps, and IP addresses.
- **⚡ High Performance & Security**: Built-in rate limiting, security headers via Helmet, CORS policies, and centralized structured logging with Winston.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client / Frontend                      │
│                  (Web / Mobile / QR Scanner)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    API Gateway & Security                   │
│        (Express.js, Rate Limiting, Helmet, CORS)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     Core Business Logic                     │
│  ┌─────────────────────────┐     ┌───────────────────────┐  │
│  │   Auth & Session Svc    │     │   Document Service    │  │
│  └─────────────────────────┘     └───────────────────────┘  │
│  ┌─────────────────────────┐     ┌───────────────────────┐  │
│  │   Verification Service  │     │   User & Issuer Svc   │  │
│  └─────────────────────────┘     └───────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      Data Access Layer                      │
│                        (Prisma ORM)                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                       Database Layer                        │
│                   (Supabase / PostgreSQL)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

- **Runtime Environment:** Node.js (>= 18.0.0)
- **Web Framework:** Express.js (4.x)
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma (5.x)
- **Authentication & Security:** JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `express-rate-limit`, `cors`
- **Validation:** `express-validator`
- **Logging:** Winston
- **Testing:** Jest, Supertest

---

## 📁 Repository Structure

```
Documents-Validation/
├── core-backend/                   # Core backend application
│   ├── prisma/                     # Database schema & Prisma migrations
│   │   └── schema.prisma           # Prisma schema definitions
│   ├── src/
│   │   ├── config/                 # Environment & app configurations
│   │   ├── controllers/            # API route controllers
│   │   ├── middleware/             # Auth, error handling, validation middleware
│   │   ├── models/                 # Data models & schemas
│   │   ├── routes/                 # API route declarations
│   │   ├── services/               # Core business logic services
│   │   ├── tests/                  # Unit, integration, and live tests
│   │   └── app.js                  # Express app setup
│   ├── postman/                    # Postman collection & environment files
│   ├── Dockerfile                  # Container definition
│   ├── docker-compose.yaml         # Multi-container orchestration
│   ├── seed.js                     # Database seeder script
│   ├── server.js                   # Application entry point
│   ├── package.json                # Dependencies and scripts
│   └── .env.example                # Example environment variables
├── TECHNICAL_SPECIFICATION.md      # Detailed technical specification
└── README.md                       # Root documentation
```

---

## 🗄️ Database Schema

The system core entities modeled in Prisma include:

- **`User`**: System accounts (Admin, Issuer, Verifier) with hashed credentials and profile data.
- **`Session`**: Tracks active devices, refresh tokens, IP addresses, user agents, and expiry.
- **`Issuer`**: Organizations or entities authorized to issue verifiable credentials.
- **`DocumentType`**: Classification and templates for issued certificates/documents.
- **`Document`**: Core verifiable records holding metadata, cryptographic hashes, QR payload, and status.
- **`VerificationLog`**: Immutable history of all verification lookups and scanner metadata.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** instance (or free Supabase project)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BSSE23004/Documents-Validation.git
   cd core-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your values:
  

### Database Migration & Seeding

1. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Push schema to database (or run migrations):**
   ```bash
   npm run prisma:migrate
   # or npx prisma db push
   ```

3. **(Optional) Seed initial data:**
   ```bash
   npm run seed
   ```

### Running the Application

- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```
- **Prisma Studio (Database GUI):**
  ```bash
  npm run prisma:studio
  ```

The server will be available at `http://localhost:3000`.

---

## 🔌 API Overview

### Base URL: `/api`

| Module | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **Health** | `GET` | `/health` | Public | System status and database connectivity |
| **Auth** | `POST` | `/api/auth/register` | Public | Register a new user |
| | `POST` | `/api/auth/login` | Public | Login & establish device session |
| | `POST` | `/api/auth/refresh` | Public | Rotate and refresh access token |
| | `POST` | `/api/auth/logout` | Authenticated | Logout active session |
| | `POST` | `/api/auth/logout-all`| Authenticated | Revoke all user sessions |
| | `GET` | `/api/auth/sessions` | Authenticated | List all active sessions |
| **Verification** | `POST` | `/api/verify/qr-code` | Public | Verify document via QR code payload |
| | `POST` | `/api/verify/reference` | Public | Verify document via reference ID |
| | `GET` | `/api/verify/logs` | Admin / Verifier | Retrieve verification audit logs |
| **Documents** | `GET` | `/api/documents` | Authenticated | List documents (paginated & filtered) |
| | `POST` | `/api/documents` | Issuer / Admin | Issue a new verifiable document |
| | `GET` | `/api/documents/:id` | Authenticated | Retrieve document by ID |
| | `PUT` | `/api/documents/:id` | Admin | Update document record |
| | `DELETE`| `/api/documents/:id` | Admin | Revoke / delete document |
| **Issuers & Types**| `GET` | `/api/issuers` | Authenticated | List registered issuers |
| | `POST` | `/api/issuers` | Admin | Register a new issuer |
| | `GET` | `/api/document-types` | Authenticated | List supported document types |
| | `POST` | `/api/document-types` | Admin | Add new document type |

---

## 🧪 Testing

Run test suites using Jest:

```bash
# Run unit and integration tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run live end-to-end tests
npm run test:live
```

---

## 🐳 Docker Support

The application can be run using Docker and Docker Compose. The Docker setup runs the Node.js/Express backend in a container while using a PostgreSQL database hosted on **Supabase**.

Each developer should create their **own Supabase PostgreSQL database** 

### Prerequisites

Make sure you have:

* **Docker Desktop** installed and running

### Docker Setup

#### 1. Clone the repository

```bash
git clone https://github.com/BSSE23004/Documents-Validation.git
cd core-backend
```

#### 2. Create your own Supabase project

1. Go to [Supabase](https://supabase.com/) and sign in.
2. Create a new project.
3. Wait for the project database to finish provisioning.
4. Open your project in the Supabase dashboard.
5. Navigate to **Connect** and obtain your PostgreSQL connection string.
6. Use the appropriate connection string for your environment. The **Session Pooler** connection is recommended when a direct database connection is not suitable.

#### 3. Create your environment file

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and configure the required values.

At minimum, update:

```env
DATABASE_URL="your_supabase_postgresql_connection_string"
JWT_SECRET="your_own_secure_jwt_secret"
```

#### 4. Build and start the application

From the `core-backend` directory, run:

```bash
docker compose up --build
```

The API will be available at:

```text
http://localhost:3000
```

The health-check endpoint is:

```text
http://localhost:3000/health
```


### Important Notes

* Docker does **not** create the PostgreSQL database itself; PostgreSQL is hosted by your Supabase project.
* The application container connects to Supabase using the `DATABASE_URL` provided in `.env`.


---

## 🔒 Security & Best Practices

- **Password Hashing:** Passwords encrypted using `bcryptjs` with salt rounds set via configuration.
- **Session Protection:** Refresh token rotation prevents token theft and replay attacks.
- **Rate Limiting:** Protects endpoints against brute-force and DDoS attacks.
- **Headers & CORS:** Sanitized via `helmet` and restrictive origin policies.
- **Input Validation:** Request bodies and parameters validated with `express-validator`.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).