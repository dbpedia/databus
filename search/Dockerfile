FROM tomcat:9.0.35-jdk11-openjdk

COPY ./lookup-application.war /usr/local/tomcat/webapps/
ENTRYPOINT [ "/usr/local/tomcat/bin/catalina.sh" ]
CMD [ "run" ]
