#!/bin/sh
# This script is the entrypoint for the Docker container.
# It ensures that database migrations are applied before the application starts.

# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations
echo "Running database migrations..."
pnpm prisma migrate deploy

# Start the application
echo "Starting application..."
pnpm start 