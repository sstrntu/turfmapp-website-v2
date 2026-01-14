FROM node:22-alpine AS base

# Install dependencies for native modules (bcrypt, sharp, sqlite3)
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 py3-setuptools make g++ vips-dev pkgconfig
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Production image
FROM base AS runner
RUN apk add --no-cache vips
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules and app files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create necessary directories
RUN mkdir -p uploads/images uploads/videos data

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server/app.js"]
