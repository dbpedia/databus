DATABUS_RESOURCE_BASE_URL=http://localhost:3000
DATABUS_DATABASE_URL=http://localhost:3002
DATABUS_NAME="Just Another Databus"
DATABUS_ABSTRACT="Another Node in the Databus Network"
DATABUS_ORG_ICON="https://www.dbpedia.org/wp-content/uploads/2020/09/dbpedia-org-logo.png"
DATABUS_BANNER_COLOR="\#5b798d"

webpack:
	(cd ../public && npx webpack --config webpack.config.js)

env-clean:
	sudo rm -r data/; \
	sudo rm -r ../server/users	
	docker rm -f devenv_lookup; \
	docker rm -f devenv_virtuoso; \
	docker rm -f devenv_gstore;

env-build:
	docker build -t lookup-servlet ../search; \

env-start:
	docker compose up

env-restart:
	docker compose restart

env-start-fuseki: 
	sudo rm -f data/fuseki/databases/ds/tdb.lock
	sudo rm -f data/fuseki/system/tdb.lock
	docker compose up

env-clean-start: env-clean
	docker compose up

build-css: 
	sass ../public/css/website.scss > ../public/css/website.css

srv-install:
	npm install --prefix ../server; \
	npm install --prefix ../public


srv-start-auth0:
	DATABUS_RESOURCE_BASE_URL=${DATABUS_RESOURCE_BASE_URL} \
	DATABUS_NAME=${DATABUS_NAME} \
	DATABUS_ABSTRACT=${DATABUS_ABSTRACT} \
	DATABUS_ORG_ICON=${DATABUS_ORG_ICON} \
	DATABUS_BANNER=${DATABUS_BANNER} \
	DATABUS_BANNER_COLOR=${DATABUS_BANNER_COLOR} \
	DATABUS_DATABASE_URL=${DATABUS_DATABASE_URL} \
	DATABUS_OIDC_ISSUER_BASE_URL=https://kilt.eu.auth0.com \
	DATABUS_OIDC_CLIENT_ID=e9eOLS9IkGvuyBl7cBorWUQTNgbqejhc \
	DATABUS_OIDC_SECRET=0RVo9jMnbhPnkR6Ttz0aXQRTcRuSz5DpqyUEjbbcbgRuGA4rbwCjnHM2cOlTrv9q \
	npm start --prefix ./../server

srv-start-auth0-private:
	DATABUS_RESOURCE_BASE_URL=${DATABUS_RESOURCE_BASE_URL} \
	DATABUS_NAME=${DATABUS_NAME} \
	DATABUS_DATABASE_URL=${DATABUS_DATABASE_URL} \
	DATABUS_PRIVATE_MODE=true \
	DATABUS_OIDC_ISSUER_BASE_URL=https://kilt.eu.auth0.com \
	DATABUS_OIDC_CLIENT_ID=e9eOLS9IkGvuyBl7cBorWUQTNgbqejhc \
	DATABUS_OIDC_SECRET=0RVo9jMnbhPnkR6Ttz0aXQRTcRuSz5DpqyUEjbbcbgRuGA4rbwCjnHM2cOlTrv9q \
	npm start --prefix ./../server


srv-start-dbpedia-keycloak:
	DATABUS_RESOURCE_BASE_URL=${DATABUS_RESOURCE_BASE_URL} \
	DATABUS_NAME=${DATABUS_NAME} \
	DATABUS_DATABASE_URL=${DATABUS_DATABASE_URL} \
	DATABUS_OIDC_ISSUER_BASE_URL=https://databus.dbpedia.org/auth/realms/databus \
	DATABUS_OIDC_CLIENT_ID=databus-test-client \
	DATABUS_OIDC_SECRET=e266406c-08c1-4baf-88c5-6137c8c57f3e \
	npm start --prefix ../server


srv-test:
	DATABUS_RESOURCE_BASE_URL=${DATABUS_RESOURCE_BASE_URL} \
	DATABUS_NAME=${DATABUS_NAME} \
	DATABUS_ORG_ICON=${DATABUS_ORG_ICON} \
	DATABUS_BANNER_COLOR=${DATABUS_BANNER_COLOR} \
	DATABUS_DATABASE_URL=${DATABUS_DATABASE_URL} \
	DATABUS_OIDC_ISSUER_BASE_URL=https://kilt.eu.auth0.com \
	DATABUS_OIDC_CLIENT_ID=e9eOLS9IkGvuyBl7cBorWUQTNgbqejhc \
	DATABUS_OIDC_SECRET=0RVo9jMnbhPnkR6Ttz0aXQRTcRuSz5DpqyUEjbbcbgRuGA4rbwCjnHM2cOlTrv9q \
	npm run test --prefix ./../server
