# 🚀 Hướng dẫn Triển khai Backend

## Chuẩn bị môi trường

### 1. MongoDB
```bash
# Cài đặt MongoDB hoặc sử dụng MongoDB Atlas
# Đảm bảo MongoDB đang chạy trên port 27017
```

### 2. Environment Variables
Tạo file `.env` trong thư mục gốc:

```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Database - Thay đổi cho production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/flood-risk-prod

# JWT Configuration - PHẢI thay đổi cho production
JWT_SECRET=your-production-super-secret-jwt-key-here
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-production-refresh-token-secret
JWT_REFRESH_EXPIRE=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# CORS - Thay đổi cho domain production
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=warn
```

## Triển khai với PM2

### 1. Cài đặt PM2
```bash
npm install -g pm2
```

### 2. Build và start
```bash
npm install --production
npm run build  # Nếu có build script
pm2 start src/server.js --name flood-risk-api
```

### 3. Cấu hình PM2
```bash
pm2 save
pm2 startup
pm2 logs flood-risk-api
```

## Triển khai với Docker

### 1. Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["npm", "start"]
```

### 2. Docker Compose
```yaml
version: '3.8'

services:
  flood-risk-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/flood-risk-prod
      - JWT_SECRET=your-production-jwt-secret
      - CORS_ORIGIN=https://yourdomain.com
    depends_on:
      - mongo
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  mongo:
    image: mongo:7.0
    restart: always
    environment:
      MONGO_INITDB_DATABASE: flood-risk-prod
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

### 3. Chạy Docker
```bash
docker-compose up -d
```

## Bảo mật Production

### 1. JWT Secrets
- Sử dụng secrets mạnh, ngẫu nhiên
- Lưu trong environment variables
- Không commit vào git

### 2. Database
- Sử dụng authentication
- Enable SSL/TLS
- Backup thường xuyên

### 3. CORS
- Chỉ cho phép domain cụ thể
- Không sử dụng `*`

### 4. Rate Limiting
- Điều chỉnh theo traffic thực tế
- Giám sát và điều chỉnh

### 5. File Upload
- Validate file types
- Giới hạn kích thước
- Scan malware

## Giám sát và Logging

### 1. PM2 Monitoring
```bash
pm2 monit
pm2 logs
```

### 2. Health Check
API có endpoint `/health` để kiểm tra trạng thái.

### 3. Logs
- Winston tự động ghi logs
- Xem trong thư mục `logs/`
- Cấu hình rotation cho production

## Backup và Recovery

### 1. Database Backup
```bash
# MongoDB backup
mongodump --db flood-risk-prod --out /path/to/backup

# Restore
mongorestore --db flood-risk-prod /path/to/backup/flood-risk-prod
```

### 2. File Uploads
- Sao lưu thư mục `uploads/`
- Sử dụng cloud storage (AWS S3, Google Cloud Storage)

## Performance Optimization

### 1. Database Indexes
```javascript
// Đảm bảo các indexes đã được tạo
db.users.createIndex({ username: 1 })
db.users.createIndex({ email: 1 })
db.weather.createIndex({ date: 1, "location.ward_id": 1 })
```

### 2. Caching
- Sử dụng Redis cho session (tùy chọn)
- Cache dữ liệu tĩnh

### 3. Compression
- Đã enable gzip compression
- CDN cho static assets

## Troubleshooting

### Lỗi thường gặp:

1. **MongoDB Connection Error**
   - Kiểm tra MONGO_URI
   - Đảm bảo MongoDB đang chạy
   - Kiểm tra network connectivity

2. **JWT Token Invalid**
   - Kiểm tra JWT_SECRET
   - Đảm bảo frontend gửi token đúng format

3. **CORS Error**
   - Kiểm tra CORS_ORIGIN
   - Đảm bảo HTTPS (production)

4. **File Upload Error**
   - Kiểm tra quyền thư mục uploads/
   - Kiểm tra MAX_FILE_SIZE

### Logs và Debug:
```bash
# Xem logs
pm2 logs flood-risk-api

# Restart service
pm2 restart flood-risk-api

# Check health
curl http://localhost:3001/health
```

## Support

Nếu gặp vấn đề, kiểm tra:
1. Logs trong `logs/` directory
2. PM2 logs: `pm2 logs flood-risk-api`
3. Health endpoint: `/health`
4. Database connection: `mongosh` hoặc MongoDB Compass
