import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { beforeEach, afterAll } from 'vitest';

// Use a separate test database
const TEST_DB_PATH = path.join(__dirname, '..', 'prisma', 'test.db');
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;
process.env.JWT_SECRET = 'test-secret-key';

// Apply migrations to test DB
execSync('npx prisma migrate deploy', {
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
  stdio: 'pipe',
});

const testPrisma = new PrismaClient({
  datasources: { db: { url: `file:${TEST_DB_PATH}` } },
});

// Clean all tables before each test
beforeEach(async () => {
  await testPrisma.captionLog.deleteMany();
  await testPrisma.sessionMember.deleteMany();
  await testPrisma.session.deleteMany();
  await testPrisma.user.deleteMany();
});

// Disconnect after all tests
afterAll(async () => {
  await testPrisma.$disconnect();
});

export { testPrisma };
