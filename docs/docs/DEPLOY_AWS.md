# 🚀 Hướng Dẫn Deploy Social Network App — AWS

## 📋 Tổng Quan Stack

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Backend | ASP.NET Core .NET 10, SignalR | Port 8080 (container) / 5000 (bare metal) |
| Frontend | React 19 + Vite → Static files | Build ra HTML/JS/CSS |
| Database | PostgreSQL 15 | Cần persistent storage |
| File Storage | `/wwwroot/uploads`, `/wwwroot/videos` | Nên migrate sang S3 production |
| Auth | JWT 7 ngày | Secret Key phải giữ trong Secrets Manager |

---

## 🗺️ 3 Kế Hoạch Deploy AWS

| | Plan A | Plan B | Plan C |
|---|---|---|---|
| **Tên** | Single EC2 | Elastic Beanstalk + RDS + S3 | ECS Fargate + Docker |
| **Chi phí/tháng** | ~$15–25 | ~$80–120 | ~$70–100 |
| **Phù hợp** | Demo, Portfolio | Startup MVP | Production, CI/CD |
| **Uptime** | ~99% | ~99.9% | ~99.9% |
| **Scale** | Manual | Auto hạn chế | Auto hoàn toàn |
| **Setup time** | 2–4 giờ | 1 ngày | 1–2 ngày |

---

## ⚡ Plan A — Single EC2 (Đơn Giản Nhất)

### Kiến Trúc

```
Internet → EC2 (Nginx reverse proxy)
                ├── Frontend (static files /var/www)
                ├── Backend (.NET app, systemd service)
                └── PostgreSQL (local)
```

### Tài Nguyên AWS Cần Tạo

```
EC2 t3.small  (2 vCPU, 2GB RAM)   ~$15/tháng
EBS gp3 20GB  (OS + app + uploads) ~$1.6/tháng
Elastic IP    (miễn phí khi gắn EC2)
Route53       (hosted zone)         $0.50/tháng
ACM Certificate (HTTPS)             Miễn phí
```

### Bước 1 — Tạo EC2

```bash
# AWS Console → EC2 → Launch Instance
# - AMI: Ubuntu 22.04 LTS
# - Instance type: t3.small
# - Key pair: tạo mới, download file .pem
# - Security group — mở các port:
#     22   (SSH)        — chỉ IP của bạn
#     80   (HTTP)       — 0.0.0.0/0
#     443  (HTTPS)      — 0.0.0.0/0
# - Storage: 20GB gp3

ssh -i "your-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

### Bước 2 — Cài Phần Mềm

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

# Cài Node.js 22 (nếu muốn build frontend trên server)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Bước 3 — Cài Đặt PostgreSQL

```bash
sudo -u postgres psql << 'EOF'
CREATE USER socialadmin WITH PASSWORD 'YourStrongPass123!';
CREATE DATABASE "SocialNetworkDb" OWNER socialadmin;
GRANT ALL PRIVILEGES ON DATABASE "SocialNetworkDb" TO socialadmin;
EOF
```

### Bước 4 — Build & Deploy Backend

```bash
# === Trên máy local ===
cd backend/SocialNetwork.Api

dotnet publish \
  -c Release \
  -r linux-x64 \
  --self-contained false \
  -o ./../../publish/backend

# Upload lên EC2
scp -i your-key.pem -r ./../../publish/backend \
  ubuntu@EC2_IP:/tmp/backend
```

```bash
# === Trên EC2 ===
sudo mkdir -p /opt/socialnetwork/backend
sudo cp -r /tmp/backend/* /opt/socialnetwork/backend/
sudo mkdir -p /opt/socialnetwork/backend/wwwroot/uploads
sudo mkdir -p /opt/socialnetwork/backend/wwwroot/videos
sudo chown -R www-data:www-data /opt/socialnetwork/backend
```

### Bước 5 — Biến Môi Trường Backend

```bash
# Tạo file environment (KHÔNG commit file này lên git)
sudo nano /etc/socialnetwork.env
```

```ini
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://localhost:5000
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=SocialNetworkDb;Username=socialadmin;Password=YourStrongPass123!
Jwt__SecretKey=REPLACE_WITH_64_CHAR_RANDOM_STRING_openssl_rand_base64_64
Jwt__Issuer=SocialNetworkApi
Jwt__Audience=SocialNetworkClient
Jwt__ExpiryDays=7
Frontend__Url=https://yourdomain.com
```

```bash
# Tạo JWT Secret mạnh
openssl rand -base64 64
# Copy output → điền vào Jwt__SecretKey bên trên

# Bảo vệ file
sudo chmod 600 /etc/socialnetwork.env
sudo chown root:root /etc/socialnetwork.env
```

### Bước 6 — Tạo Systemd Service

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

# Kiểm tra
sudo systemctl status socialnetwork-api
sudo journalctl -u socialnetwork-api -f   # xem log realtime
```

### Bước 7 — Build & Deploy Frontend

```bash
# === Trên máy local ===
cd frontend

# Tạo file .env.production
cat > .env.production << EOF
VITE_API_URL=https://api.yourdomain.com
EOF

npm ci
npm run build   # tạo ra thư mục dist/

# Upload lên EC2
scp -i your-key.pem -r ./dist ubuntu@EC2_IP:/tmp/frontend-dist
```

```bash
# === Trên EC2 ===
sudo mkdir -p /var/www/socialnetwork
sudo cp -r /tmp/frontend-dist/* /var/www/socialnetwork/
sudo chown -R www-data:www-data /var/www/socialnetwork
```

### Bước 8 — Cấu Hình Nginx

```bash
sudo nano /etc/nginx/sites-available/socialnetwork
```

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/socialnetwork;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy file uploads sang backend
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
    }
    location /videos/ {
        proxy_pass http://localhost:5000/videos/;
        proxy_set_header Host $host;
    }

    # Bảo mật headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 100M;   # cho phép upload file lớn

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
        proxy_connect_timeout 75s;
    }
}
```

```bash
# Kích hoạt site
sudo ln -s /etc/nginx/sites-available/socialnetwork /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # xóa default
sudo nginx -t                               # kiểm tra cú pháp
sudo systemctl restart nginx

# Cài HTTPS tự động với Let's Encrypt (miễn phí)
sudo certbot --nginx \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  --agree-tos \
  --non-interactive \
  --email your@email.com

# Certbot tự động renew, kiểm tra
sudo systemctl status certbot.timer
```

### Bước 9 — Chạy Database Migration

```bash
# Trên EC2
cd /opt/socialnetwork/backend

# Cài dotnet-ef tool (chỉ cần 1 lần)
dotnet tool install --global dotnet-ef

# Chạy migration
dotnet ef database update \
  --connection "Host=localhost;Port=5432;Database=SocialNetworkDb;Username=socialadmin;Password=YourStrongPass123!"
```

### Bước 10 — Backup Tự Động

```bash
# Tạo script backup
sudo nano /opt/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# Dump database
PGPASSWORD="YourStrongPass123!" pg_dump \
  -U socialadmin \
  -h localhost \
  "SocialNetworkDb" | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Xóa backup cũ hơn 7 ngày
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# (Tùy chọn) Upload lên S3
# aws s3 cp "$BACKUP_DIR/db_$DATE.sql.gz" s3://my-backups/db/
```

```bash
sudo chmod +x /opt/backup-db.sh

# Chạy tự động lúc 3h sáng mỗi ngày
echo "0 3 * * * root /opt/backup-db.sh" | sudo tee /etc/cron.d/socialnetwork-backup
```

---

## 🏗️ Plan B — Elastic Beanstalk + RDS + S3 + CloudFront

### Kiến Trúc

```
CloudFront ──→ S3 (Frontend static files)

User ─────────→ ALB (Application Load Balancer)
                      ↓
              Elastic Beanstalk (EC2 t3.small)
              (ASP.NET Core Docker container)
                      ↓
              RDS PostgreSQL db.t3.micro
                      ↓
              S3 (File uploads / videos)
```

### Tài Nguyên AWS & Chi Phí

```
Elastic Beanstalk EC2 t3.small   ~$15/tháng
RDS PostgreSQL db.t3.micro       ~$25/tháng
S3 Standard 10GB                  ~$0.50/tháng
CloudFront                        ~$5/tháng
ALB (Application Load Balancer)   ~$18/tháng
ACM Certificate (HTTPS)           Miễn phí
Route53                           $0.50/tháng
─────────────────────────────────────────────
Tổng ước tính                     ~$64–80/tháng
```

### Bước 1 — Chuẩn Bị AWS CLI

```bash
# Cài AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Cài EB CLI
pip install awsebcli

# Cấu hình credentials
aws configure
# AWS Access Key ID: ...
# AWS Secret Access Key: ...
# Default region name: ap-southeast-1
# Default output format: json
```

### Bước 2 — Tạo RDS PostgreSQL

```bash
# Tạo Security Group cho RDS (chỉ cho phép từ EB security group)
aws ec2 create-security-group \
  --group-name socialnetwork-rds-sg \
  --description "RDS PostgreSQL for SocialNetwork"

# Tạo RDS instance
aws rds create-db-instance \
  --db-instance-identifier socialnetwork-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 20 \
  --storage-type gp3 \
  --master-username socialadmin \
  --master-user-password "YourStrongRDSPass!" \
  --db-name SocialNetworkDb \
  --no-publicly-accessible \
  --backup-retention-period 7 \
  --deletion-protection \
  --tags Key=Project,Value=SocialNetwork

# Lấy endpoint RDS (chờ ~5 phút để tạo xong)
aws rds describe-db-instances \
  --db-instance-identifier socialnetwork-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
# → socialnetwork-db.xxxxxxxxx.ap-southeast-1.rds.amazonaws.com
```

### Bước 3 — Tạo S3 Bucket Cho File Uploads

```bash
# Bucket lưu file upload của users
aws s3 mb s3://socialnetwork-uploads-prod --region ap-southeast-1

# Bật versioning
aws s3api put-bucket-versioning \
  --bucket socialnetwork-uploads-prod \
  --versioning-configuration Status=Enabled

# Block public access (ảnh sẽ serve qua CloudFront)
aws s3api put-public-access-block \
  --bucket socialnetwork-uploads-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Bucket lưu frontend build
aws s3 mb s3://socialnetwork-frontend-prod --region ap-southeast-1
```

### Bước 4 — Lưu Secrets Vào AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name "socialnetwork/production" \
  --region ap-southeast-1 \
  --secret-string '{
    "jwt_secret": "REPLACE_WITH_64CHAR_RANDOM",
    "db_host": "socialnetwork-db.xxxxxxx.ap-southeast-1.rds.amazonaws.com",
    "db_password": "YourStrongRDSPass!",
    "db_connection": "Host=socialnetwork-db.xxxxxxx.rds.amazonaws.com;Port=5432;Database=SocialNetworkDb;Username=socialadmin;Password=YourStrongRDSPass!"
  }'

# Tạo JWT secret ngẫu nhiên
openssl rand -base64 64
```

### Bước 5 — Tạo Dockerfile Cho Backend

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

### Bước 6 — Deploy Lên Elastic Beanstalk

```bash
cd backend/SocialNetwork.Api

# Khởi tạo EB project
eb init socialnetwork-api \
  --platform docker \
  --region ap-southeast-1

# Tạo environment production
eb create socialnetwork-prod \
  --instance-type t3.small \
  --min-instances 1 \
  --max-instances 3 \
  --envvars \
"ASPNETCORE_ENVIRONMENT=Production,\
ConnectionStrings__DefaultConnection=Host=RDS_ENDPOINT;Port=5432;Database=SocialNetworkDb;Username=socialadmin;Password=YourStrongRDSPass!,\
Jwt__SecretKey=YOUR_64CHAR_SECRET,\
Jwt__Issuer=SocialNetworkApi,\
Jwt__Audience=SocialNetworkClient,\
Jwt__ExpiryDays=7,\
Frontend__Url=https://yourdomain.com,\
AWS__BucketName=socialnetwork-uploads-prod,\
AWS__Region=ap-southeast-1"

# Deploy lại sau khi sửa code
eb deploy
eb status    # kiểm tra trạng thái
eb logs      # xem logs
```

### Bước 7 — Deploy Frontend Lên S3 + CloudFront

```bash
# Build frontend
cd frontend
cat > .env.production << EOF
VITE_API_URL=https://api.yourdomain.com
EOF
npm ci && npm run build

# Upload lên S3 (cache dài cho assets, không cache index.html)
aws s3 sync ./dist s3://socialnetwork-frontend-prod \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp ./dist/index.html s3://socialnetwork-frontend-prod/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

# Tạo CloudFront Origin Access Control
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
    "Name=socialnetwork-oac,OriginAccessControlOriginType=s3,SigningBehavior=always,SigningProtocol=sigv4"

# Tạo CloudFront Distribution
aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "socialnetwork-'$(date +%s)'",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-socialnetwork-frontend",
      "DomainName": "socialnetwork-frontend-prod.s3.ap-southeast-1.amazonaws.com",
      "S3OriginConfig": { "OriginAccessIdentity": "" }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-socialnetwork-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 0
    }]
  },
  "DefaultRootObject": "index.html",
  "Enabled": true,
  "HttpVersion": "http2and3",
  "PriceClass": "PriceClass_All"
}'
```

### Bước 8 — Cấu Hình Route53 & Domain

```bash
# Tạo Hosted Zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Lấy CloudFront domain
CF_DOMAIN=$(aws cloudfront list-distributions \
  --query 'DistributionList.Items[0].DomainName' \
  --output text)

# Lấy EB load balancer domain
EB_DOMAIN=$(aws elasticbeanstalk describe-environments \
  --environment-names socialnetwork-prod \
  --query 'Environments[0].CNAME' \
  --output text)

# Tạo DNS records (thay HOSTED_ZONE_ID bằng ID thực)
aws route53 change-resource-record-sets \
  --hosted-zone-id HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "yourdomain.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "'$CF_DOMAIN'",
            "EvaluateTargetHealth": false
          }
        }
      },
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "api.yourdomain.com",
          "Type": "CNAME",
          "TTL": 300,
          "ResourceRecords": [{"Value": "'$EB_DOMAIN'"}]
        }
      }
    ]
  }'
```

---

## 🐳 Plan C — ECS Fargate + Docker + CI/CD

### Kiến Trúc

```
GitHub Actions
      ↓ build & push image
ECR (Elastic Container Registry)
      ↓
ECS Fargate Cluster
├── Task: socialnetwork-api (2 replicas)
└── ALB → HTTPS
      ↓
RDS Aurora PostgreSQL (Multi-AZ)
      ↓
S3 Uploads + CloudFront
      ↓
ElastiCache Redis (SignalR backplane)
```

### Bước 1 — Tạo ECR Repositories

```bash
# Tạo repo cho backend image
aws ecr create-repository \
  --repository-name socialnetwork-api \
  --region ap-southeast-1 \
  --image-scanning-configuration scanOnPush=true

# Lấy registry URI
REGISTRY=$(aws ecr describe-repositories \
  --repository-names socialnetwork-api \
  --query 'repositories[0].repositoryUri' \
  --output text | cut -d'/' -f1)
# → 123456789.dkr.ecr.ap-southeast-1.amazonaws.com
```

### Bước 2 — Build & Push Image Thủ Công

```bash
# Login ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin $REGISTRY

# Build
docker build \
  -t socialnetwork-api:latest \
  -f backend/SocialNetwork.Api/Dockerfile \
  backend/SocialNetwork.Api/

# Tag & Push
docker tag socialnetwork-api:latest $REGISTRY/socialnetwork-api:latest
docker push $REGISTRY/socialnetwork-api:latest
```

### Bước 3 — ECS Task Definition

```bash
# Tạo file task-definition.json
cat > task-definition.json << 'EOF'
{
  "family": "socialnetwork-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "socialnetwork-api",
      "image": "REGISTRY/socialnetwork-api:latest",
      "portMappings": [{ "containerPort": 8080, "protocol": "tcp" }],
      "essential": true,
      "environment": [
        { "name": "ASPNETCORE_ENVIRONMENT", "value": "Production" },
        { "name": "ASPNETCORE_URLS", "value": "http://+:8080" }
      ],
      "secrets": [
        {
          "name": "ConnectionStrings__DefaultConnection",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:ACCOUNT:secret:socialnetwork/production:db_connection::"
        },
        {
          "name": "Jwt__SecretKey",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:ACCOUNT:secret:socialnetwork/production:jwt_secret::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/socialnetwork-api",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Bước 4 — Tạo ECS Cluster & Service

```bash
# Tạo cluster
aws ecs create-cluster \
  --cluster-name socialnetwork-cluster \
  --capacity-providers FARGATE FARGATE_SPOT

# Tạo CloudWatch Log Group
aws logs create-log-group --log-group-name /ecs/socialnetwork-api

# Tạo Service (cần ALB target group ARN)
aws ecs create-service \
  --cluster socialnetwork-cluster \
  --service-name socialnetwork-api \
  --task-definition socialnetwork-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxxxxxxx,subnet-yyyyyyyy],
    securityGroups=[sg-xxxxxxxx],
    assignPublicIp=DISABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=socialnetwork-api,containerPort=8080" \
  --deployment-configuration "minimumHealthyPercent=100,maximumPercent=200" \
  --health-check-grace-period-seconds 60

# Auto scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/socialnetwork-cluster/socialnetwork-api \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --policy-name cpu-tracking \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/socialnetwork-cluster/socialnetwork-api \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

### Bước 5 — GitHub Actions CI/CD

```bash
# Tạo file
mkdir -p .github/workflows
```

```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY: socialnetwork-api
  ECS_CLUSTER: socialnetwork-cluster
  ECS_SERVICE: socialnetwork-api
  CONTAINER_NAME: socialnetwork-api

jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push backend image
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:latest \
            -f backend/SocialNetwork.Api/Dockerfile \
            backend/SocialNetwork.Api/
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Build & deploy frontend to S3
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
        run: |
          cd frontend
          npm ci
          npm run build
          aws s3 sync ./dist s3://socialnetwork-frontend-prod \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "index.html"
          aws s3 cp ./dist/index.html s3://socialnetwork-frontend-prod/index.html \
            --cache-control "no-cache"
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition ${{ env.CONTAINER_NAME }} \
            --query taskDefinition > task-definition.json

      - name: Update ECS task definition with new image
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

**GitHub Secrets cần thiết:**

| Secret | Giá trị |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key (chỉ quyền ECR + ECS + S3) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `API_URL` | `https://api.yourdomain.com` |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID của CloudFront distribution |

### Bước 6 — Redis Cho SignalR (Nếu Dùng Nhiều Instance)

> **Bắt buộc** khi chạy từ 2 ECS tasks trở lên — không có Redis, SignalR chat/notification sẽ không hoạt động giữa các users ở task khác nhau.

```bash
# Tạo ElastiCache Redis
aws elasticache create-replication-group \
  --replication-group-id socialnetwork-redis \
  --replication-group-description "SignalR backplane" \
  --node-group-configuration "ReplicaCount=1,Slots=0-16383" \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled
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
    "ConnectionString": "socialnetwork-redis.xxxxxx.cache.amazonaws.com:6379,ssl=true"
  }
}
```

---

## 🔐 Bảo Mật AWS — Checklist

```bash
# ✅ 1. Không bao giờ commit credentials
echo ".env*" >> .gitignore
echo "appsettings.Production.json" >> .gitignore

# ✅ 2. IAM User cho GitHub Actions — chỉ cấp quyền tối thiểu
aws iam create-user --user-name github-actions-deploy
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
# Tạo thêm policy riêng cho ECR, S3, CloudFront

# ✅ 3. Security Group RDS — chỉ cho phép từ EC2/ECS security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group sg-EC2_SG_ID

# ✅ 4. Enable RDS encryption at rest
# (khai báo --storage-encrypted khi tạo RDS)

# ✅ 5. WAF cho CloudFront (chặn SQL injection, XSS)
aws wafv2 create-web-acl \
  --name socialnetwork-waf \
  --scope CLOUDFRONT \
  --region us-east-1 \
  --default-action Allow={} \
  --rules '[
    {"Name":"AWSManagedRulesCommonRuleSet","Priority":1,"Statement":{"ManagedRuleGroupStatement":{"VendorName":"AWS","Name":"AWSManagedRulesCommonRuleSet"}},"OverrideAction":{"None":{}},"VisibilityConfig":{"SampledRequestsEnabled":true,"CloudWatchMetricsEnabled":true,"MetricName":"CommonRuleSet"}}
  ]' \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=socialnetwork-waf
```

---

## 📊 So Sánh 3 Plan AWS

| | Plan A — EC2 | Plan B — EB + RDS | Plan C — ECS Fargate |
|---|---|---|---|
| **Chi phí/tháng** | ~$20 | ~$80 | ~$100 |
| **Setup time** | 3 giờ | 1 ngày | 1–2 ngày |
| **CI/CD** | Thủ công | Tùy chọn | GitHub Actions tự động |
| **Auto scaling** | ❌ | ✅ hạn chế | ✅ hoàn toàn |
| **Managed DB** | ❌ self-hosted | ✅ RDS | ✅ RDS Aurora |
| **TLS/HTTPS** | Let's Encrypt | ACM tự động | ACM tự động |
| **Uptime SLA** | ~99% | ~99.9% | ~99.95% |
| **SignalR scale** | 1 instance OK | 1 instance OK | Cần Redis |
| **File uploads** | Local disk ⚠️ | S3 ✅ | S3 ✅ |
| **Rollback** | Thủ công | EB rollback | ECS previous task def |

---

## 💡 Khuyến Nghị

| Mục đích | Chọn |
|---|---|
| Demo, portfolio sinh viên | **Plan A** — EC2 t3.micro Free Tier (~$0/tháng đầu) |
| Startup dưới 500 users | **Plan B** — Elastic Beanstalk + RDS |
| Production thật với CI/CD | **Plan C** — ECS Fargate |
| Budget eo hẹp nhất | **Plan A** — EC2 t3.micro + RDS Free Tier = ~$10/tháng |

> **💰 Tiết kiệm chi phí:** Dùng AWS Free Tier 12 tháng đầu: EC2 t2.micro, RDS db.t3.micro 20GB, S3 5GB — gần như miễn phí hoàn toàn cho project nhỏ.
