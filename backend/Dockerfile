FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npx tsc && npm prune --omit=dev --ignore-scripts

FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001 UPLOAD_DIR=/app/uploads
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
RUN mkdir uploads && chown node:node uploads
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node dist/index.js"]
