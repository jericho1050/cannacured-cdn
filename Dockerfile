# Use an official Node.js runtime as a parent image
FROM node:22-slim

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

# Build the application
RUN pnpm build

# Your app will run as the non-root 'node' user
USER node

# The port your app will be listening on. Render uses the PORT env var.
EXPOSE 8003

# Define the command to run your app
CMD ["node", "dist/index.js"] 