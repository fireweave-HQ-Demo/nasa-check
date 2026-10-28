# syntax=docker/dockerfile:1

# ---- Build: compile the static app. No keys needed; config is injected at runtime. ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build \
  # MSW's worker is only for `npm run dev:mock`; config.js is generated at container start.
  && rm -f dist/mockServiceWorker.js dist/config.js \
  # Files copied from public/ keep their source permissions; make everything world-readable for nginx.
  && chmod -R a+rX dist

# ---- Serve: static files on nginx (no Node in the final image). ----
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html

ENV APP_ENV=production
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
