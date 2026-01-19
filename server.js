/**
 * server.js
 * Production-ready for:
 * - AWS ECS Fargate
 * - Prisma + PostgreSQL (RDS)
 * - Secrets Manager / ECS env vars
 */

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

const requiredEnv = [
  'DB_USER',
  'DB_PASSWORD',
  'DB_HOST',
  'DB_NAME',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const dbUser = encodeURIComponent(process.env.DB_USER);
const dbPass = encodeURIComponent(process.env.DB_PASSWORD);
const dbHost = process.env.DB_HOST;          // RDS endpoint
const dbPort = process.env.DB_PORT || 5432;
const dbName = process.env.DB_NAME;

const databaseUrl =
  `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?sslmode=require`;

const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await prisma.$executeRawUnsafe('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({ status: 'error' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running 🚀' });
});


const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


const shutdown = async (signal) => {
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);