echo "Waiting for database at ${DATABUS_DATABASE_URL}/sparql..."
bash -c 'while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' ${DATABUS_DATABASE_URL}/sparql)" != "200" ]]; do sleep 5; done'

/usr/local/tomcat/bin/catalina.sh start
cd /databus/server
npm start