FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

FROM base AS deps
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

FROM deps AS build
RUN pnpm build

FROM base AS production-deps
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=production-deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY --from=build /app/dist ./dist

# Sécurité : user non-root
RUN adduser --system --uid 1001 nodeuser
RUN chown -R nodeuser:nodeuser /app
USER nodeuser

EXPOSE 3000
CMD ["node", "dist/main.js"]
