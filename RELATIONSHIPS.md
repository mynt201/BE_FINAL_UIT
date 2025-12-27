# 🗂️ Database Relationships & Schema

## Quan hệ giữa các Entities

### 1. User_account ↔ System usage: 1-N
```
User (1) ──────────────── (N) SystemUsage
├── _id (PK)
├── username
├── email
├── role
└── ...other fields

SystemUsage
├── _id (PK)
├── user_id (FK → User._id)
├── ward_id (FK → Ward._id) [optional]
├── action
├── start_time
├── end_time
├── status
└── ...other tracking fields
```

**Ý nghĩa:** Một người dùng có thể thực hiện nhiều hành động trên hệ thống, mỗi hành động được ghi lại để audit và analytics.

---

### 2. Ward ↔ Weather data: 1-N
```
Ward (1) ──────────────── (N) Weather
├── _id (PK)
├── ward_name
├── coordinates
├── population_density
└── ...other ward fields

Weather
├── _id (PK)
├── date
├── location.ward_id (FK → Ward._id)
├── temperature {min, max, avg}
├── rainfall
├── humidity
└── ...other weather fields
```

**Ý nghĩa:** Mỗi khu vực có nhiều bản ghi thời tiết theo ngày để theo dõi điều kiện thời tiết và tính toán rủi ro.

---

### 3. Ward ↔ Drainage system: 1-N
```
Ward (1) ──────────────── (N) DrainageSystem
├── _id (PK)
├── ward_name
├── coordinates
└── ...other ward fields

DrainageSystem
├── _id (PK)
├── ward_id (FK → Ward._id)
├── system_name
├── system_type
├── design_capacity
├── current_flow_rate
├── condition
└── ...other drainage fields
```

**Ý nghĩa:** Một phường có thể có nhiều hệ thống thoát nước khác nhau (surface, underground, combined system) để quản lý nước mưa và nước thải.

---

### 4. Ward ↔ Road bridge: 1-N
```
Ward (1) ──────────────── (N) RoadBridge
├── _id (PK)
├── ward_name
├── coordinates
└── ...other ward fields

RoadBridge
├── _id (PK)
├── ward_id (FK → Ward._id)
├── name
├── type (road/bridge/culvert/tunnel)
├── category (national/provincial/district)
├── status
├── specifications {length, width, lanes}
└── ...other infrastructure fields
```

**Ý nghĩa:** Mỗi phường có nhiều công trình hạ tầng giao thông (đường sá, cầu, cống, hầm) cần được quản lý và bảo trì.

---

### 5. Ward ↔ Risk index: 1-1 (aggregated)
```
Ward (1) ──────────────── (1) RiskIndex (aggregated)
├── _id (PK)
├── ward_name
├── calculatedRisk (virtual)
└── ...other ward fields

RiskIndex
├── _id (PK)
├── ward_id (FK → Ward._id)
├── calculation_date
├── period (daily/weekly/monthly/yearly)
├── risk_score
├── risk_level
├── factors {population_density, elevation, rainfall}
└── ...other risk fields
```

**Ý nghĩa:** Mỗi phường có một chỉ số rủi ro tổng hợp được tính toán từ nhiều yếu tố, được cập nhật theo thời gian.

---

### 6. Ward ↔ System usage: 1-N
```
Ward (1) ──────────────── (N) SystemUsage
├── _id (PK)
├── ward_name
├── coordinates
└── ...other ward fields

SystemUsage
├── _id (PK)
├── user_id (FK → User._id)
├── ward_id (FK → Ward._id) [optional]
├── action
├── start_time
├── end_time
├── status
└── ...other tracking fields
```

**Ý nghĩa:** Các hoạt động của người dùng có thể liên quan đến một khu vực cụ thể (ví dụ: xem báo cáo rủi ro của phường X).

---

## Database Schema Overview

### Collections & Relationships

```
┌─────────────────┐     ┌─────────────────┐
│      User       │     │  SystemUsage   │
│                 │1   N│                 │
│  _id (PK)       │─────│  _id (PK)      │
│  username       │     │  user_id (FK)  │
│  email          │     │  ward_id (FK)  │
│  role           │     │  action        │
│  ...            │     │  start_time    │
└─────────────────┘     │  ...           │
                        └─────────────────┘
                               │
                               │ N
                               │
                        ┌─────────────────┐
                        │      Ward       │
                        │                 │
                        │  _id (PK)       │
                        │  ward_name      │
                        │  coordinates    │
                        │  ...            │
                        └─────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              │ N              │ N              │ N
              │                │                │
    ┌─────────▼─────┐ ┌────────▼─────┐ ┌────────▼─────┐
    │   Weather    │ │DrainageSystem│ │  RoadBridge │
    │              │ │              │ │             │
    │  ward_id (FK)│ │  ward_id (FK)│ │ ward_id (FK)│
    │  date        │ │  system_name │ │  name       │
    │  rainfall    │ │  capacity    │ │  type       │
    │  ...         │ │  condition   │ │  status     │
    └──────────────┘ └──────────────┘ └─────────────┘
```

### Key Relationships Summary

| Entity 1 | Relationship | Entity 2 | Cardinality | Purpose |
|----------|-------------|----------|-------------|---------|
| User | → | SystemUsage | 1-N | Track user activities |
| Ward | → | Weather | 1-N | Daily weather data |
| Ward | → | DrainageSystem | 1-N | Water drainage systems |
| Ward | → | RoadBridge | 1-N | Infrastructure assets |
| Ward | → | RiskIndex | 1-1 | Aggregated risk scores |
| Ward | → | SystemUsage | 1-N | Ward-related activities |

### Indexes Strategy

```javascript
// User indexes
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Ward indexes
db.wards.createIndex({ ward_name: 1 }, { unique: true });
db.wards.createIndex({ coordinates: '2dsphere' });

// Weather indexes
db.weather.createIndex({ 'location.ward_id': 1, date: -1 });
db.weather.createIndex({ rainfall: -1, date: -1 });

// SystemUsage indexes
db.systemusage.createIndex({ user_id: 1, start_time: -1 });
db.systemusage.createIndex({ ward_id: 1, start_time: -1 });
db.systemusage.createIndex({ action: 1, start_time: -1 });

// DrainageSystem indexes
db.drainagesystems.createIndex({ ward_id: 1, system_type: 1 });
db.drainagesystems.createIndex({ condition: 1 });

// RoadBridge indexes
db.roadbridges.createIndex({ ward_id: 1, type: 1 });
db.roadbridges.createIndex({ status: 1 });

// RiskIndex indexes
db.riskindices.createIndex({ ward_id: 1, calculation_date: -1 });
db.riskindices.createIndex({ risk_level: 1, calculation_date: -1 });
```

### Data Flow

1. **User Authentication** → SystemUsage tracking
2. **Weather Data Collection** → RiskIndex calculation
3. **Infrastructure Management** → Risk assessment
4. **System Monitoring** → Analytics & reporting

### Aggregation Examples

#### Risk Distribution by Ward
```javascript
db.riskindices.aggregate([
  { $match: { period: 'monthly' } },
  { $sort: { calculation_date: -1 } },
  { $group: { _id: '$ward_id', latestRisk: { $first: '$$ROOT' } } },
  { $lookup: { from: 'wards', localField: '_id', foreignField: '_id', as: 'ward' } }
]);
```

#### User Activity Summary
```javascript
db.systemusage.aggregate([
  { $match: { start_time: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
  { $group: { _id: '$user_id', actions: { $sum: 1 }, lastActivity: { $max: '$start_time' } } },
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } }
]);
```

This comprehensive database schema ensures efficient data relationships and optimal query performance for the flood risk management system! 🎯📊
