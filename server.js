/**
 * server.js
 * Clean production setup for:
 * - AWS ECS Fargate
 * - Prisma + PostgreSQL (RDS)
 */

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const http = require('http');
const { PrismaClient } = require('@prisma/client');

/**
 * Validate required environment variables
 */
const requiredEnv = [
  'DB_USER',
  'DB_PASSWORD',
  'DB_HOST',
  'DB_NAME',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
}

/**
 * Build database connection URL
 */
const dbUser = encodeURIComponent(process.env.DB_USER);
const dbPass = encodeURIComponent(process.env.DB_PASSWORD);
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT || 5432;
const dbName = process.env.DB_NAME;

const databaseUrl = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;

/**
 * Prisma client (lazy connection)
 */
const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

/**
 * Express app
 */
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running 🚀' });
});

/**
 * HTTP server
 */
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

/**
 * Graceful shutdown (ECS rolling deployments)
 */
const shutdown = async (signal) => {
  console.log(`🛑 Received ${signal}. Shutting down...`);
  try {
    await prisma.$disconnect();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Shutdown error:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server, prisma };