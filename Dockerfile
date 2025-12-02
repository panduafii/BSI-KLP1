# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1

# --- Builder stage: install deps, build TS ---
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

# Install dependencies (npm ci for deterministic builds)
COPY --link package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source files and configs (excluding .env, .git, etc. via .dockerignore)
COPY --link tsconfig*.json ./
COPY --link nest-cli.json ./
COPY --link src ./src

# Build the TypeScript app
RUN npm run build

# Remove dev dependencies and reinstall only production deps
RUN rm -rf node_modules \
    && npm ci --omit=dev

# --- Final stage: minimal runtime image ---
FROM node:${NODE_VERSION}-slim AS final
WORKDIR /app

# Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy built app and production node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/nest-cli.json ./

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
USER appuser

EXPOSE 3000
CMD ["node", "dist/main.js"]
