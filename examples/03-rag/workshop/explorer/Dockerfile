FROM node:24-bookworm-slim AS base
WORKDIR /app
COPY explorer/package*.json ./
RUN npm ci
COPY explorer/ ./
COPY corpus/ /corpus/
RUN npm run build && mkdir -p /app/output && chown -R node:node /app
USER node
EXPOSE 4341
CMD ["node", "server.mjs"]
