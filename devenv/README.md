# DBpedia Databus - Local Development Setup

This guide will help you set up a complete local development environment for the DBpedia Databus platform.

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/dbpedia/databus.git
cd databus

# 2. Set up git hooks (optional but recommended)
cd .git/hooks
ln -s ../../.githooks/pre-commit pre-commit
cd ../..

# 3. Start the development environment
cd devenv
make dev-setup
make dev-start

# 4. In a new terminal, start the Databus server
make srv-install
make srv-start-dev
```

Your Databus will be available at: **http://localhost:3000**

## 🛠 Prerequisites

### Required Software

- **Docker & Docker Compose**
  ```bash
  # Ubuntu/Debian
  sudo apt-get update
  sudo apt-get install docker.io docker-compose
  
  # macOS
  brew install docker docker-compose
  
  # Windows
  # Download Docker Desktop from https://www.docker.com/products/docker-desktop
  ```

- **Node.js** (v16.13.0 or higher)
  ```bash
  # Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

  # Or using nvm (recommended)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 16
  nvm use 16
```

- **npm** (v7.24.0 or higher)
  ```bash
sudo npm install -g npm@latest
```

- **PHP** (v8.1.0 or higher) - for model documentation generation
  ```bash
  sudo apt install php-cli php-curl php-mbstring
  ```

- **Java** (JDK 17 or higher) - for search functionality
  ```bash
  sudo apt install openjdk-17-jdk
  ```

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk Space**: At least 10GB free space
- **CPU**: 2+ cores recommended

## 🛠 Development Environment Setup

### 1. Environment Configuration

Create a `.env` file in the `devenv` directory:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your preferred settings:

```env
# Databus Configuration
DATABUS_RESOURCE_BASE_URL=http://localhost:3000
DATABUS_DATABASE_URL=http://localhost:3002
DATABUS_NAME="Local Databus Development"
DATABUS_ORG_ICON="https://www.dbpedia.org/wp-content/uploads/2020/09/dbpedia-org-logo.png"
DATABUS_BANNER_COLOR="#5b798d"

# Authentication (Development OIDC providers)
DATABUS_OIDC_ISSUER_BASE_URL=https://kilt.eu.auth0.com
DATABUS_OIDC_CLIENT_ID=e9eOLS9IkGvuyBl7cBorWUQTNgbqejhc
DATABUS_OIDC_SECRET=0RVo9jMnbhPnkR6Ttz0aXQRTcRuSz5DpqyUEjbbcbgRuGA4rbwCjnHM2cOlTrv9q

# Database Configuration
VIRTUOSO_PASSWORD=databus_dev_password
VIRTUOSO_USER=dba

# Development Mode
NODE_ENV=development
DATABUS_DEBUG=true
```

### 2. Start Infrastructure Services

```bash
# Build and start all required services
make dev-setup
make dev-start

# Or start services individually:
make env-build    # Build search indexer
make env-start    # Start all services
```

**Available Services:**
- **Virtuoso Triple Store**: http://localhost:3003 (SPARQL endpoint)
- **GStore API**: http://localhost:3002
- **Search API**: http://localhost:3005
- **Virtuoso Admin**: http://localhost:3004

### 3. Start the Databus Server

```bash
# Install dependencies
make srv-install

# Start with development configuration
make srv-start-dev

# Or start with specific OIDC provider:
make srv-start-auth0              # Auth0 with Google Auth
make srv-start-dbpedia-keycloak   # DBpedia Keycloak
```

## 🔧 Development Workflow

### Available Make Commands

```bash
# Environment management
make dev-setup          # Initial setup (build images, create volumes)
make dev-start          # Start all services
make dev-stop           # Stop all services
make dev-restart        # Restart all services
make dev-clean          # Clean all data and containers
make dev-logs           # View logs from all services

# Server management
make srv-install        # Install Node.js dependencies
make srv-start-dev      # Start server in development mode
make srv-test           # Run tests
make srv-build          # Build production assets

# Frontend development
make webpack            # Build frontend assets
make build-css          # Compile SCSS to CSS
make watch-css          # Watch and compile SCSS changes

# Database management
make db-backup          # Backup Virtuoso database
make db-restore         # Restore from backup
make db-reset           # Reset database (clean start)
```

### Development Tips

1. **Hot Reloading**: The server will automatically restart when you make changes to server files
2. **Frontend Changes**: Use `make watch-css` for SCSS changes, or `make webpack` for JavaScript changes
3. **Database Access**: Use the Virtuoso admin interface at http://localhost:3004 (dba/databus_dev_password)
4. **SPARQL Queries**: Test queries at http://localhost:3003/sparql

### Debugging

```bash
# View service logs
make dev-logs

# View specific service logs
docker logs databus_dev_virtuoso
docker logs databus_dev_gstore
docker logs databus_dev_search

# Access service containers
docker exec -it databus_dev_virtuoso bash
docker exec -it databus_dev_gstore bash
```

## 📚 API Documentation

Once the server is running, you can access:

- **Swagger API Docs**: http://localhost:3000/api/docs
- **SPARQL Endpoint**: http://localhost:3000/sparql
- **Linked Data**: http://localhost:3000/res/context.jsonld

## 🔐 Authentication Setup

### Development OIDC Providers

The development environment includes pre-configured OIDC providers for testing:

1. **Auth0 (Recommended for development)**
   - Provider: https://kilt.eu.auth0.com
   - Client ID: `e9eOLS9IkGvuyBl7cBorWUQTNgbqejhc`
   - Supports Google, GitHub, and email/password login

2. **DBpedia Keycloak**
   - Provider: https://databus.dbpedia.org/auth/realms/databus
   - Client ID: `databus-test-client`

### Setting Up Your Own OIDC Provider

For production or custom development:

1. Set up an OIDC provider (Auth0, Keycloak, etc.)
2. Create a new application/client
3. Update the `.env` file with your credentials
4. Configure the redirect URI: `http://localhost:3000/callback`

## 📖 Data Management

### Database Backups

```bash
# Create backup
make db-backup

# Restore from backup
make db-restore

# Reset database (WARNING: This will delete all data)
make db-reset
```

### Sample Data

The development environment includes sample data for testing:

- Sample accounts and artifacts
- Test collections
- Example SPARQL queries

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :3002
   sudo netstat -tulpn | grep :3003
   ```

2. **Permission issues**
   ```bash
   # Fix Docker permissions
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

3. **Memory issues**
   ```bash
   # Increase Docker memory limit
   # In Docker Desktop: Settings > Resources > Memory
   ```

4. **Service health checks failing**
   ```bash
   # Check service status
   docker ps
   docker logs <service_name>
   ```

### Getting Help

- **Logs**: Use `make dev-logs` to view all service logs
- **Documentation**: Check the main [README.md](../README.md)
- **Issues**: Report problems on [GitHub Issues](https://github.com/dbpedia/databus/issues)
- **Community**: Join the [Discord server](https://discord.gg/fB8byAPP7e)

## 📖 Next Steps

After setting up your development environment:

1. **Explore the API**: Visit http://localhost:3000/api/docs
2. **Try SPARQL**: Test queries at http://localhost:3000/sparql
3. **Publish Data**: Use the web interface to publish your first dataset
4. **Read Documentation**: Check the [main documentation](../docs/)
5. **Contribute**: See [CONTRIBUTING.md](../CONTRIBUTING.md)

## 📖 Updates

To update your development environment:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
make dev-clean
make dev-setup
make dev-start
make srv-install
make srv-start-dev
```

---

**Happy coding! 🚀**

For more information, visit the [DBpedia Databus documentation](https://dbpedia.gitbook.io/databus/).
