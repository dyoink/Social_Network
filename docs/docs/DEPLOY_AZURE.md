# 🚀 Hướng Dẫn Deploy Social Network App — Azure

## 📋 Tổng Quan Stack

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Backend | ASP.NET Core .NET 10, SignalR | Port 8080 (container) / 5000 (bare metal) |
| Frontend | React 19 + Vite → Static files | Build ra HTML/JS/CSS |
| Database | PostgreSQL 15 | Cần persistent storage |
| File Storage | `/wwwroot/uploads`, `/wwwroot/videos` | Nên migrate sang Azure Blob production |
| Auth | JWT 7 ngày | Secret Key phải giữ trong Key Vault |

---

## 🗺️ 3 Kế Hoạch Deploy Azure

| | Plan A | Plan B | Plan C |
|---|---|---|---|
| **Tên** | Azure VM | App Service + Postgres Flexible + Blob | Container Apps + Docker |
| **Chi phí/tháng** | ~$20–30 | ~$70–100 | ~$60–90 |
| **Phù hợp** | Demo, Portfolio | Startup MVP | Production, CI/CD |
| **Uptime** | ~99% | ~99.95% | ~99.95% |
| **Scale** | Manual | Auto hạn chế | Auto hoàn toàn |
| **Setup time** | 2–4 giờ | 1 ngày | 1–2 ngày |

---

## ⚡ Plan A — Azure VM (Đơn Giản Nhất)

### Kiến Trúc

```
Internet → Azure VM (Nginx reverse proxy)
                ├── Frontend (static files /var/www)
                ├── Backend (.NET app, systemd service)
                └── PostgreSQL (local)
```

### Tài Nguyên Azure & Chi Phí

```
Azure VM B2s  (2 vCPU, 4GB RAM)   ~$30/tháng
OS Disk 30GB SSD                   Bao gồm
Static IP (Public IP Standard)     ~$3/tháng
Azure DNS Zone                     $0.50/tháng
App Gateway / Nginx trên VM        $0
─────────────────────────────────────────────
Tổng ước tính                      ~$33/tháng

💰 Tiết kiệm: Dùng B1s (1 vCPU, 1GB) = ~$8/tháng (dev/demo)
```

### Bước 1 — Cài Azure CLI & Tạo Resource Group

```bash
# Cài Azure CLI
# Windows:
winget install Microsoft.AzureCLI
# Linux/macOS:
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Đăng nhập
az login

# Tạo Resource Group
az group create \
  --name rg-socialnetwork-prod \
  --location southeastasia

# Liệt kê các location
az account list-locations --query "[].{Name:name,Display:displayName}" -o table
```

### Bước 2 — Tạo Azure VM

```bash
# Tạo VM Ubuntu 22.04
az vm create \
  --resource-group rg-socialnetwork-prod \
  --name vm-socialnetwork \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --output json

# Mở các port cần thiết
az vm open-port \
  --resource-group rg-socialnetwork-prod \
  --name vm-socialnetwork \
  --port 80 --priority 100
az vm open-port \
  --resource-group rg-socialnetwork-prod \
  --name vm-socialnetwork \
  --port 443 --priority 110

# Lấy Public IP
az vm show \
  --resource-group rg-socialnetwork-prod \
  --name vm-socialnetwork \
  --show-details \
  --query publicIps \
  --output tsv

# SSH vào VM
ssh azureuser@VM_PUBLIC_IP
```

### Bước 3 — Cài Phần Mềm Trên VM

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài .NET 10 Runtime
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update && sudo apt install -y aspnetcore-runtime-10.0

# Cài PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql && sudo systemctl start postgresql

# Cài Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx

# Cài Node.js 22 (build frontend nếu cần)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Bước 4 — Cài Đặt PostgreSQL

```bash
sudo -u postgres psql << 'EOF'
CREATE USER socialadmin WITH PASSWORD 'YourStrongPass123!';
CREATE DATABASE "SocialNetworkDb" OWNER socialadmin;
GRANT ALL PRIVILEGES ON DATABASE "SocialNetworkDb" TO socialadmin;
EOF
```

### Bước 5 — Deploy Backend

```bash
# === Trên máy local ===
cd backend/SocialNetwork.Api
dotnet publish -c Release -r linux-x64 --self-contained false -o ./../../publish/backend

scp -r ./../../publish/backend azureuser@VM_IP:/tmp/backend
```

```bash
# === Trên Azure VM ===
sudo mkdir -p /opt/socialnetwork/backend
sudo cp -r /tmp/backend/* /opt/socialnetwork/backend/
sudo mkdir -p /opt/socialnetwork/backend/wwwroot/{uploads,videos}
sudo chown -R www-data:www-data /opt/socialnetwork/backend
```

### Bước 6 — Biến Môi Trường

```bash
sudo nano /etc/socialnetwork.env
```

```ini
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://localhost:5000
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=SocialNetworkDb;Username=socialadmin;Password=YourStrongPass123!
Jwt__SecretKey=REPLACE_WITH_64_CHAR_RANDOM_STRING
Jwt__Issuer=SocialNetworkApi
Jwt__Audience=SocialNetworkClient
Jwt__ExpiryDays=7
Frontend__Url=https://yourdomain.com
```

```bash
# Tạo JWT secret mạnh
openssl rand -base64 64

sudo chmod 600 /etc/socialnetwork.env
sudo chown root:root /etc/socialnetwork.env
```

### Bước 7 — Tạo Systemd Service

```bash
sudo nano /etc/systemd/system/socialnetwork-api.service
```

```ini
[Unit]
Description=Social Network ASP.NET Core API
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/socialnetwork/backend
ExecStart=/usr/bin/dotnet /opt/socialnetwork/backend/SocialNetwork.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=socialnetwork-api
EnvironmentFile=/etc/socialnetwork.env
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable socialnetwork-api
sudo systemctl start socialnetwork-api
sudo systemctl status socialnetwork-api
sudo journalctl -u socialnetwork-api -f   # xem log realtime
```

### Bước 8 — Deploy Frontend & Cấu Hình Nginx

```bash
# Build trên máy local
cd frontend
cat > .env.production << 'EOF'
VITE_API_URL=https://api.yourdomain.com
EOF
npm ci && npm run build
scp -r ./dist azureuser@VM_IP:/tmp/frontend-dist

# Trên Azure VM
sudo mkdir -p /var/www/socialnetwork
sudo cp -r /tmp/frontend-dist/* /var/www/socialnetwork/
sudo chown -R www-data:www-data /var/www/socialnetwork
```

```bash
sudo nano /etc/nginx/sites-available/socialnetwork
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/socialnetwork;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
    }
    location /videos/ {
        proxy_pass http://localhost:5000/videos/;
        proxy_set_header Host $host;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SignalR WebSocket — bắt buộc
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/socialnetwork /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Cài HTTPS với Let's Encrypt
sudo certbot --nginx \
  -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com \
  --agree-tos --non-interactive --email your@email.com
```

---

## 🏗️ Plan B — Azure App Service + PostgreSQL Flexible + Blob Storage

### Kiến Trúc

```
Azure Static Web Apps (Frontend SPA)
              ↓ API calls
Azure App Service (ASP.NET Core Backend)
     ├── Managed Identity (không cần password trong code)
     ├── Azure Key Vault (JWT secret, connection string)
              ↓
Azure Database for PostgreSQL Flexible Server
              ↓
Azure Blob Storage (file uploads, videos)
```

### Tài Nguyên Azure & Chi Phí

```
App Service Plan B2 (Linux)             ~$30/tháng
Azure DB PostgreSQL Flexible Burstable B1ms  ~$25/tháng
Azure Blob Storage 10GB + transactions  ~$2/tháng
Azure Static Web Apps                   Miễn phí (Free plan)
Azure Key Vault                         ~$0.50/tháng
Application Insights (monitoring)       ~$5/tháng
Azure DNS Zone                          $0.50/tháng
─────────────────────────────────────────────
Tổng ước tính                           ~$63–80/tháng
```

### Bước 1 — Tạo Azure Database for PostgreSQL

```bash
# Tạo PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-db-server \
  --location southeastasia \
  --admin-user socialadmin \
  --admin-password "YourStrongAzPass123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --backup-retention 7 \
  --geo-redundant-backup Disabled

# Tạo database
az postgres flexible-server db create \
  --resource-group rg-socialnetwork-prod \
  --server-name socialnetwork-db-server \
  --database-name SocialNetworkDb

# Cấu hình firewall — chỉ cho phép từ Azure services
az postgres flexible-server firewall-rule create \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-db-server \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Lấy connection string
az postgres flexible-server show-connection-string \
  --server-name socialnetwork-db-server \
  --database-name SocialNetworkDb \
  --admin-user socialadmin \
  --query connectionStrings
```

### Bước 2 — Tạo Azure Blob Storage

```bash
# Tạo Storage Account
az storage account create \
  --name socialnetworkstorage \
  --resource-group rg-socialnetwork-prod \
  --location southeastasia \
  --sku Standard_LRS \
  --kind StorageV2 \
  --https-only true \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false

# Tạo containers
az storage container create \
  --name uploads \
  --account-name socialnetworkstorage \
  --public-access off

az storage container create \
  --name videos \
  --account-name socialnetworkstorage \
  --public-access off

# Lấy connection string
az storage account show-connection-string \
  --name socialnetworkstorage \
  --resource-group rg-socialnetwork-prod \
  --query connectionString \
  --output tsv
```

### Bước 3 — Tạo Azure Key Vault

```bash
# Tạo Key Vault
az keyvault create \
  --name kv-socialnetwork-prod \
  --resource-group rg-socialnetwork-prod \
  --location southeastasia \
  --sku standard

# Tạo JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Lưu secrets vào Key Vault
az keyvault secret set \
  --vault-name kv-socialnetwork-prod \
  --name "JwtSecretKey" \
  --value "$JWT_SECRET"

az keyvault secret set \
  --vault-name kv-socialnetwork-prod \
  --name "DbConnectionString" \
  --value "Host=socialnetwork-db-server.postgres.database.azure.com;Port=5432;Database=SocialNetworkDb;Username=socialadmin;Password=YourStrongAzPass123!;SSL Mode=Require"

az keyvault secret set \
  --vault-name kv-socialnetwork-prod \
  --name "StorageConnectionString" \
  --value "$(az storage account show-connection-string --name socialnetworkstorage -g rg-socialnetwork-prod --query connectionString -o tsv)"
```

### Bước 4 — Tạo Azure App Service

```bash
# Tạo App Service Plan (Linux)
az appservice plan create \
  --name asp-socialnetwork \
  --resource-group rg-socialnetwork-prod \
  --sku B2 \
  --is-linux

# Tạo Web App
az webapp create \
  --resource-group rg-socialnetwork-prod \
  --plan asp-socialnetwork \
  --name socialnetwork-api \
  --runtime "DOTNETCORE:10.0"

# Bật System-Assigned Managed Identity
az webapp identity assign \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api

# Lấy Principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api \
  --query principalId \
  --output tsv)

# Cấp quyền đọc Key Vault cho App Service
az keyvault set-policy \
  --name kv-socialnetwork-prod \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list

# Cấu hình App Settings
az webapp config appsettings set \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api \
  --settings \
    ASPNETCORE_ENVIRONMENT=Production \
    Frontend__Url=https://yourdomain.com \
    Jwt__Issuer=SocialNetworkApi \
    Jwt__Audience=SocialNetworkClient \
    Jwt__ExpiryDays=7 \
    KeyVaultUri=https://kv-socialnetwork-prod.vault.azure.net/

# Connection strings (tự động mã hóa trong App Service)
az webapp config connection-string set \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api \
  --connection-string-type PostgreSQL \
  --settings DefaultConnection="Host=socialnetwork-db-server.postgres.database.azure.com;Port=5432;Database=SocialNetworkDb;Username=socialadmin;Password=YourStrongAzPass123!;SSL Mode=Require"
```

### Bước 5 — Tích Hợp Key Vault Vào Backend Code

```xml
<!-- Thêm vào SocialNetwork.Api.csproj -->
<PackageReference Include="Azure.Extensions.AspNetCore.Configuration.Secrets" Version="1.*" />
<PackageReference Include="Azure.Identity" Version="1.*" />
```

```csharp
// Program.cs — thêm trước builder.Build()
if (builder.Environment.IsProduction())
{
    var keyVaultUri = builder.Configuration["KeyVaultUri"];
    if (!string.IsNullOrEmpty(keyVaultUri))
    {
        builder.Configuration.AddAzureKeyVault(
            new Uri(keyVaultUri),
            new DefaultAzureCredential());
    }
}
```

```json
// appsettings.Production.json
{
  "Jwt": {
    "SecretKey": "JwtSecretKey"
  },
  "ConnectionStrings": {
    "DefaultConnection": "DbConnectionString"
  }
}
```

> `DefaultAzureCredential` tự động dùng Managed Identity khi chạy trên App Service — không cần username/password trong code.

### Bước 6 — Deploy Backend Lên App Service

```bash
# Cách 1: Deploy trực tiếp từ ZIP
cd backend/SocialNetwork.Api
dotnet publish -c Release -o ./publish
cd ./publish
zip -r ../deploy.zip .

az webapp deployment source config-zip \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api \
  --src ../deploy.zip

# Kiểm tra deployment
az webapp log deployment show \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api

# Xem logs realtime
az webapp log tail \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api
```

### Bước 7 — Deploy Frontend Lên Azure Static Web Apps

```bash
# Cài SWA CLI
npm install -g @azure/static-web-apps-cli

# Tạo Static Web App
az staticwebapp create \
  --name socialnetwork-frontend \
  --resource-group rg-socialnetwork-prod \
  --source https://github.com/YOUR_ORG/YOUR_REPO \
  --location eastasia \
  --branch main \
  --app-location frontend \
  --output-location dist \
  --login-with-github

# Hoặc deploy thủ công
cd frontend
cat > .env.production << 'EOF'
VITE_API_URL=https://socialnetwork-api.azurewebsites.net
EOF
npm ci && npm run build

# Deploy bằng SWA CLI
SWA_TOKEN=$(az staticwebapp secrets list \
  --name socialnetwork-frontend \
  --query properties.apiKey \
  --output tsv)

swa deploy ./dist \
  --deployment-token $SWA_TOKEN \
  --env production
```

### Bước 8 — Custom Domain + HTTPS

```bash
# App Service Custom Domain
az webapp config hostname add \
  --resource-group rg-socialnetwork-prod \
  --webapp-name socialnetwork-api \
  --hostname api.yourdomain.com

# Mua/bind SSL certificate (App Service Managed Certificate - miễn phí)
az webapp config ssl bind \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api \
  --certificate-thumbprint YOUR_CERT_THUMBPRINT \
  --ssl-type SNI

# Static Web App custom domain
az staticwebapp hostname set \
  --name socialnetwork-frontend \
  --resource-group rg-socialnetwork-prod \
  --hostname yourdomain.com
```

### Bước 9 — Application Insights Monitoring

```bash
# Tạo Application Insights
az monitor app-insights component create \
  --app socialnetwork-insights \
  --location southeastasia \
  --resource-group rg-socialnetwork-prod \
  --kind web

# Lấy Instrumentation Key
INSIGHTS_KEY=$(az monitor app-insights component show \
  --app socialnetwork-insights \
  --resource-group rg-socialnetwork-prod \
  --query instrumentationKey \
  --output tsv)

# Gắn vào App Service
az webapp config appsettings set \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$INSIGHTS_KEY

# Tạo Alert khi API có lỗi 5xx
az monitor metrics alert create \
  --name "High 5xx Error Rate" \
  --resource-group rg-socialnetwork-prod \
  --scopes /subscriptions/SUB_ID/resourceGroups/rg-socialnetwork-prod/providers/Microsoft.Web/sites/socialnetwork-api \
  --condition "avg requests/failed gt 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action /subscriptions/SUB_ID/resourceGroups/rg-socialnetwork-prod/providers/microsoft.insights/actionGroups/emailAlert
```

---

## 🐳 Plan C — Azure Container Apps + Docker + CI/CD

### Kiến Trúc

```
GitHub Actions
      ↓ build & push image
Azure Container Registry (ACR)
      ↓
Azure Container Apps Environment
├── Container App: socialnetwork-api (min 1, max 10 replicas)
└── Ingress (HTTPS, tự động TLS)
      ↓
Azure Database for PostgreSQL Flexible (General Purpose)
Azure Cache for Redis (SignalR backplane)
Azure Blob Storage (uploads, videos)
Azure Static Web Apps (frontend)
```

### Tài Nguyên Azure & Chi Phí

```
Container Apps                    ~$20–40/tháng (pay-per-request)
Container Registry Basic          ~$5/tháng
PostgreSQL Flexible Standard D2s  ~$40/tháng
Azure Cache for Redis C0          ~$15/tháng
Azure Blob Storage 10GB           ~$2/tháng
Static Web Apps                   Miễn phí
─────────────────────────────────────────────
Tổng ước tính                     ~$82–102/tháng
```

### Bước 1 — Tạo Azure Container Registry (ACR)

```bash
# Tạo ACR
az acr create \
  --resource-group rg-socialnetwork-prod \
  --name socialnetworkacr \
  --sku Basic \
  --admin-enabled false

# Đăng nhập ACR
az acr login --name socialnetworkacr

# Lấy ACR login server
ACR_SERVER=$(az acr show \
  --name socialnetworkacr \
  --query loginServer \
  --output tsv)
# → socialnetworkacr.azurecr.io
```

### Bước 2 — Tạo Dockerfile Backend

```dockerfile
# backend/SocialNetwork.Api/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["SocialNetwork.Api.csproj", "."]
RUN dotnet restore --runtime linux-x64
COPY . .
RUN dotnet publish -c Release -r linux-x64 --self-contained false -o /app/publish

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p wwwroot/uploads wwwroot/videos
ENTRYPOINT ["dotnet", "SocialNetwork.Api.dll"]
```

### Bước 3 — Build & Push Image Thủ Công

```bash
# Build bằng ACR Tasks (không cần Docker cài cục bộ)
az acr build \
  --registry socialnetworkacr \
  --image socialnetwork-api:latest \
  --file backend/SocialNetwork.Api/Dockerfile \
  backend/SocialNetwork.Api/

# Hoặc build cục bộ rồi push
docker build \
  -t $ACR_SERVER/socialnetwork-api:latest \
  -f backend/SocialNetwork.Api/Dockerfile \
  backend/SocialNetwork.Api/
docker push $ACR_SERVER/socialnetwork-api:latest
```

### Bước 4 — Tạo Container Apps Environment

```bash
# Cài extension
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights

# Tạo Container Apps environment
az containerapp env create \
  --name cae-socialnetwork \
  --resource-group rg-socialnetwork-prod \
  --location southeastasia

# Tạo managed identity cho Container App
az identity create \
  --name id-socialnetwork-api \
  --resource-group rg-socialnetwork-prod

IDENTITY_ID=$(az identity show \
  --name id-socialnetwork-api \
  --resource-group rg-socialnetwork-prod \
  --query id \
  --output tsv)

IDENTITY_CLIENT_ID=$(az identity show \
  --name id-socialnetwork-api \
  --resource-group rg-socialnetwork-prod \
  --query clientId \
  --output tsv)

# Cấp quyền pull image từ ACR
az role assignment create \
  --assignee $IDENTITY_CLIENT_ID \
  --scope $(az acr show --name socialnetworkacr --query id --output tsv) \
  --role AcrPull

# Cấp quyền đọc Key Vault
az keyvault set-policy \
  --name kv-socialnetwork-prod \
  --spn $IDENTITY_CLIENT_ID \
  --secret-permissions get list
```

### Bước 5 — Deploy Container App

```bash
# Lấy connection string Postgres
DB_CONNECTION="Host=socialnetwork-db-server.postgres.database.azure.com;Port=5432;Database=SocialNetworkDb;Username=socialadmin;Password=YourStrongAzPass123!;SSL Mode=Require"
JWT_SECRET=$(openssl rand -base64 64)

# Deploy Container App
az containerapp create \
  --name socialnetwork-api \
  --resource-group rg-socialnetwork-prod \
  --environment cae-socialnetwork \
  --image $ACR_SERVER/socialnetwork-api:latest \
  --user-assigned $IDENTITY_ID \
  --registry-server $ACR_SERVER \
  --registry-identity $IDENTITY_ID \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    ASPNETCORE_ENVIRONMENT=Production \
    Frontend__Url=https://yourdomain.com \
    Jwt__Issuer=SocialNetworkApi \
    Jwt__Audience=SocialNetworkClient \
    Jwt__ExpiryDays=7 \
    ConnectionStrings__DefaultConnection=secretref:db-connection \
    Jwt__SecretKey=secretref:jwt-secret \
  --secrets \
    "db-connection=$DB_CONNECTION" \
    "jwt-secret=$JWT_SECRET"

# Lấy URL của Container App
az containerapp show \
  --name socialnetwork-api \
  --resource-group rg-socialnetwork-prod \
  --query properties.configuration.ingress.fqdn \
  --output tsv
# → socialnetwork-api.gentlecoast-12345678.southeastasia.azurecontainerapps.io
```

### Bước 6 — GitHub Actions CI/CD

```bash
mkdir -p .github/workflows
```

```yaml
# .github/workflows/deploy-azure.yml
name: Deploy to Azure Container Apps

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AZURE_CONTAINER_REGISTRY: socialnetworkacr.azurecr.io
  CONTAINER_APP_NAME: socialnetwork-api
  RESOURCE_GROUP: rg-socialnetwork-prod
  CONTAINER_APP_ENV: cae-socialnetwork

jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build & Push backend image to ACR
        run: |
          az acr build \
            --registry socialnetworkacr \
            --image socialnetwork-api:${{ github.sha }} \
            --image socialnetwork-api:latest \
            --file backend/SocialNetwork.Api/Dockerfile \
            backend/SocialNetwork.Api/

      - name: Deploy to Azure Container Apps
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP_NAME }} \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.AZURE_CONTAINER_REGISTRY }}/socialnetwork-api:${{ github.sha }}

      - name: Build & deploy frontend to Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: upload
          app_location: frontend
          output_location: dist
          app_build_command: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
```

**GitHub Secrets cần thiết:**

| Secret | Cách tạo |
|---|---|
| `AZURE_CREDENTIALS` | `az ad sp create-for-rbac --name "github-deploy" --role contributor --scopes /subscriptions/SUB_ID/resourceGroups/rg-socialnetwork-prod --sdk-auth` |
| `AZURE_STATIC_WEB_APPS_TOKEN` | Lấy từ Azure Portal → Static Web App → Manage token |
| `API_URL` | URL của Container App: `https://socialnetwork-api.xxx.azurecontainerapps.io` |

### Bước 7 — Azure Cache for Redis (SignalR Backplane)

> **Bắt buộc** khi Container App scale lên nhiều replicas.

```bash
# Tạo Azure Cache for Redis
az redis create \
  --name socialnetwork-redis \
  --resource-group rg-socialnetwork-prod \
  --location southeastasia \
  --sku Basic \
  --vm-size C0 \
  --enable-non-ssl-port false   # chỉ dùng SSL port 6380

# Lấy connection string
REDIS_KEY=$(az redis list-keys \
  --name socialnetwork-redis \
  --resource-group rg-socialnetwork-prod \
  --query primaryKey \
  --output tsv)
REDIS_HOST="socialnetwork-redis.redis.cache.windows.net:6380,password=$REDIS_KEY,ssl=True,abortConnect=False"
```

```xml
<!-- Thêm vào SocialNetwork.Api.csproj -->
<PackageReference Include="Microsoft.AspNetCore.SignalR.StackExchangeRedis" Version="10.0.*" />
```

```csharp
// Program.cs — thay AddSignalR() hiện tại
builder.Services.AddSignalR()
    .AddStackExchangeRedis(
        builder.Configuration["Redis:ConnectionString"],
        options => options.Configuration.ChannelPrefix =
            RedisChannel.Literal("SocialNetwork"));
```

```json
// appsettings.Production.json
{
  "Redis": {
    "ConnectionString": "socialnetwork-redis.redis.cache.windows.net:6380,password=YOUR_KEY,ssl=True,abortConnect=False"
  }
}
```

---

## 🔐 Bảo Mật Azure — Checklist

```bash
# ✅ 1. Dùng Managed Identity thay vì Service Principal password
az webapp identity assign \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api

# ✅ 2. Enable Defender for Cloud
az security pricing create \
  --name AppServices \
  --tier Standard

# ✅ 3. Bật PostgreSQL SSL bắt buộc
az postgres flexible-server parameter set \
  --resource-group rg-socialnetwork-prod \
  --server-name socialnetwork-db-server \
  --name require_secure_transport \
  --value ON

# ✅ 4. Network isolation — dùng Private Endpoint cho PostgreSQL
az network private-endpoint create \
  --name pe-postgres \
  --resource-group rg-socialnetwork-prod \
  --vnet-name vnet-socialnetwork \
  --subnet subnet-private \
  --private-connection-resource-id $(az postgres flexible-server show --name socialnetwork-db-server -g rg-socialnetwork-prod --query id -o tsv) \
  --group-id postgresqlServer \
  --connection-name postgres-connection

# ✅ 5. App Service Access Restriction (chỉ cho Front Door/CDN)
az webapp config access-restriction add \
  --resource-group rg-socialnetwork-prod \
  --name socialnetwork-api \
  --rule-name "AllowFrontDoor" \
  --action Allow \
  --service-tag AzureFrontDoor.Backend \
  --priority 100

# ✅ 6. Key Vault soft-delete & purge protection
az keyvault update \
  --name kv-socialnetwork-prod \
  --enable-soft-delete true \
  --enable-purge-protection true

# ✅ 7. WAF với Azure Front Door
az afd profile create \
  --profile-name socialnetwork-fd \
  --resource-group rg-socialnetwork-prod \
  --sku Standard_AzureFrontDoor
```

---

## 📊 So Sánh 3 Plan Azure

| | Plan A — Azure VM | Plan B — App Service + PostgreSQL | Plan C — Container Apps |
|---|---|---|---|
| **Chi phí/tháng** | ~$33 | ~$75 | ~$90 |
| **Setup time** | 3 giờ | 1 ngày | 1–2 ngày |
| **CI/CD** | Thủ công | Tùy chọn | GitHub Actions tự động |
| **Auto scaling** | ❌ | ✅ hạn chế | ✅ scale-to-zero |
| **Managed DB** | ❌ self-hosted | ✅ Azure DB for PostgreSQL | ✅ PostgreSQL Flexible |
| **TLS/HTTPS** | Let's Encrypt | App Service Managed Certificate | Ingress tự động |
| **Uptime SLA** | ~99% | ~99.95% | ~99.95% |
| **SignalR scale** | 1 instance OK | 1 instance OK | Cần Redis |
| **File uploads** | Local disk ⚠️ | Azure Blob ✅ | Azure Blob ✅ |
| **Monitoring** | Manual | App Insights tích hợp | App Insights + Container Insights |
| **Container** | ❌ | ❌ (có thể bật) | ✅ native |
| **Microsoft ecosystem** | ✅ | ✅✅ (tích hợp sâu) | ✅✅✅ |

---

## 💡 Khuyến Nghị

| Mục đích | Chọn |
|---|---|
| Demo, portfolio, học tập | **Plan A** — Azure VM B1s (~$8/tháng) |
| ASP.NET Core, tích hợp Azure sâu | **Plan B** — App Service + PostgreSQL Flexible |
| Production thật, CI/CD Docker | **Plan C** — Container Apps |
| Tiết kiệm tối đa | **Plan B** — App Service F1 Free (~$0) + PostgreSQL Free Tier |

> **💰 Tiết kiệm chi phí Azure:**
> - App Service **F1 Free** (60 CPU phút/ngày) đủ cho demo nhỏ
> - Azure DB for PostgreSQL **Flexible Burstable B1ms** ~$12/tháng cho dev
> - Azure for Students — $100 credit miễn phí/năm
> - Visual Studio Subscription — $150/tháng Azure credit (Dev Essentials)

---

## 🔄 So Sánh Nhanh AWS vs Azure

| | AWS | Azure |
|---|---|---|
| **Phù hợp khi** | Muốn ecosystem rộng, nhiều service | ASP.NET Core, Microsoft stack |
| **Database** | RDS PostgreSQL | Azure DB for PostgreSQL |
| **File storage** | S3 | Azure Blob Storage |
| **Serverless container** | ECS Fargate | Container Apps (scale-to-zero tốt hơn) |
| **Static hosting** | S3 + CloudFront | Azure Static Web Apps (miễn phí) |
| **Secrets** | Secrets Manager | Key Vault |
| **Monitoring** | CloudWatch | Application Insights |
| **Free tier** | 12 tháng + Always free | $200 credit + Always free tier |
| **Giá cạnh tranh** | Tương đương | Rẻ hơn ~10-15% cho VM |
