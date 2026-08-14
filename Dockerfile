# syntax=docker/dockerfile:1

FROM node:20-alpine

WORKDIR /app

COPY coinradar-ai/package*.json ./coinradar-ai/
RUN npm ci --omit=dev --prefix ./coinradar-ai

COPY coinradar-ai ./coinradar-ai
COPY lambda ./lambda

ENV NODE_ENV=production \
    PORT=3000 \
    OLLAMA_URL=http://host.docker.internal:11434

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

WORKDIR /app/coinradar-ai
CMD ["npm", "start"]
