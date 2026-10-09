# syntax=docker/dockerfile:1

# ---- build -----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# pnpm 10 reads lockfileVersion 9 (the lockfile of this project).
RUN npm install -g pnpm@10

# Dependencies first: this layer is cached until the lockfile changes.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# vite.config.ts imports .figma/make/site.json, so .figma must be part of the build context (see .dockerignore).
COPY . .
RUN pnpm build

# ---- runtime ---------------------------------------------------------------
FROM nginx:1.27-alpine

# Port standard: project 85 -> Web 8500. The official nginx image runs envsubst on /etc/nginx/templates/*.template at
# start, so the container listens on $PORT (compose passes it) instead of 80. API_UPSTREAM is the backend on the
# internal project network; /api/ is proxied there so the browser only ever talks to this one origin (no CORS).
ENV PORT=8500 \
    API_UPSTREAM=http://nimokids-api:8510

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8500

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/" || exit 1
