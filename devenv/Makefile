DATABUS_RESOURCE_BASE_URL=http://localhost:3000
DATABUS_DATABASE_URL=http://localhost:3002
DATABUS_NAME="Just Another Databus"

env-clean:
	sudo rm -r data/; \
	sudo rm -r ../server/users; \
	docker rm -f devenv_lookup; \
	docker rm -f devenv_virtuoso; \
	docker rm -f devenv_gstore;

env-build:
	docker build -t lookup-servlet ../search; \

env-start:
	docker-compose up

env-restart:
	docker-compose restart

env-clean-start: env-clean
	docker-compose up

srv-install:
	npm install --prefix ../server; \
	npm install --prefix ../public

srv-start-auth0:
	DATABUS_RESOURCE_BASE_URL=${DATABUS_RESOURCE_BASE_URL} \
	DATABUS_NAME=${DATABUS_NAME} \
	DATABUS_DATABASE_URL=${DATABUS_DATABASE_URL} \
	DATABUS_OIDC_ISSUER_BASE_URL=https://kilt.eu.auth0.com \
	DATABUS_OIDC_CLIENT_ID=e9eOLS9IkGvuyBl7cBorWUQTNgbqejhc \
	DATABUS_OIDC_SECRET=0RVo9jMnbhPnkR6Ttz0aXQRTcRuSz5DpqyUEjbbcbgRuGA4rbwCjnHM2cOlTrv9q \
	npm start --prefix ../server

srv-start-dbpedia-keycloak:
	DATABUS_RESOURCE_BASE_URL=${DATABUS_RESOURCE_BASE_URL} \
	DATABUS_DATABASE_URL=${DATABUS_DATABASE_URL} \
	DATABUS_OIDC_ISSUER_BASE_URL=https://databus.dbpedia.org/auth/realms/databus \
	DATABUS_OIDC_CLIENT_ID=databus-test-client \
	DATABUS_DEFAULT_CONTEXT_URL=https://downloads.dbpedia.org/databus/context.jsonld \
	DATABUS_OIDC_SECRET=e266406c-08c1-4baf-88c5-6137c8c57f3e \
	npm start --prefix ../server