FROM tomcat:9.0.35-jdk11-openjdk

RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
RUN node -v
RUN npm -v

COPY ./server /databus/server
COPY ./public /databus/public
COPY ./search /databus/search

COPY ./setup.sh /databus/setup.sh
COPY ./context.json /databus/context.json

# Copy Lookup WAR
COPY ./search/app-config-servlet.yml /root/app-config.yml
COPY ./search/lookup-application.war /usr/local/tomcat/webapps/

WORKDIR /databus
ENTRYPOINT [ "/bin/bash", "./setup.sh" ]