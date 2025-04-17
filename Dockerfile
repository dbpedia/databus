# Use a consistent Node.js version across build and release stages
FROM node:23-slim AS builder

# Install Python for node-gyp (required for sqlite3 build)
RUN apt-get update && apt-get install -y python3 build-essential && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /databus/server

RUN --mount=type=bind,source=server/package.json,target=package.json \
    --mount=type=bind,source=server/package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev


WORKDIR /databus/public

RUN --mount=type=bind,source=public/package.json,target=package.json \
    --mount=type=bind,source=public/package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

WORKDIR /

# Copy source code
COPY server ./databus/server
COPY public ./databus/public

# Rebuild sqlite3 in case it's a native module
RUN cd databus/server && npm rebuild sqlite3

FROM node:23-slim AS runtime

WORKDIR /databus

# Install only necessary system packages
RUN apt-get update && \
    apt-get install -y \
        curl \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy app from build stage
COPY --from=builder /databus .

# Entrypoint
ENTRYPOINT [ "/bin/bash", "./server/setup.sh" ]
