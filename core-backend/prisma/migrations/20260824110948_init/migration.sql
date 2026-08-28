-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issuers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "logoUrl" TEXT,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issuers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "referenceNumber" TEXT NOT NULL,
    "issuanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_logs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,

    CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_deviceId_idx" ON "sessions"("deviceId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_userId_deviceId_key" ON "sessions"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "issuers_email_key" ON "issuers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "issuers_apiKey_key" ON "issuers"("apiKey");

-- CreateIndex
CREATE INDEX "issuers_email_idx" ON "issuers"("email");

-- CreateIndex
CREATE INDEX "issuers_apiKey_idx" ON "issuers"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE INDEX "document_types_name_idx" ON "document_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "documents_qrCodeId_key" ON "documents"("qrCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_referenceNumber_key" ON "documents"("referenceNumber");

-- CreateIndex
CREATE INDEX "documents_documentTypeId_idx" ON "documents"("documentTypeId");

-- CreateIndex
CREATE INDEX "documents_issuerId_idx" ON "documents"("issuerId");

-- CreateIndex
CREATE INDEX "documents_createdById_idx" ON "documents"("createdById");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_expiryDate_idx" ON "documents"("expiryDate");

-- CreateIndex
CREATE INDEX "verification_logs_documentId_idx" ON "verification_logs"("documentId");

-- CreateIndex
CREATE INDEX "verification_logs_qrCodeId_idx" ON "verification_logs"("qrCodeId");

-- CreateIndex
CREATE INDEX "verification_logs_verificationStatus_idx" ON "verification_logs"("verificationStatus");

-- CreateIndex
CREATE INDEX "verification_logs_timestamp_idx" ON "verification_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "issuers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
