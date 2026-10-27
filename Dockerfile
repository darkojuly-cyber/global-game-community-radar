FROM node:24-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=network_ca,required=false \
    if [ -f /run/secrets/network_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/network_ca; export npm_config_cafile=/run/secrets/network_ca; fi; \
    npm ci --fetch-retries=1 --fetch-timeout=30000
COPY . .
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build npm run build

FROM node:24-bookworm AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
CMD ["bash", "scripts/start-container.sh"]
