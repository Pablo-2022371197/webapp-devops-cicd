FROM node:18-bookworm-slim AS deps
WORKDIR /app
COPY package.json ./
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
