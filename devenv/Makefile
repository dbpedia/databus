# DBpedia Databus Development Environment Makefile
# This file provides convenient commands for local development

# Load environment variables
include .env
export

# Default values for environment variables
DATABUS_RESOURCE_BASE_URL ?= http://localhost:3000
DATABUS_DATABASE_URL ?= http://localhost:3002
DATABUS_NAME ?= "Local Databus Development"
DATABUS_ORG_ICON ?= "https://www.dbpedia.org/wp-content/uploads/2020/09/dbpedia-org-logo.png"
DATABUS_BANNER_COLOR ?= "#5b798d"
VIRTUOSO_PASSWORD ?= databus_dev_password
VIRTUOSO_USER ?= dba

# Development OIDC providers
AUTH0_ISSUER ?= https://kilt.eu.auth0.com
AUTH0_CLIENT_ID ?= e9eOLS9IkGvuyBl7cBorWUQTNgbqejhc
AUTH0_SECRET ?= 0RVo9jMnbhPnkR6Ttz0aXQRTcRuSz5DpqyUEjbbcbgRuGA4rbwCjnHM2cOlTrv9q

DBPEDIA_ISSUER ?= https://databus.dbpedia.org/auth/realms/databus
DBPEDIA_CLIENT_ID ?= databus-test-client
DBPEDIA_SECRET ?= e266406c-08c1-4baf-88c5-6137c8c57f3e

.PHONY: help dev-setup dev-start dev-stop dev-restart dev-clean dev-logs \
        srv-install srv-start-dev srv-test srv-build \
        webpack build-css watch-css \
        db-backup db-restore db-reset

# Default target
help:
	@echo "DBpedia Databus Development Environment"
	@echo "======================================"
	@echo ""
	@echo "Environment Management:"
	@echo "  dev-setup    - Initial setup (build images, create volumes)"
	@echo "  dev-start    - Start all services"
	@echo "  dev-stop     - Stop all services"
	@echo "  dev-restart  - Restart all services"
	@echo "  dev-clean    - Clean all data and containers"
	@echo "  dev-logs     - View logs from all services"
	@echo ""
	@echo "Server Management:"
	@echo "  srv-install  - Install Node.js dependencies"
	@echo "  srv-start-dev- Start server in development mode"
	@echo "  srv-test     - Run tests"
	@echo "  srv-build    - Build production assets"
	@echo ""
	@echo "Frontend Development:"
	@echo "  webpack      - Build frontend assets"
	@echo "  build-css    - Compile SCSS to CSS"
	@echo "  watch-css    - Watch and compile SCSS changes"
	@echo ""
	@echo "Database Management:"
	@echo "  db-backup    - Backup Virtuoso database"
	@echo "  db-restore   - Restore from backup"
	@echo "  db-reset     - Reset database (clean start)"

# Environment Management
dev-setup:
	@echo "Setting up development environment..."
	docker build -t lookup-servlet ../search
	mkdir -p data/virtuoso data/gstore/git data/gstore/logs data/search/index
	@echo "Development environment setup complete!"

dev-start:
	@echo "Starting development services..."
	docker compose up -d
	@echo "Services started! Waiting for health checks..."
	@echo "Virtuoso: http://localhost:3003"
	@echo "GStore: http://localhost:3002"
	@echo "Search: http://localhost:3005"

dev-stop:
	@echo "Stopping development services..."
	docker compose down

dev-restart:
	@echo "Restarting development services..."
	docker compose restart

dev-clean:
	@echo "Cleaning development environment..."
	docker compose down -v
	sudo rm -rf data/
	sudo rm -rf ../server/users
	docker rmi lookup-servlet 2>/dev/null || true
	@echo "Development environment cleaned!"

dev-logs:
	@echo "Showing logs from all services..."
	docker compose logs -f

# Server Management
srv-install:
	@echo "Installing server dependencies..."
	npm install --prefix ../server
	npm install --prefix ../public
	@echo "Server dependencies installed!"

srv-start-dev:
	@echo "Starting Databus server in development mode..."
	DATABUS_RESOURCE_BASE_URL=$(DATABUS_RESOURCE_BASE_URL) \
	DATABUS_NAME=$(DATABUS_NAME) \
	DATABUS_ORG_ICON=$(DATABUS_ORG_ICON) \
	DATABUS_BANNER_COLOR=$(DATABUS_BANNER_COLOR) \
	DATABUS_DATABASE_URL=$(DATABUS_DATABASE_URL) \
	DATABUS_OIDC_ISSUER_BASE_URL=$(AUTH0_ISSUER) \
	DATABUS_OIDC_CLIENT_ID=$(AUTH0_CLIENT_ID) \
	DATABUS_OIDC_SECRET=$(AUTH0_SECRET) \
	NODE_ENV=development \
	DATABUS_DEBUG=true \
	npm start --prefix ../server

srv-start-auth0:
	@echo "Starting server with Auth0 authentication..."
	DATABUS_RESOURCE_BASE_URL=$(DATABUS_RESOURCE_BASE_URL) \
	DATABUS_NAME=$(DATABUS_NAME) \
	DATABUS_ORG_ICON=$(DATABUS_ORG_ICON) \
	DATABUS_BANNER_COLOR=$(DATABUS_BANNER_COLOR) \
	DATABUS_DATABASE_URL=$(DATABUS_DATABASE_URL) \
	DATABUS_OIDC_ISSUER_BASE_URL=$(AUTH0_ISSUER) \
	DATABUS_OIDC_CLIENT_ID=$(AUTH0_CLIENT_ID) \
	DATABUS_OIDC_SECRET=$(AUTH0_SECRET) \
	npm start --prefix ../server

srv-start-dbpedia-keycloak:
	@echo "Starting server with DBpedia Keycloak authentication..."
	DATABUS_RESOURCE_BASE_URL=$(DATABUS_RESOURCE_BASE_URL) \
	DATABUS_NAME=$(DATABUS_NAME) \
	DATABUS_DATABASE_URL=$(DATABUS_DATABASE_URL) \
	DATABUS_OIDC_ISSUER_BASE_URL=$(DBPEDIA_ISSUER) \
	DATABUS_OIDC_CLIENT_ID=$(DBPEDIA_CLIENT_ID) \
	DATABUS_OIDC_SECRET=$(DBPEDIA_SECRET) \
	npm start --prefix ../server

srv-test:
	@echo "Running server tests..."
	DATABUS_RESOURCE_BASE_URL=$(DATABUS_RESOURCE_BASE_URL) \
	DATABUS_NAME=$(DATABUS_NAME) \
	DATABUS_ORG_ICON=$(DATABUS_ORG_ICON) \
	DATABUS_BANNER_COLOR=$(DATABUS_BANNER_COLOR) \
	DATABUS_DATABASE_URL=$(DATABUS_DATABASE_URL) \
	DATABUS_OIDC_ISSUER_BASE_URL=$(AUTH0_ISSUER) \
	DATABUS_OIDC_CLIENT_ID=$(AUTH0_CLIENT_ID) \
	DATABUS_OIDC_SECRET=$(AUTH0_SECRET) \
	npm test --prefix ../server

srv-build:
	@echo "Building production assets..."
	cd ../public && npx webpack --config webpack.config.js --mode production
	@echo "Production build complete!"

# Frontend Development
webpack:
	@echo "Building frontend assets..."
	cd ../public && npx webpack --config webpack.config.js

build-css:
	@echo "Compiling SCSS to CSS..."
	sass ../public/css/website.scss ../public/css/website.css

watch-css:
	@echo "Watching SCSS files for changes..."
	sass --watch ../public/css/website.scss:../public/css/website.css

# Database Management
db-backup:
	@echo "Creating database backup..."
	mkdir -p data/backup
	docker exec databus_dev_virtuoso isql-vt -U dba -P $(VIRTUOSO_PASSWORD) -S 1111 \
		"backup_context(0, '$(shell date +%Y%m%d_%H%M%S)', 10000000, 0, vector('data/backup'));"
	@echo "Backup created in data/backup/"

db-restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup filename: " backup_file; \
	docker exec databus_dev_virtuoso isql-vt -U dba -P $(VIRTUOSO_PASSWORD) -S 1111 \
		"restore_context('data/backup/$$backup_file', 0);"
	@echo "Database restored!"

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		make dev-clean; \
		make dev-setup; \
		make dev-start; \
		echo "Database reset complete!"; \
	else \
		echo "Database reset cancelled."; \
	fi

# Legacy commands (for backward compatibility)
env-build: dev-setup
env-start: dev-start
env-restart: dev-restart
env-clean: dev-clean
env-clean-start: db-reset
