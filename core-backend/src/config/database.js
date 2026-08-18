const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test database connection
const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  await prisma.$disconnect();
  console.log('Database connection closed');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = { prisma, testConnection };