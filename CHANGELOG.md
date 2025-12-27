# 📋 Changelog - Flood Risk Backend

Tất cả các thay đổi đáng kể đối với Flood Risk Backend API sẽ được ghi lại trong file này.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
và tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### ✨ Added (Thêm mới)

#### 🔐 Authentication System

- **JWT Authentication**: Hệ thống xác thực với JWT tokens
- **Refresh Tokens**: Cơ chế refresh tokens để duy trì phiên đăng nhập
- **Password Hashing**: Mã hóa mật khẩu với bcrypt
- **Role-based Access**: Phân quyền Admin/User

#### 👥 User Management

- **CRUD Operations**: Tạo, đọc, cập nhật, xóa users
- **Pagination**: Phân trang danh sách users
- **Search & Filter**: Tìm kiếm theo username/email/họ tên, lọc theo role
- **Avatar Upload**: Upload và quản lý avatar users
- **Profile Management**: Quản lý thông tin cá nhân

#### 📊 Statistics API

- **Daily Statistics**: Thống kê rủi ro theo ngày trong tháng
- **Monthly Statistics**: Thống kê theo 12 tháng trong năm
- **Yearly Statistics**: Thống kê theo năm (có filter năm bắt đầu)
- **Comparison Statistics**: So sánh rủi ro giữa 2 giai đoạn thời gian
- **Risk Calculation**: Tính toán chỉ số rủi ro tự động

#### 📋 Dashboard API

- **System Overview**: Thống kê tổng quan hệ thống
- **User Statistics**: Thống kê users theo role
- **Risk Distribution**: Phân bố rủi ro theo mức độ
- **Recent Activity**: Hoạt động gần đây
- **Real-time Data**: Dữ liệu cập nhật tức thời

#### 🗂️ Data Management

- **Ward Management**: CRUD cho dữ liệu khu vực/phường
- **Weather Data**: CRUD cho dữ liệu thời tiết
- **Risk Index**: CRUD cho chỉ số rủi ro
- **Data Validation**: Validation đầy đủ cho tất cả dữ liệu
- **Bulk Operations**: Hỗ trợ thao tác hàng loạt

#### ⚙️ Settings Management

- **System Settings**: Cấu hình hệ thống
- **User Preferences**: Cài đặt cá nhân
- **Theme Configuration**: Cấu hình giao diện
- **Security Settings**: Cài đặt bảo mật

#### 🛡️ Security Features

- **Helmet**: Bảo mật HTTP headers
- **CORS**: Cross-Origin Resource Sharing
- **Rate Limiting**: Giới hạn tốc độ request
- **Input Validation**: Validation với Joi và express-validator
- **SQL Injection Protection**: Bảo vệ chống SQL injection
- **XSS Protection**: Bảo vệ chống XSS

#### 📁 File Management

- **Multer Integration**: Upload file với Multer
- **File Type Validation**: Kiểm tra loại file
- **Size Limits**: Giới hạn kích thước file
- **Secure Storage**: Lưu trữ file an toàn

#### 🔍 Monitoring & Logging

- **Winston Logger**: Hệ thống logging chuyên nghiệp
- **Error Handling**: Middleware xử lý lỗi toàn cục
- **Health Check**: Endpoint kiểm tra trạng thái hệ thống
- **Request Logging**: Ghi log tất cả requests

#### 🧪 Testing Infrastructure

- **Jest Setup**: Framework testing với Jest
- **Supertest**: Testing API endpoints
- **Test Utilities**: Helper functions cho testing
- **Coverage Reports**: Báo cáo coverage

### 🏗️ Infrastructure

#### 📊 Database Design

- **MongoDB**: Cơ sở dữ liệu NoSQL
- **Mongoose ODM**: Object Document Mapping
- **Schema Validation**: Validation schema chặt chẽ
- **Indexing**: Database indexes cho performance
- **Relationships**: Quan hệ giữa các collections

#### 🏛️ Architecture

- **MVC Pattern**: Model-View-Controller architecture
- **Separation of Concerns**: Tách biệt rõ ràng các layers
- **Middleware Architecture**: Middleware pipeline
- **Service Layer**: Business logic tách riêng
- **Repository Pattern**: Data access layer

#### 🔧 Development Tools

- **Nodemon**: Auto-restart development server
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Commitizen**: Conventional commits

### 📚 Documentation

- **API Reference**: Tài liệu API chi tiết
- **Setup Guide**: Hướng dẫn cài đặt và chạy
- **Deployment Guide**: Hướng dẫn triển khai production
- **Testing Guide**: Hướng dẫn testing
- **Changelog**: Lịch sử thay đổi

### 🌱 Database Seeding

- **Sample Data**: Dữ liệu mẫu cho development
- **User Accounts**: Tài khoản test (admin/user1/user2)
- **Ward Data**: 5 wards mẫu với đầy đủ thông tin
- **Weather Data**: 30 ngày dữ liệu thời tiết cho mỗi ward
- **Seed Script**: Script tự động tạo dữ liệu mẫu

### 🔄 API Features

#### 📡 RESTful Design

- **Standard HTTP Methods**: GET, POST, PUT, DELETE
- **Consistent Response Format**: JSON response chuẩn
- **HTTP Status Codes**: Status codes phù hợp
- **Error Handling**: Error responses có cấu trúc

#### 🔗 Hypermedia Links

- **Pagination Links**: Links cho phân trang
- **Related Resources**: Links tới resources liên quan
- **HATEOAS**: Hypermedia As The Engine Of Application State

#### 📊 Data Formats

- **JSON Responses**: Tất cả responses đều JSON
- **ISO Date Strings**: Dates theo chuẩn ISO
- **Consistent Naming**: snake_case cho database, camelCase cho API
- **Pagination Metadata**: Thông tin phân trang chi tiết

### 🚀 Performance Optimizations

- **Database Indexing**: Indexes cho các truy vấn thường xuyên
- **Query Optimization**: Tối ưu queries MongoDB
- **Caching Strategy**: Cache cho dữ liệu tĩnh
- **Compression**: Gzip compression cho responses
- **Connection Pooling**: Pool connections MongoDB

### 🔒 Security Measures

- **JWT Expiration**: Tokens có thời hạn
- **Password Policies**: Chính sách mật khẩu mạnh
- **Input Sanitization**: Sanitize tất cả inputs
- **Helmet Security Headers**: Security headers
- **Rate Limiting**: Bảo vệ chống brute force
- **CORS Configuration**: CORS properly configured

### 🐛 Bug Fixes

- **Memory Leaks**: Fixed potential memory leaks
- **Race Conditions**: Fixed race conditions in async operations
- **Validation Bypass**: Fixed validation bypass attempts
- **Error Propagation**: Proper error propagation

### 📈 Improvements

- **Code Quality**: Improved code readability and maintainability
- **Performance**: Optimized database queries and API responses
- **Developer Experience**: Better development tools and documentation
- **User Experience**: Consistent API responses and error messages

---

## [1.1.0] - 2024-01-XX

### 🔄 Changed (Thay đổi)

#### 📦 Library Modernization

- **Validation**: Chuyển từ Joi + Express-validator sang **Zod** cho type-safe validation
- **Logging**: Chuyển từ Winston sang **Pino** cho high-performance JSON logging
- **Password Hashing**: Chuyển từ bcryptjs sang **bcrypt** native implementation
- **Dependencies**: Nâng cấp tất cả packages lên phiên bản mới nhất
- **TypeScript Support**: Thêm @types packages cho development

#### 🏗️ Architecture Improvements

- **Validation Middleware**: Tái cấu trúc validation với Zod schemas
- **Logger Configuration**: Pino với pretty printing cho development
- **Error Handling**: Tối ưu error responses với Zod validation
- **Type Safety**: Cải thiện type safety với Zod

#### 📚 Documentation Updates

- **README**: Cập nhật technology stack
- **API Reference**: Thêm thông tin về Zod validation
- **CHANGELOG**: Ghi nhận library upgrades

---

## Types of changes

- `✨ Added` for new features
- `🔄 Changed` for changes in existing functionality
- `🐛 Fixed` for any bug fixes
- `🗑️ Removed` for now removed features
- `🔒 Security` in case of vulnerabilities
- `📚 Documentation` for documentation updates
- `🏗️ Infrastructure` for infrastructure changes

---

## Migration Guide

### From 0.x to 1.0.0

1. **Environment Variables**: Cập nhật `.env` với các biến mới
2. **Database Migration**: Chạy seed script để tạo dữ liệu mẫu
3. **API Changes**: Cập nhật frontend calls theo API reference mới
4. **Authentication**: Implement JWT token refresh logic

---

_Để biết thêm chi tiết về từng thay đổi, xem commit history hoặc issues trên repository._
