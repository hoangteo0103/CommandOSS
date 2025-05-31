# Use Node.js 20 standard image (instead of alpine) for better compatibility with native dependencies
FROM node:20 AS development

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /usr/src/app

# Install required system dependencies for native modules
RUN apt-get update && apt-get install -y \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from development stage
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/src/migrations ./src/migrations
COPY service-account-key.json ./service-account-key.json

# Create a non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nestjs

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /usr/src/app
USER nestjs

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Start the application (corrected path)
CMD ["node", "dist/src/main"] 