# Multi-stage build for production API
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod=false

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Production stage
FROM base AS runner
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 5001

ENV PORT 5001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "dist/index.js"]