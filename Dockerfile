FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/types/package.json ./packages/types/
COPY packages/rule-engine/package.json ./packages/rule-engine/
COPY packages/ai-core/package.json ./packages/ai-core/
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS build
COPY . .
RUN pnpm build
RUN pnpm --filter @shield/backend --prod deploy /prod/backend

FROM node:22-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/backend ./
COPY --from=build /app/apps/backend/drizzle ./drizzle
COPY --from=build /app/rules ./rules
COPY --from=build /app/docs/openapi.yaml ./docs/openapi.yaml
ENV PORT=3001
ENV PRIVACY_MODE=true
ENV DEMO_MODE=true
ENV CORS_ORIGIN=http://localhost:5173
ENV RULES_DIR=/app/rules
ENV OPENAPI_PATH=/app/docs/openapi.yaml
EXPOSE 3001
CMD ["node", "dist/index.js"]

FROM nginx:1.27-alpine AS frontend
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
