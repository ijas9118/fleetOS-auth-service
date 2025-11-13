FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM node:20-alpine AS production

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune && \
    rm -rf /root/.npm /root/.cache

COPY --from=builder /app/dist ./dist


EXPOSE 3001
CMD ["node", "dist/index.js"]