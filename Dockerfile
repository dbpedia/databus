# Use a consistent Node.js version across build and release stages
FROM node:20 AS installer 

# Set working directory
WORKDIR /server

# Copy package.json first to leverage Docker caching
COPY ./server/package.json ./server/package-lock.json ./
RUN npm install

WORKDIR /public
COPY ./public/package.json ./public/package-lock.json ./
RUN npm install

# Copy the rest of the application source files
WORKDIR /
COPY ./server /server
COPY ./public /public

FROM ubuntu:22.04 AS release

COPY . /databus

# Install system dependencies, including build tools
RUN apt-get update && \
    apt-get -y install curl wget systemctl build-essential python3 && \
    wget https://github.com/caddyserver/caddy/releases/download/v2.7.6/caddy_2.7.6_linux_amd64.deb && \
    dpkg -i ./caddy_2.7.6_linux_amd64.deb && \
    caddy version && \
    systemctl daemon-reload && systemctl enable --now caddy && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get update && \
    apt-get -y install \
      nodejs \
      ca-certificates-java \
      openjdk-17-jdk \
      openjdk-17-jre && \
    rm -rf /var/lib/apt/lists/* && \
    node -v && \
    npm -v && \
    java -version

WORKDIR /databus

# Copy application source code first
COPY --from=installer /server /databus/server
COPY --from=installer /public /databus/public

# Rebuild sqlite3 in the release stage to ensure it's correctly compiled
RUN cd /databus/server && npm rebuild sqlite3 && npm install --omit=dev

# Define the volume for the TLS certificate
VOLUME /tls

# Set environment variables
ENV DATABUS_PROXY_SERVER_ENABLE=false
ENV DATABUS_PROXY_SERVER_USE_ACME=true
ENV DATABUS_PROXY_SERVER_OWN_CERT="cert.pem"
ENV DATABUS_PROXY_SERVER_OWN_CERT_KEY="key.pem"
ENV DATABUS_PROXY_SERVER_HOSTNAME="my-databus.org"

# Set up entrypoint
ENTRYPOINT [ "/bin/bash", "./setup.sh" ]
