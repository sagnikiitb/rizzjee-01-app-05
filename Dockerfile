# Base image
FROM oven/bun:latest AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install

# Update Next.js config for standalone output
COPY next.config.mjs ./
RUN sed -i 's/const nextConfig = {}/const nextConfig = { output: "standalone" }/' next.config.mjs

# Copy source code and build
COPY . .
RUN bun next telemetry disable
RUN bun run build

# Runtime stage
FROM oven/bun:latest AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for better security
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:bunjs /app

# Copy necessary files for the standalone output
COPY --from=builder --chown=nextjs:bunjs /app/public ./public
COPY --from=builder --chown=nextjs:bunjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:bunjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Start production server
CMD ["bun", "run", "server.js"]
