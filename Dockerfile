FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json tsup.config.ts ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine AS runner

RUN apk add --no-cache fontconfig font-noto font-noto-cjk

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app
USER node

EXPOSE 3100
ENV NODE_ENV=production

CMD ["node", "dist/index.js", "--transport", "http", "--port", "3100"]
