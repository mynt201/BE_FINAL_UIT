# 🗄️ Database Setup Guide

## MongoDB Installation & Setup

### 1. Install MongoDB

#### Windows

```bash
# Download từ https://www.mongodb.com/try/download/community
# Hoặc sử dụng Chocolatey:
choco install mongodb
```

#### macOS (using Homebrew)

```bash
brew install mongodb-community
```

#### Linux (Ubuntu)

```bash
sudo apt-get install gnupg
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 2. Start MongoDB Service

#### Windows (as Service)

```bash
net start MongoDB
```

#### Windows (Manual)

```bash
# Mở Command Prompt as Administrator
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

#### macOS

```bash
brew services start mongodb-community
# Hoặc manual:
mongod --dbpath /usr/local/var/mongodb
```

#### Linux

```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Verify MongoDB is Running

```bash
# Check service status
mongo --eval "db.runCommand({ping:1})"

# Hoặc connect to MongoDB shell
mongosh
```

### 4. Create Database Directory (if needed)

```bash
# Windows
mkdir "C:\data\db"

# macOS/Linux
sudo mkdir -p /data/db
sudo chown -R `id -un` /data/db
```

## Database Seeding

### 1. Install Dependencies

```bash
cd flood-risk-backend
npm install
```

### 2. Run Database Seeding

```bash
# Với TypeScript (recommended)
npm run seed

# Hoặc với JavaScript
npm run seed:js
```

### 3. Verify Data

```bash
# Connect to MongoDB shell
mongosh flood-risk-db

# Check collections
db.users.find()
db.wards.find()
db.weather.find()
db.riskindices.find()
```

## Sample Data Structure

### Users Collection

```javascript
{
  "_id": ObjectId("..."),
  "username": "admin",
  "email": "admin@floodrisk.com",
  "role": "admin",
  "fullName": "Administrator",
  "isActive": true,
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

### Wards Collection

```javascript
{
  "_id": ObjectId("..."),
  "ward_name": "Phường 1",
  "district": "Quận 1",
  "population_density": 25000,
  "low_elevation": 1.2,
  "coordinates": {
    "latitude": 10.7745,
    "longitude": 106.6987
  },
  "risk_level": "medium",
  "isActive": true
}
```

### Weather Collection

```javascript
{
  "_id": ObjectId("..."),
  "date": ISODate("2024-01-01"),
  "location": {
    "ward_id": ObjectId("..."),
    "ward_name": "Phường 1",
    "coordinates": { "latitude": 10.7745, "longitude": 106.6987 }
  },
  "temperature": { "min": 25, "max": 32, "avg": 28.5 },
  "rainfall": 12.5,
  "humidity": 75,
  "weather_condition": "rain"
}
```

### RiskIndex Collection

```javascript
{
  "_id": ObjectId("..."),
  "ward_id": ObjectId("..."),
  "ward_name": "Phường 1",
  "calculation_date": ISODate("2024-01-01"),
  "period": "daily",
  "exposure": 2.3,
  "susceptibility": 1.8,
  "resilience": 0.9,
  "risk_score": 3.2,
  "risk_level": "high"
}
```

## Database Schema Design

### Relationships

- **Weather** → **Ward** (ward_id reference)
- **RiskIndex** → **Ward** (ward_id reference)
- **Users** standalone collection

### Indexes

```javascript
// Users
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Wards
db.wards.createIndex({ ward_name: 1 }, { unique: true });
db.wards.createIndex({ risk_level: 1 });

// Weather
db.weather.createIndex({ date: 1, 'location.ward_id': 1 });
db.weather.createIndex({ rainfall: -1, date: -1 });

// RiskIndex
db.riskindex.createIndex({ ward_id: 1, calculation_date: -1 });
db.riskindex.createIndex({ risk_level: 1, calculation_date: -1 });
```

## Backup & Restore

### Backup

```bash
# Backup entire database
mongodump --db flood-risk-db --out /path/to/backup

# Backup specific collection
mongodump --db flood-risk-db --collection users --out /path/to/backup
```

### Restore

```bash
# Restore entire database
mongorestore --db flood-risk-db /path/to/backup/flood-risk-db

# Restore specific collection
mongorestore --db flood-risk-db --collection users /path/to/backup/flood-risk-db/users.bson
```

## Monitoring & Maintenance

### Check Database Status

```javascript
// In MongoDB shell
db.serverStatus();
db.stats();
```

### Monitor Connections

```javascript
db.serverStatus().connections;
```

### View Slow Queries

```javascript
db.system.profile.find().sort({ ts: -1 }).limit(5);
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused

```
Error: connect ECONNREFUSED ::1:27017
```

**Solution:**

- Check if MongoDB service is running
- Verify connection string in `.env`
- Check firewall settings

#### 2. Authentication Failed

```
Error: Authentication failed
```

**Solution:**

- Verify username/password in connection string
- Check user permissions in MongoDB

#### 3. Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::27017
```

**Solution:**

- Kill existing MongoDB process
- Change port in configuration

#### 4. Data Directory Permissions

```
Error: Unable to create/open lock file
```

**Solution:**

- Check permissions on data directory
- Run MongoDB with appropriate user permissions

### Performance Tuning

#### Connection Pool

```javascript
// In application
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

#### Indexing Strategy

```javascript
// Create compound indexes for queries
db.weather.createIndex({
  'location.ward_id': 1,
  date: -1,
  rainfall: -1,
});
```

## Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/flood-risk-db

# For production with authentication
MONGO_URI=mongodb://username:password@localhost:27017/flood-risk-db

# For MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/flood-risk-db
```

## Migration Scripts

### Schema Updates

```javascript
// Example migration script
const migrateUsers = async () => {
  const users = await db.users.find({ role: { $exists: false } });
  for (const user of users) {
    await db.users.updateOne({ _id: user._id }, { $set: { role: 'user' } });
  }
};
```

## Data Validation

### Schema Validation

```javascript
// Enable strict schema validation
db.createCollection('wards', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['ward_name', 'district', 'coordinates'],
      properties: {
        ward_name: { bsonType: 'string' },
        coordinates: {
          bsonType: 'object',
          properties: {
            latitude: { bsonType: 'double' },
            longitude: { bsonType: 'double' },
          },
        },
      },
    },
  },
});
```

This comprehensive database setup ensures your Flood Risk Management system has a robust, scalable, and maintainable data layer! 🚀📊
