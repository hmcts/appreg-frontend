# ────────── Stage 1: Install & Build ──────────
FROM hmctspublic.azurecr.io/base/node:22-alpine AS builder

# Use root to ensure permissions for install/build
USER root
WORKDIR /app

# Copy package manifests
COPY package.json yarn.lock ./

# Copy all source (including angular.json, tsconfigs, src/, scripts/, .yarn/, etc.)
COPY . .

# Install dependencies (Yarn v4 immutable install)
RUN yarn install --immutable

# Build client browser bundle for production
RUN yarn build --configuration=production

# ────────── Stage 2: Serve static files via Nginx ──────────
FROM nginx:alpine AS runner

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built browser artifacts
# Adjust the project folder name under dist if different
COPY --from=builder /app/dist/appreg-frontend/browser /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
