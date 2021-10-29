FROM tomcat:9.0.35-jdk11-openjdk

# Set up node.js:
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    node -v && \
    npm -v

# Set up Caddy as proxy server:
RUN apt-get install -y debian-keyring debian-archive-keyring apt-transport-https && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo tee /etc/apt/trusted.gpg.d/caddy-stable.asc && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list && \
    apt-get update && \
    apt-get install caddy

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

COPY ./setup.sh /databus/setup.sh
COPY ./context.json /databus/context.json

# Copy Lookup WAR:
COPY ./search/app-config-servlet.yml /root/app-config.yml
COPY ./search/lookup-application.war /usr/local/tomcat/webapps/

WORKDIR /databus
ENTRYPOINT [ "/bin/bash", "./setup.sh" ]