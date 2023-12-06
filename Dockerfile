FROM ubuntu:22.04

# Install node.js, Caddy as proxy server, and java.
RUN apt-get update && \
    apt-get -y curl debian-keyring debian-archive-keyring apt-transport-https && \
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list && \
    apt-get update && \
    apt-get -y nodejs \
      caddy \
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

COPY ./server /databus/server
COPY ./public /databus/public
COPY ./search /databus/search
COPY ./model/generated /databus/model/generated

COPY ./setup.sh /databus/setup.sh

# Set up the NPM projects:
RUN cd /databus/server && \
    npm install && \
    cd ../public && \
    npm install

WORKDIR /databus
ENTRYPOINT [ "/bin/bash", "./setup.sh" ]
