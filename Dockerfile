FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

FROM base AS deps
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

FROM deps AS build
RUN rm -rf dist && pnpm build

FROM base AS production-deps
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000


# 1) Créer user + group explicitement (évite le souci "group missing")
RUN groupadd --gid 1001 nodeuser \
 && useradd  --uid 1001 --gid 1001 --system --create-home nodeuser

# 2) Copier en assignant le owner directement (pas de chown récursif)
COPY --from=production-deps --chown=nodeuser:nodeuser /app/node_modules ./node_modules
COPY --chown=nodeuser:nodeuser package.json pnpm-lock.yaml ./
COPY --from=build --chown=nodeuser:nodeuser /app/dist ./dist

USER nodeuser

EXPOSE 3000
CMD ["node", "dist/main.js"]
