# 📚 API Reference - Flood Risk Backend

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-api-domain.com/api
```

## 🔐 Authentication

### POST /auth/register
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
}
```

### POST /auth/login
Đăng nhập

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

### POST /auth/refresh
Refresh access token

### GET /auth/me
Lấy thông tin user hiện tại (cần authentication)

---

## 👥 User Management

### GET /users
Lấy danh sách users với phân trang, tìm kiếm, lọc

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số item/trang (default: 10)
- `search`: Từ khóa tìm kiếm
- `role`: Lọc theo vai trò (all/admin/user)

**Headers:** `Authorization: Bearer <token>`

### POST /users
Tạo user mới (Admin only)

### PUT /users/:id
Cập nhật user (Admin only)

### DELETE /users/:id
Xóa user (Admin only)

### POST /users/:id/avatar
Upload avatar user

---

## 📊 Statistics

### GET /statistics/daily
Thống kê theo ngày

**Query:**
- `year`: Năm (default: năm hiện tại)
- `month`: Tháng (default: tháng hiện tại)

### GET /statistics/monthly
Thống kê theo tháng

**Query:**
- `year`: Năm (default: năm hiện tại)

### GET /statistics/yearly
Thống kê theo năm

**Query:**
- `startYear`: Năm bắt đầu (default: 4 năm trước)
- `endYear`: Năm kết thúc (default: năm hiện tại)

### GET /statistics/comparison
So sánh 2 giai đoạn

**Query:**
- `startDate`: Ngày bắt đầu (required)
- `endDate`: Ngày kết thúc (required)

---

## 📋 Dashboard

### GET /dashboard/stats
Lấy thống kê tổng quan dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 15,
      "totalWards": 25,
      "totalWeatherRecords": 750,
      "totalRiskRecords": 125
    },
    "userStats": {
      "admin": 3,
      "user": 12
    },
    "riskDistribution": [...],
    "recentUsers": [...],
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🗂️ Data Management

### Wards (Khu vực)

#### GET /data/wards
Lấy danh sách wards

#### POST /data/wards
Tạo ward mới (Admin)

#### PUT /data/wards/:id
Cập nhật ward (Admin)

#### DELETE /data/wards/:id
Xóa ward (Admin)

### Weather Data (Dữ liệu thời tiết)

#### GET /data/weather
Lấy dữ liệu thời tiết

**Query:**
- `startDate`: Ngày bắt đầu
- `endDate`: Ngày kết thúc
- `ward_id`: ID ward

#### POST /data/weather
Tạo dữ liệu thời tiết (Admin)

#### PUT /data/weather/:id
Cập nhật dữ liệu thời tiết (Admin)

#### DELETE /data/weather/:id
Xóa dữ liệu thời tiết (Admin)

### Risk Index (Chỉ số rủi ro)

#### GET /data/risk-index
Lấy chỉ số rủi ro

**Query:**
- `ward_id`: ID ward
- `startDate`: Ngày bắt đầu
- `endDate`: Ngày kết thúc

#### POST /data/risk-index
Tạo chỉ số rủi ro (Admin)

#### PUT /data/risk-index/:id
Cập nhật chỉ số rủi ro (Admin)

#### DELETE /data/risk-index/:id
Xóa chỉ số rủi ro (Admin)

---

## ⚙️ Settings

### GET /settings
Lấy cài đặt hệ thống

### PUT /settings
Cập nhật cài đặt hệ thống (Admin)

---

## 📝 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "User role admin is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Server error"
}
```

---

## 🔒 Authentication Headers

Tất cả API (trừ `/auth/*`) đều yêu cầu header:

```
Authorization: Bearer <access_token>
```

### Refresh Token Flow

1. Client gửi request với access token
2. Nếu access token hết hạn (401), gọi `/auth/refresh` với refresh token
3. Server trả về access token mới
4. Client retry request với access token mới

---

## 📊 Rate Limiting

- **Window**: 15 phút
- **Max requests**: 100 requests/IP
- Có thể cấu hình trong `.env`

---

## 🧪 Testing

### Chạy tests
```bash
npm test
```

### Chạy với coverage
```bash
npm test -- --coverage
```

### Sample Test Data
Sau khi chạy `npm run seed`, bạn có:
- **Admin**: admin / Admin123!
- **Users**: user1, user2 / User123!
- **Wards**: 5 wards mẫu
- **Weather**: 30 ngày dữ liệu thời tiết

---

## 🔗 Frontend Integration

### Axios Setup
```javascript
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor để thêm token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor để handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/auth/refresh', { refreshToken });
        localStorage.setItem('token', data.accessToken);
        // Retry original request
        return api(error.config);
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Error Handling
```javascript
try {
  const response = await api.get('/users');
  console.log(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('API Error:', error.response.data.error);
  } else if (error.request) {
    // Network error
    console.error('Network Error:', error.message);
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```
