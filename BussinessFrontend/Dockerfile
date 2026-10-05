# syntax=docker/dockerfile:1

# ---- build: Vite bakes VITE_* variables into the bundle at build time
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Railway passes service variables to the build when they are declared as ARG
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime: static files served by nginx with SPA fallback
FROM nginx:1.27-alpine AS runtime
# nginx renders /etc/nginx/templates/*.template with envsubst at startup (PORT comes from Railway)
ENV PORT=8080
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" || exit 1
