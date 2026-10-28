#!/bin/bash

# Wait for the database container to be available
echo "Waiting for database at ${DATABUS_DATABASE_URL}..."
until node -e "fetch(process.env.DATABUS_DATABASE_URL + '/sparql').then(r => process.exit(r.status === 200 ? 0 : 1), () => process.exit(1))"; do
  sleep 5
done
echo "Database is up and running."

# Start the app
cd /databus/server
npm start
