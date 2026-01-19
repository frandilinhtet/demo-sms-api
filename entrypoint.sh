#!/bin/sh
set -e

echo "🏗️ Building encoded DATABASE_URL..."

# Use Node to encode variables and export them to the shell
export DATABASE_URL=$(node -e "console.log('postgresql://' + encodeURIComponent(process.env.DB_USER) + ':' + encodeURIComponent(process.env.DB_PASSWORD) + '@' + process.env.DB_HOST + ':' + (process.env.DB_PORT || 5432) + '/' + process.env.DB_NAME)")

echo "🚀 Running database migrations..."
npx prisma migrate deploy

echo "✅ Starting server..."
exec node server.js