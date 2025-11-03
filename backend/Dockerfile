# =======================
# STAGE 1: BASE
# =======================
FROM node:22-slim AS base
WORKDIR /app

# Install dependencies system (buat Prisma & NestJS build)
RUN apt-get update && apt-get install -y \
    bash \
    git \
    python3 \
    make \
    g++ \
    libc6-dev \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Update npm versi terbaru
RUN npm install -g npm@11

# Salin dependency info lebih dulu
COPY package*.json ./

# Install dependencies (gunakan npm install, bukan ci agar fleksibel di dev)
RUN npm install --legacy-peer-deps

# Generate Prisma client lebih cepat (kalau schema belum ada, skip tanpa error)
COPY prisma ./prisma
RUN npx prisma generate || echo "Skip prisma generate (schema belum ada)"

# =======================
# STAGE 2: DEVELOPMENT
# =======================
FROM base AS development
ENV NODE_ENV=development
# Disable file watching performance warning
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true
ENV CHOKIDAR_INTERVAL=500


WORKDIR /app

# Copy semua source (untuk container dev yang standalone)
COPY . .

# Expose port NestJS dev server
EXPOSE 3000

# Gunakan dumb-init agar proses clean shutdown
ENTRYPOINT ["dumb-init", "--"]

# Jalankan NestJS dev mode (watch mode)
CMD ["npm", "run", "start:dev"]

# =======================
# STAGE 3: BUILD (Production)
# =======================
FROM base AS builder
WORKDIR /app
COPY . .

# Build NestJS (kompilasi ke dist)
RUN npm run build

# =======================
# STAGE 4: PRODUCTION
# =======================
FROM node:22-slim AS production
WORKDIR /app

# Install minimal runtime deps
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Jakarta
ENV NODE_ENV=production

# Copy hasil build dan dependensi
COPY --from=builder /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Expose port aplikasi
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
