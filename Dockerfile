FROM ubuntu:18.04
RUN apt-get update
RUN apt-get install -y curl

# Set up node.js:
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    node -v && \
    npm -v

# Set up Caddy as proxy server:
RUN apt-get install -y debian-keyring debian-archive-keyring apt-transport-https && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list && \
    apt-get update && \
    apt-get install caddy

RUN apt-get -y install ca-certificates-java 
RUN apt-get -y install openjdk-17-jdk openjdk-17-jre
RUN java -version

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
