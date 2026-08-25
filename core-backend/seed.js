// seed.js
require('dotenv').config(); // optional
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. Create sample users
    const user1 = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: await bcrypt.hash('admin123', 12),
            name: 'Admin User',
            role: 'admin',
            isActive: true,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            password: await bcrypt.hash('user123', 12),
            name: 'Regular User',
            role: 'user',
            isActive: true,
        },
    });

    console.log('Created users:', user1.id, user2.id);

    // 2. Create sample sessions
    const session1 = await prisma.session.upsert({
        where: { token: 'jwt-token-1' },
        update: {},
        create: {
            userId: user1.id,
            deviceId: 'device-uuid-1',
            token: 'jwt-token-1',
            refreshToken: 'refresh-token-1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
            ipAddress: '192.168.1.10',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
        },
    });

    const session2 = await prisma.session.upsert({
        where: { token: 'jwt-token-2' },
        update: {},
        create: {
            userId: user2.id,
            deviceId: 'device-uuid-2',
            token: 'jwt-token-2',
            refreshToken: 'refresh-token-2',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            ipAddress: '10.0.0.5',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
        },
    });

    console.log('Created sessions:', session1.id, session2.id);

    // 3. (Optional) Create other models if they exist
    // await prisma.document.create({ data: { ... } });

    console.log('Seed completed.');
    await prisma.$disconnect();
}

main()
    .catch(e => {
        console.error('Error during seeding:', e);
        process.exit(1);
    });