# TypeScript Setup cho Backend

## 🎯 Tại sao dùng TypeScript?

TypeScript mang lại **type safety** và **developer experience** tốt hơn cho Node.js backend:

### ✅ **Lợi ích chính:**

- **Type Safety**: Phát hiện lỗi type tại compile time
- **IntelliSense**: Autocomplete và suggestions tốt hơn
- **Refactoring**: An toàn khi refactor code
- **Documentation**: Types làm tài liệu sống
- **Maintainability**: Code dễ maintain và debug
- **Scalability**: Tốt cho dự án lớn

## 📦 Libraries được sử dụng

### **TypeScript Core:**
```json
{
  "typescript": "^5.5.4",
  "ts-node": "^10.9.2",
  "@types/node": "^22.5.4"
}
```

### **Express Types:**
```json
{
  "@types/express": "^4.17.21",
  "@types/cors": "^2.8.17",
  "@types/compression": "^1.7.5",
  "@types/multer": "^1.4.12"
}
```

### **Authentication Types:**
```json
{
  "@types/bcrypt": "^5.0.2",
  "@types/jsonwebtoken": "^9.0.6"
}
```

## 🛠️ Cấu hình TypeScript

### **tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "logs"]
}
```

## 🏗️ Cấu trúc Types

### **Interface Definitions:**
```typescript
// src/types/index.ts
export interface IUser {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  // ... other properties
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### **Express Extensions:**
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
```

## 🚀 Scripts

### **Development:**
```bash
# Run with TypeScript directly
npm run dev

# Build to JavaScript
npm run build

# Type checking
npm run type-check
```

### **Production:**
```bash
# Build and run
npm run build
npm start
```

## 📝 Type Definitions

### **Controller Types:**
```typescript
import { Request, Response } from 'express';
import { IApiResponse, ILoginRequest } from '../types';

const login = async (
  req: Request<{}, IApiResponse, ILoginRequest>,
  res: Response<IApiResponse>
) => {
  // Type-safe request/response
};
```

### **Model Types:**
```typescript
import mongoose, { Document, Model } from 'mongoose';

interface IUserDocument extends Omit<IUser, '_id'>, Document {
  matchPassword(password: string): Promise<boolean>;
}

interface IUserModel extends Model<IUserDocument> {
  findByCredentials(identifier: string, password: string): Promise<IUserDocument>;
}

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
```

## 🔧 Best Practices

### **1. Strict Mode:**
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

### **2. Interface Segregation:**
```typescript
// Good: Separate interfaces for different concerns
interface ICreateUser {
  username: string;
  email: string;
  password: string;
}

interface IUpdateUser {
  username?: string;
  email?: string;
  role?: 'user' | 'admin';
}
```

### **3. Generic Types:**
```typescript
interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Usage
const response: IApiResponse<IUser[]> = {
  success: true,
  data: users
};
```

### **4. Utility Types:**
```typescript
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type UserWithoutPassword = Omit<IUser, 'password'>;
```

## 🐛 Common Issues & Solutions

### **1. Implicit any:**
```typescript
// Error
const users = [];

// Fix
const users: IUser[] = [];
```

### **2. Null/Undefined checks:**
```typescript
// Error
if (user.name) { ... }

// Fix
if (user.name && user.name.length > 0) { ... }
```

### **3. Type assertions:**
```typescript
// Careful with type assertions
const user = req.user as IUser; // Only if sure
```

## 🧪 Testing với TypeScript

### **Jest với TypeScript:**
```typescript
import request from 'supertest';
import app from '../src/server';
import { IApiResponse } from '../src/types';

describe('Auth API', () => {
  it('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'Admin123!'
      });

    const data: IApiResponse = response.body;
    expect(data.success).toBe(true);
  });
});
```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express with TypeScript](https://dev.to/nyagarcia/express-with-typescript-3f7p)
- [Mongoose with TypeScript](https://mongoosejs.com/docs/typescript.html)

## 🎯 Migration Strategy

### **Gradual Adoption:**
1. **Setup TypeScript config** cho dự án
2. **Convert core files** (server.ts, models, types)
3. **Add types gradually** cho existing code
4. **Update imports** từ require sang import
5. **Full conversion** khi ready

### **File Extensions:**
- `.ts` cho TypeScript files
- `.js` cho JavaScript files (legacy)
- `.d.ts` cho type definitions

## 🚀 Performance Benefits

- **Compile-time checking** prevents runtime errors
- **Better IDE support** increases productivity
- **Easier refactoring** with confidence
- **Self-documenting code** through types
- **Better maintainability** for large codebases

**TypeScript makes your backend more robust, maintainable, and scalable!** 🎉
