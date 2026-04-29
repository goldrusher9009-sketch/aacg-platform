# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./
RUN npm ci
COPY app ./app
COPY public ./public
COPY __tests__ ./__tests__
COPY scripts ./scripts
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
    USER nextjs
    HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
      CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
      EXPOSE 3000
      CMD ["dumb-init", "node_modules/.bin/next", "start"]
