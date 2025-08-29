# 1. Base Image: Use a specific Node.js version for reproducibility
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies needed for running Next.js
RUN apk add --no-cache libc6-compat

# Set up a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# 2. Dependencies Stage: Install dependencies
FROM base AS deps

WORKDIR /app

# Copy package.json and install dependencies
COPY --chown=nextjs:nodejs package.json ./
RUN npm install --frozen-lockfile

# 3. Builder Stage: Build the application
FROM base AS builder

WORKDIR /app

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy application code
COPY --chown=nextjs:nodejs . .

# Copy the .env file into the build
COPY --chown=nextjs:nodejs .env ./.env

# Build the Next.js application
RUN npm run build

# 4. Runner Stage: Run the production application
FROM base AS runner

WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy the built application from the 'builder' stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/games ./games

EXPOSE 3017

ENV PORT 3017
ENV HOSTNAME 0.0.0.0

CMD ["node", "server.js"]

# docker build -t monopoly-banker-app .
# docker run -d -p 3017:3000 --restart unless-stopped --name monopoly-banker-app monopoly-banker-app