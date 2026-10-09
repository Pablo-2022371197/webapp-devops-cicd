FROM node:18-bookworm-slim AS deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
# sqlite3 trae un binario precompilado que pide GLIBC 2.38;
# se recompila aquí contra el glibc de bookworm (2.36).
ENV npm_config_build_from_source=true
RUN npm install --omit=dev

FROM node:18-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production
ENV HTTP_PORT=80
ENV TCP_PORT=6061

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY index.js ./
COPY src ./src

EXPOSE 80 6061

CMD ["node", "index.js"]
