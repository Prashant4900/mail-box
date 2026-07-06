#!/bin/sh
set -e

# Run Prisma migrations
echo "Running Prisma Migrations..."
npx prisma migrate deploy

# Start the Next.js application
echo "Starting Next.js..."
exec node server.js
