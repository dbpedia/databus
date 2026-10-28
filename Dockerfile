# syntax=docker/dockerfile:1
# Dependencies are installed on the native build platform (no QEMU). npm_config_cpu picks the
# target-arch optional packages, npm_config_arch makes sqlite3 download the target-arch prebuilt binary.
FROM --platform=$BUILDPLATFORM node:23-slim AS builder
ARG TARGETARCH
WORKDIR /databus

COPY server/package*.json server/
COPY public/package*.json public/
RUN --mount=type=cache,target=/root/.npm \
    export npm_config_arch=$([ "$TARGETARCH" = amd64 ] && echo x64 || echo "$TARGETARCH") && \
    export npm_config_cpu=$npm_config_arch && \
    npm ci --omit=dev --no-audit --no-fund --prefix server && \
    npm ci --omit=dev --no-audit --no-fund --prefix public

COPY server server
COPY public public
COPY search search

FROM node:23-slim
WORKDIR /databus
COPY --from=builder /databus .
ENTRYPOINT [ "/bin/bash", "./server/setup.sh" ]
