FROM node:18 AS installer

COPY ./server/package.json ./server/package-lock.json /server/
COPY ./public/package.json ./public/package-lock.json /public/

# Set up the NPM projects:
RUN cd /server && \
    npm install && \
    cd ../public && \
    npm install


FROM ubuntu:22.04 AS release

COPY --from=installer /server/node_modules /databus/server/node_modules
COPY --from=installer /public/node_modules /databus/public/node_modules

# Install node.js, Caddy as proxy server, and java.
RUN apt-get update && \
    apt-get -y install curl wget systemctl debian-keyring debian-archive-keyring apt-transport-https && \
    wget https://github.com/caddyserver/caddy/releases/download/v2.7.6/caddy_2.7.6_linux_amd64.deb && \
    dpkg -i ./caddy_2.7.6_linux_amd64.deb && \
    caddy version && \
    systemctl daemon-reload && systemctl enable --now caddy && \
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
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

# Disable the proxy server by default:
ENV DATABUS_PROXY_SERVER_ENABLE=false

# When using the proxy, use ACME by default:
ENV DATABUS_PROXY_SERVER_USE_ACME=true

# When not using ACME, what is the name of the own certificate file?
ENV DATABUS_PROXY_SERVER_OWN_CERT="cert.pem"

# When not using ACME, what is the name of the own certificate's key file?
ENV DATABUS_PROXY_SERVER_OWN_CERT_KEY="key.pem"

# What is the hostname of this machine, when using the proxy server?
# It is necessary to know this, in order to set up ACME etc.
# Note: the host name should be identical to DATABUS_RESOURCE_BASE_URL,
# but without specifying a port, protocol i.e. HTTP(S) etc.
ENV DATABUS_PROXY_SERVER_HOSTNAME="my-databus.org"

# Define the volume for the TLS certificate:
VOLUME /tls

COPY . /databus

WORKDIR /databus
ENTRYPOINT [ "/bin/bash", "./setup.sh" ]
