#!/bin/sh
set -e

# Construct the real DATABASE_URL from individual ECS variables
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "🚀 Running database migrations..."
npx prisma migrate deploy

echo "✅ Starting server..."
exec node server.js