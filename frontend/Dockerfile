# =========================
# STAGE 1: BASE
# =========================
FROM node:22-alpine AS base
WORKDIR /app

# Salin hanya file yang diperlukan untuk install dependencies
COPY package*.json ./

# Pastikan npm up-to-date
RUN npm install -g npm@11

# =========================
# STAGE 2: DEPENDENCIES
# =========================
FROM base AS deps
# Gunakan npm install agar kompatibel untuk dev dan prod
RUN npm install

# =========================
# STAGE 3: BUILD (Production)
# =========================
FROM deps AS builder
COPY . .
RUN npm run build

# =========================
# STAGE 4: DEVELOPMENT
# =========================
FROM deps AS development
ENV NODE_ENV=development
# Disable file watching performance warning
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true
ENV CHOKIDAR_INTERVAL=500

# Copy source agar hot reload tetap berfungsi saat tanpa volume
COPY . .

# Port default Vite atau Nest dev server
EXPOSE 5173

# Ganti user agar tidak pakai root (best practice)
# USER node

# Jalankan dev mode
CMD ["npm", "run", "dev"]

# =========================
# STAGE 5: PRODUCTION
# =========================
FROM nginx:alpine AS production

# Copy hasil build ke nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional custom config
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
