# 🔧 Environment Configuration Guide

## Tạo file .env

Tạo file `.env` trong thư mục root của backend project với nội dung sau:

```bash
# ======================================
# FLOOD RISK MANAGEMENT BACKEND CONFIG
# ======================================

# ---------- DATABASE CONFIG ----------
MONGODB_URI=mongodb://localhost:27017/flood_risk_db
MONGODB_TEST_URI=mongodb://localhost:27017/flood_risk_test_db

# ---------- JWT CONFIG ----------
JWT_SECRET=flood_risk_management_jwt_secret_key_change_in_production_123456789
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=flood_risk_management_refresh_secret_key_change_in_production_987654321
JWT_REFRESH_EXPIRE=7d

# ---------- SERVER CONFIG ----------
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# ---------- CORS CONFIG ----------
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# ---------- RATE LIMITING ----------
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ---------- FILE UPLOAD CONFIG ----------
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

# ---------- EMAIL CONFIG (Optional - for notifications) ----------
EMAIL_FROM=noreply@floodrisk.com
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password

# ---------- LOGGING CONFIG ----------
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# ---------- ADMIN DEFAULT ACCOUNT ----------
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@floodrisk.com
DEFAULT_ADMIN_PASSWORD=Admin123!

# ---------- WEATHER API (Optional - for external weather data) ----------
OPENWEATHER_API_KEY=your_openweather_api_key_here
WEATHER_UPDATE_INTERVAL=3600000

# ---------- BACKUP CONFIG ----------
BACKUP_ENABLED=false
BACKUP_INTERVAL=86400000
BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30

# ---------- SECURITY CONFIG ----------
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=3600000
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000

# ---------- MONITORING ----------
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=false
METRICS_PORT=9090

# ---------- CACHE CONFIG ----------
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# ---------- EXTERNAL SERVICES ----------
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## ⚠️ **Quan trọng - Bảo mật:**

### 🔑 **JWT Secrets:**

- `JWT_SECRET` và `JWT_REFRESH_SECRET` **PHẢI** được thay đổi trong production
- Sử dụng chuỗi ngẫu nhiên dài ít nhất 64 ký tự
- Không commit vào git

### 🗄️ **Database:**

- `MONGODB_URI`: Cập nhật nếu dùng MongoDB Atlas hoặc remote server
- Tạo database riêng cho production và development

### 🔒 **Production Settings:**

```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<another-strong-random-secret>
MONGODB_URI=mongodb://username:password@host:port/database
CORS_ORIGIN=https://yourdomain.com
```

## 🚀 **Các bước setup:**

1. **Tạo file .env:**

   ```bash
   cp .env.example .env  # Nếu có file example
   # hoặc tạo file .env thủ công
   ```

2. **Cập nhật MongoDB URI:**

   - Local: `mongodb://localhost:27017/flood_risk_db`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database`

3. **Thay đổi JWT secrets:**

   - Sử dụng tool như `openssl rand -hex 64` để tạo secret

4. **Cấu hình CORS:**
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

## 📊 **Mô tả các biến:**

### Database

- `MONGODB_URI`: Connection string cho MongoDB
- `MONGODB_TEST_URI`: Database riêng cho testing

### Authentication

- `JWT_SECRET`: Secret key cho JWT access token
- `JWT_EXPIRE`: Thời hạn của access token (24h)
- `JWT_REFRESH_SECRET`: Secret cho refresh token
- `JWT_REFRESH_EXPIRE`: Thời hạn của refresh token (7d)

### Server

- `NODE_ENV`: development/production
- `PORT`: Port chạy server (default: 5000)
- `API_PREFIX`: Prefix cho API routes (/api/v1)

### Security

- `CORS_ORIGIN`: Domain được phép truy cập API
- `RATE_LIMIT_WINDOW_MS`: Thời gian window cho rate limiting (15 phút)
- `RATE_LIMIT_MAX_REQUESTS`: Số request tối đa trong window

### File Upload

- `MAX_FILE_SIZE`: Kích thước file tối đa (bytes)
- `UPLOAD_PATH`: Thư mục lưu file upload
- `ALLOWED_FILE_TYPES`: Các loại file được phép

### Email (Optional)

- Cấu hình SMTP để gửi email thông báo

### Monitoring

- `HEALTH_CHECK_ENABLED`: Bật health check endpoint
- `METRICS_ENABLED`: Bật metrics collection

## 🔍 **Kiểm tra cấu hình:**

Sau khi tạo file .env, kiểm tra:

```bash
# Kiểm tra syntax
node -e "require('dotenv').config(); console.log('✅ .env loaded successfully')"

# Chạy server
npm run dev

# Kiểm tra database connection
npm run test:db
```

## 🚨 **Lưu ý bảo mật:**

- **KHÔNG** commit file `.env` vào git
- **KHÔNG** sử dụng default secrets trong production
- Sử dụng environment variables trong deployment
- Rotate JWT secrets định kỳ
- Monitor rate limiting và security logs
