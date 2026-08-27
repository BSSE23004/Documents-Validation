import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Test database connection
export const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.warn('⚠️  Database connection warning:', error.message || error);
    console.warn('💡 Please ensure DATABASE_URL in .env is configured with your Supabase PostgreSQL connection string.');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Graceful shutdown
export const gracefulShutdown = async () => {
  await prisma.$disconnect();
  console.log('Database connection closed');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default prisma;