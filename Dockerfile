# Use an official Node.js runtime as a parent image
FROM node:22-bullseye-slim

# Install system dependencies, including ImageMagick
# Run as root to install packages, then switch back to the node user
USER root
RUN apt-get update && apt-get install -y --no-install-recommends imagemagick && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
# This is done in a separate step to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of your application's source code
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Change ownership of the entire application directory to the node user.
# This ensures the app, running as the 'node' user, has permissions to
# create, delete, and modify files and directories as needed.
RUN chown -R node:node /usr/src/app

# Your app will run as the non-root 'node' user
USER node

# The port your app will be listening on. Render uses the PORT env var.
EXPOSE 8003

# Define the command to run your app
CMD ["pnpm", "start"] 