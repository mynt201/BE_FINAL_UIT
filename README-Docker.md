# 🐳 Docker & Azure Deployment Guide

Hướng dẫn triển khai Flood Risk Management Backend sử dụng Docker và Azure.

## 📋 Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt Docker](#cài-đặt-docker)
- [Chạy với Docker Compose](#chạy-với-docker-compose)
- [Triển khai trên Azure](#triển-khai-trên-azure)
- [Cấu hình CI/CD](#cấu-hình-cicd)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

## 🖥️ Yêu cầu hệ thống

- Docker >= 20.10
- Docker Compose >= 2.0
- Node.js 18+ (cho development)
- Azure CLI (cho Azure deployment)

## 🐳 Cài đặt Docker

### Windows/Mac
```bash
# Download từ: https://www.docker.com/products/docker-desktop
# Cài đặt và khởi động Docker Desktop
```

### Linux (Ubuntu/Debian)
```bash
# Cập nhật package index
sudo apt update

# Cài đặt prerequisites
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Thêm Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Thêm Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker Engine
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Thêm user vào docker group
sudo usermod -aG docker $USER

# Restart để áp dụng changes
newgrp docker
```

## 🚀 Chạy với Docker Compose

### Development Environment

```bash
# Clone repository
git clone <repository-url>
cd flood-risk-backend

# Chạy development environment
docker-compose -f docker-compose.dev.yml up --build

# Hoặc sử dụng npm script
npm run docker:dev
```

**Services được tạo:**
- `flood_risk_api_dev` - Backend API (port 5000)
- `flood_risk_mongodb_dev` - MongoDB (port 27017)
- `flood_risk_redis_dev` - Redis (port 6379)

### Production Environment

```bash
# Chạy production environment
docker-compose -f docker-compose.prod.yml up --build -d

# Hoặc sử dụng npm script
npm run docker:prod
```

**Services được tạo:**
- `flood_risk_api_prod` - Backend API
- `flood_risk_mongodb_prod` - MongoDB
- `flood_risk_redis_prod` - Redis
- `flood_risk_nginx_prod` - Nginx reverse proxy
- `flood_risk_watchtower` - Auto-update (optional)

### Chỉ chạy Backend (không database)

```bash
# Build image
npm run docker:build

# Chạy container
npm run docker:run
```

## ☁️ Triển khai trên Azure

### 1. Chuẩn bị Azure Resources

```bash
# Đăng nhập Azure CLI
az login

# Tạo Resource Group
az group create --name flood-risk-rg --location southeastasia

# Tạo Azure Container Registry
az acr create --resource-group flood-risk-rg --name floodriskacr --sku Basic

# Tạo Azure Database for MongoDB
az cosmosdb create --name flood-risk-db --resource-group flood-risk-rg --kind MongoDB

# Tạo Azure Cache for Redis
az redis create --name flood-risk-cache --resource-group flood-risk-rg --location southeastasia --sku Basic --vm-size c0

# Tạo Azure Storage Account
az storage account create --name floodriskstorage --resource-group flood-risk-rg --location southeastasia --sku Standard_LRS

# Tạo Azure Web App
az appservice plan create --name flood-risk-plan --resource-group flood-risk-rg --is-linux
az webapp create --resource-group flood-risk-rg --plan flood-risk-plan --name flood-risk-backend --deployment-container-image-name floodriskacr.azurecr.io/flood-risk-backend:latest
```

### 2. Cấu hình Environment Variables

Tạo file `.env.azure` với thông tin Azure:

```bash
# Azure Configuration
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# MongoDB Atlas or Azure Cosmos DB
MONGODB_URI=mongodb://flood-risk-db.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&maxIdleTimeMS=120000&appName=@flood-risk-db@

# Redis Cache
REDIS_URL=rediss://flood-risk-cache.redis.cache.windows.net:6380,password=your-redis-key,ssl=True,abortConnect=False

# Storage Account
AZURE_STORAGE_ACCOUNT=floodriskstorage
AZURE_STORAGE_KEY=your-storage-key

# Container Registry
DOCKER_REGISTRY=floodriskacr.azurecr.io
IMAGE_TAG=latest

# JWT Secrets (generate strong ones)
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here

# CORS Origin
CORS_ORIGIN=https://your-frontend-domain.com
```

### 3. Build và Push Image lên Azure

```bash
# Login vào Azure Container Registry
az acr login --name floodriskacr

# Build và tag image
docker build -t floodriskacr.azurecr.io/flood-risk-backend:latest .

# Push image lên ACR
docker push floodriskacr.azurecr.io/flood-risk-backend:latest
```

### 4. Deploy lên Azure Web App

```bash
# Cấu hình Web App để sử dụng container
az webapp config container set \
  --name flood-risk-backend \
  --resource-group flood-risk-rg \
  --docker-custom-image-name floodriskacr.azurecr.io/flood-risk-backend:latest \
  --docker-registry-server-url https://floodriskacr.azurecr.io \
  --docker-registry-server-user floodriskacr \
  --docker-registry-server-password $(az acr credential show --name floodriskacr --query passwords[0].value -o tsv)

# Cấu hình environment variables
az webapp config appsettings set \
  --name flood-risk-backend \
  --resource-group flood-risk-rg \
  --setting NODE_ENV=production \
  --setting MONGODB_URI="$MONGODB_URI" \
  --setting REDIS_URL="$REDIS_URL" \
  --setting JWT_SECRET="$JWT_SECRET" \
  --setting JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  --setting CORS_ORIGIN="$CORS_ORIGIN"
```

## 🔄 Cấu hình CI/CD

### Azure DevOps Pipeline

1. **Import pipeline:**
   ```bash
   # Copy azure-pipelines.yml vào root của repository
   # Import vào Azure DevOps Pipeline
   ```

2. **Cấu hình Service Connections:**
   - Azure Container Registry connection
   - Azure subscription connection

3. **Cấu hình Variables:**
   ```
   DOCKER_REGISTRY: floodriskacr.azurecr.io
   AZURE_SUBSCRIPTION: your-subscription
   MONGODB_DEV_URI: your-dev-mongo-uri
   MONGODB_PROD_URI: your-prod-mongo-uri
   JWT_SECRET_DEV: your-dev-jwt-secret
   JWT_SECRET_PROD: your-prod-jwt-secret
   ```

### GitHub Actions (Alternative)

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Build and push Docker image
      uses: azure/docker-login@v1
      with:
        login-server: floodriskacr.azurecr.io
        username: ${{ secrets.ACR_USERNAME }}
        password: ${{ secrets.ACR_PASSWORD }}

    - name: Build and push
      run: |
        docker build -t floodriskacr.azurecr.io/flood-risk-backend:${{ github.sha }} .
        docker push floodriskacr.azurecr.io/flood-risk-backend:${{ github.sha }}

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: flood-risk-backend
        images: floodriskacr.azurecr.io/flood-risk-backend:${{ github.sha }}
```

## 📊 Monitoring & Logging

### Health Checks

```bash
# Check API health
curl http://localhost:5000/health

# Check trong Docker
docker ps
docker logs flood_risk_api_prod
```

### Logs

```bash
# Xem logs của container
docker logs -f flood_risk_api_prod

# Xem logs của tất cả services
docker-compose -f docker-compose.prod.yml logs -f

# Logs trong Azure
az webapp log download --name flood-risk-backend --resource-group flood-risk-rg
```

### Metrics với Azure Monitor

```bash
# Enable Application Insights
az monitor app-insights component create \
  --app flood-risk-app-insights \
  --location southeastasia \
  --resource-group flood-risk-rg \
  --application-type web

# Connect với Web App
az webapp config appsettings set \
  --name flood-risk-backend \
  --resource-group flood-risk-rg \
  --setting APPINSIGHTS_INSTRUMENTATIONKEY=$(az monitor app-insights component show --app flood-risk-app-insights --resource-group flood-risk-rg --query instrumentationKey -o tsv)
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port conflicts
```bash
# Check ports in use
netstat -tulpn | grep :5000

# Stop conflicting service
sudo systemctl stop apache2
# or
sudo systemctl stop nginx
```

#### 2. MongoDB connection issues
```bash
# Check MongoDB container
docker logs flood_risk_mongodb_prod

# Connect to MongoDB shell
docker exec -it flood_risk_mongodb_prod mongosh -u admin -p password123

# Test connection
docker exec flood_risk_api_prod node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"
```

#### 3. Redis connection issues
```bash
# Check Redis container
docker logs flood_risk_redis_prod

# Test Redis connection
docker exec -it flood_risk_redis_prod redis-cli ping
```

#### 4. Permission issues
```bash
# Fix file permissions
sudo chown -R 1001:1001 uploads/ logs/ backups/

# Fix Docker socket permissions
sudo usermod -aG docker $USER
newgrp docker
```

#### 5. Memory issues
```bash
# Check container resource usage
docker stats

# Increase Docker memory limit
# Docker Desktop: Preferences > Resources > Memory
```

### Azure Specific Issues

#### Container Registry authentication
```bash
# Login to ACR
az acr login --name floodriskacr

# Check ACR repositories
az acr repository list --name floodriskacr --output table
```

#### Web App deployment issues
```bash
# Check deployment logs
az webapp log tail --name flood-risk-backend --resource-group flood-risk-rg

# Restart Web App
az webapp restart --name flood-risk-backend --resource-group flood-risk-rg
```

## 📚 Scripts hữu ích

```bash
# Development
npm run docker:dev          # Start dev environment
npm run docker:stop         # Stop all containers
npm run docker:clean        # Clean up Docker

# Production
npm run docker:prod         # Start production environment
npm run docker:azure        # Deploy to Azure

# Azure helpers
az webapp log tail --name flood-risk-backend --resource-group flood-risk-rg
az container logs --resource-group flood-risk-rg --name flood-risk-backend
```

## 🔐 Security Best Practices

### Docker Security
- Sử dụng non-root user trong containers
- Scan images với Trivy trước khi deploy
- Giữ Docker và dependencies updated
- Sử dụng secrets management (Azure Key Vault)

### Azure Security
- Enable Azure Defender
- Use managed identities
- Configure network security groups
- Enable Azure Front Door for DDoS protection
- Use Azure Key Vault cho secrets

## 📞 Support

Nếu gặp vấn đề:
1. Check logs: `docker logs <container_name>`
2. Check health: `curl http://localhost:5000/health`
3. Azure logs: `az webapp log tail`
4. Documentation: `README.md`, `ENV_CONFIG.md`

---

**🎯 Quick Start:**
```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose -f docker-compose.prod.yml up --build -d

# Azure
az login && npm run docker:azure
```
