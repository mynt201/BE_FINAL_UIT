# Flood Risk Management Backend API

Backend API cho hệ thống quản lý rủi ro ngập lụt, cung cấp các dịch vụ RESTful cho ứng dụng frontend.

## 🚀 Tính năng

### 🔐 Authentication (Xác thực)
- Đăng ký tài khoản mới
- Đăng nhập
- Refresh token
- Đăng xuất
- Middleware xác thực JWT

### 👥 User Management (Quản lý người dùng)
- Lấy danh sách người dùng (có phân trang, tìm kiếm, lọc)
- Tạo người dùng mới
- Cập nhật thông tin người dùng
- Xóa người dùng
- Upload avatar

### 🌐 External APIs Integration (Tích hợp API bên ngoài)
- **Weather API**: Thời tiết real-time và dự báo (WeatherAPI.com)
- **Elevation API**: Độ cao và phân tích địa hình (Open-Elevation)
- **OpenStreetMap**: Dữ liệu bản đồ và hạ tầng
- **Vietnam Government APIs**: Dữ liệu dân số, thảm họa, thủy văn
- **Comprehensive Flood Risk Assessment**: Đánh giá rủi ro tổng thể

### 📊 Dashboard (Bảng điều khiển)
- Thống kê tổng quan hệ thống
- Số lượng người dùng theo vai trò
- Thống kê dữ liệu (wards, weather, risk)
- Charts data cho dashboard

### 🗂️ Data Management (Quản lý dữ liệu)
- **Wards Data**: CRUD cho dữ liệu khu vực/phường
- **Weather Data**: CRUD cho dữ liệu thời tiết
- **Risk Index Data**: CRUD cho chỉ số rủi ro
- **Road Bridge Data**: CRUD cho dữ liệu cầu đường
- Upload và xử lý file dữ liệu

### 📈 Statistics (Thống kê)
- **Daily Statistics**: Thống kê theo ngày
- **Monthly Statistics**: Thống kê theo tháng
- **Yearly Statistics**: Thống kê theo năm (có filter năm)
- **Comparison Statistics**: So sánh 2 giai đoạn
- Tính toán chỉ số rủi ro tự động

### 📋 Risk Report (Báo cáo rủi ro)
- Tạo báo cáo rủi ro theo khu vực
- Lưu trữ lịch sử báo cáo
- Export báo cáo PDF/Excel

### ⚙️ Settings (Cài đặt)
- Cài đặt hệ thống
- Cài đặt người dùng
- Upload logo và assets

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js >= 18.0.0
- **Language**: TypeScript 5.5+ (Full type safety)
- **Framework**: Express.js 4.19+
- **Database**: MongoDB với Mongoose ODM 8.5+
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod (Type-safe validation)
- **Password Hashing**: bcrypt (Native implementation)
- **File Upload**: Multer 1.4+
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Pino (High-performance JSON logging)
- **Testing**: Jest + Supertest + TypeScript
- **Development**: Nodemon + ts-node hot reload

## 📁 Cấu trúc thư mục

```
flood-risk-backend/
├── src/
│   ├── config/           # Cấu hình database, JWT, etc.
│   ├── controllers/      # Logic xử lý request
│   ├── middleware/       # Middleware tùy chỉnh
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Helper functions
│   ├── validators/      # Input validation
│   └── server.js        # Entry point
├── scripts/             # Database seeding, migration
├── uploads/            # File uploads directory
├── tests/              # Unit và integration tests
├── .env.example        # Environment variables template
├── jest.config.js      # Jest configuration
└── package.json
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm hoặc yarn

### 1. Clone repository
```bash
git clone <repository-url>
cd flood-risk-backend
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình environment
```bash
# Tạo file .env từ template
cp .env.example .env
# Hoặc tạo file .env thủ công (xem ENV_CONFIG.md)

# Kiểm tra cấu hình
npm run check-env
```

### 4. Khởi động MongoDB
```bash
# Option 1: Local MongoDB
# Đảm bảo MongoDB đang chạy trên localhost:27017

# Option 2: Docker MongoDB (khuyến nghị)
docker run -d --name mongodb -p 27017:27017 mongo:6.0

# Option 3: MongoDB Atlas
# Cập nhật MONGODB_URI trong .env
```

### 5. Chạy database seeding (tùy chọn)
```bash
npm run seed
```

### 6. Chạy server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy trên `http://localhost:5000` (hoặc port được cấu hình).

## 🐳 Docker Deployment

### Development với Docker

```bash
# Chạy development environment
docker-compose -f docker-compose.dev.yml up --build

# Hoặc sử dụng npm script
npm run docker:dev
```

### Production với Docker

```bash
# Chạy production environment
docker-compose -f docker-compose.prod.yml up --build -d

# Hoặc sử dụng npm script
npm run docker:prod
```

### Deploy lên Azure

```bash
# Build và push lên Azure Container Registry
az acr login --name your-acr-name
docker build -t your-acr-name.azurecr.io/flood-risk-backend:latest .
docker push your-acr-name.azurecr.io/flood-risk-backend:latest

# Deploy lên Azure Web App
npm run docker:azure
```

**📖 Chi tiết:** Xem [`README-Docker.md`](README-Docker.md) để biết thêm thông tin về Docker và Azure deployment.

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Đăng ký tài khoản mới
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "user"
}
```

#### POST /api/auth/login
Đăng nhập
```json
{
  "username": "string",
  "password": "string"
}
```

#### POST /api/auth/refresh
Refresh access token
```json
{
  "refreshToken": "string"
}
```

### User Management Endpoints

#### GET /api/users
Lấy danh sách người dùng (có phân trang, tìm kiếm, lọc)

Query parameters:
- `page`: Số trang (default: 1)
- `limit`: Số item/trang (default: 10)
- `search`: Từ khóa tìm kiếm
- `role`: Lọc theo vai trò (admin/user)

#### POST /api/users
Tạo người dùng mới

#### PUT /api/users/:id
Cập nhật thông tin người dùng

#### DELETE /api/users/:id
Xóa người dùng

### Statistics Endpoints

#### GET /api/statistics/daily
Thống kê theo ngày
Query: `year`, `month`

#### GET /api/statistics/monthly
Thống kê theo tháng
Query: `year`

#### GET /api/statistics/yearly
Thống kê theo năm
Query: `startYear`, `endYear`

#### GET /api/statistics/comparison
So sánh 2 giai đoạn
Query: `startDate`, `endDate`

### Data Management Endpoints

#### Wards
- GET /api/wards
- POST /api/wards
- PUT /api/wards/:id
- DELETE /api/wards/:id

#### Weather Data
- GET /api/weather
- POST /api/weather
- PUT /api/weather/:id
- DELETE /api/weather/:id

#### Risk Index
- GET /api/risk-index
- POST /api/risk-index
- PUT /api/risk-index/:id
- DELETE /api/risk-index/:id

## 🔧 Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/flood-risk-db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRE=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm test -- --coverage

# Chạy tests watch mode
npm run test:watch
```

## 🚢 Deployment

### PM2 (Production)
```bash
npm install -g pm2
pm2 start src/server.js --name flood-risk-api
pm2 save
pm2 startup
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Flood Risk Team** - *Initial work*

## 🙏 Acknowledgments

- Express.js documentation
- MongoDB documentation
- JWT.io for token standards
