#!/bin/bash

# Wait for the database container to be available
echo "Waiting for database at ${DATABUS_DATABASE_URL}..."
while ! curl -s -o /dev/null -w '%{http_code}' ${DATABUS_DATABASE_URL}/sparql | grep -q "200"; do
  sleep 5
done
echo "Database is up and running."

# Start the app
cd /databus/server
npm start
