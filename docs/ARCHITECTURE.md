# Architecture Documentation

This document provides an in-depth look at the architectural decisions and patterns used in this Node.js template.

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Layer Architecture](#layer-architecture)
- [Module Structure](#module-structure)
- [Request Flow](#request-flow)
- [Error Handling Strategy](#error-handling-strategy)
- [Configuration Management](#configuration-management)

---

## Overview

This template implements a **Clean Architecture** pattern adapted for Node.js/Express applications. The architecture prioritizes:

- **Maintainability**: Easy to understand and modify
- **Testability**: Each component can be tested in isolation
- **Scalability**: New features can be added without affecting existing code
- **Flexibility**: Easy to swap implementations (e.g., database, external services)

---

## Design Principles

### 1. Single Responsibility Principle (SRP)

Each module, class, and function has one specific responsibility:

- **Controllers**: Handle HTTP requests/responses
- **Services**: Implement business logic
- **Middleware**: Process requests before they reach controllers
- **Repositories** (optional): Abstract database operations

### 2. Dependency Inversion

High-level modules don't depend on low-level modules. Both depend on abstractions:

```typescript
// Service depends on abstract database interface, not concrete implementation
class UserService {
  constructor(private db: DatabaseClient) {}
}
```

### 3. Separation of Concerns

Each layer has clear boundaries:

```
HTTP Concerns (Routes, Controllers, Middleware)
              ↓
Business Concerns (Services, Validators, DTOs)
              ↓
Data Concerns (Prisma, Models)
```

---

## Layer Architecture

### HTTP Layer

**Location**: `src/middleware/`, `src/modules/*/routes.ts`, `src/modules/*/controller.ts`

**Responsibilities**:
- Route definitions
- Request parsing
- Input validation
- Response formatting
- Authentication/Authorization

```typescript
// Route defines endpoint and middleware chain
router.post('/', authenticate, validate(createUserSchema), controller.create);
```

### Business Layer

**Location**: `src/modules/*/service.ts`

**Responsibilities**:
- Business logic implementation
- Data transformation
- Orchestrating multiple repository calls
- Business rule validation

```typescript
class UserService {
  async createUser(data: CreateUserDto) {
    // Business logic: hash password, send email, etc.
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({ data: { ...data, password: hashedPassword } });
  }
}
```

### Data Layer

**Location**: `prisma/`, `src/config/database.ts`

**Responsibilities**:
- Database schema definition
- Data persistence
- Query optimization

---

## Module Structure

Each feature module is self-contained:

```
modules/
├── users/
│   ├── users.controller.ts   # HTTP handlers
│   ├── users.service.ts      # Business logic
│   ├── users.routes.ts       # Route definitions
│   ├── users.dto.ts          # Data transfer objects
│   ├── users.validation.ts   # Joi/Zod schemas
│   └── index.ts              # Public exports
```

### Module Guidelines

1. **Keep modules independent**: A module should not directly import from another module's internal files
2. **Use index exports**: Only export what's needed via `index.ts`
3. **Consistent naming**: `{module}.{layer}.ts` pattern
4. **Optional files**: Not all modules need all files (e.g., simple CRUD might skip DTOs)

---

## Request Flow

```
Client Request
      ↓
┌─────────────────────┐
│   Express Server    │
└─────────────────────┘
      ↓
┌─────────────────────┐
│ Global Middleware   │  (helmet, cors, compression)
└─────────────────────┘
      ↓
┌─────────────────────┐
│    Rate Limiter     │
└─────────────────────┘
      ↓
┌─────────────────────┐
│      Router         │  (/api/v1/users)
└─────────────────────┘
      ↓
┌─────────────────────┐
│ Route Middleware    │  (auth, validation)
└─────────────────────┘
      ↓
┌─────────────────────┐
│    Controller       │
└─────────────────────┘
      ↓
┌─────────────────────┐
│     Service         │
└─────────────────────┘
      ↓
┌─────────────────────┐
│     Database        │
└─────────────────────┘
      ↓
  Response sent
```

---

## Error Handling Strategy

### Custom Error Classes

All errors extend base `AppError` class:

```typescript
class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;  // Expected errors vs bugs
}
```

### Error Types

| Error | Status | Usage |
|-------|--------|-------|
| `BadRequestError` | 400 | Invalid input |
| `UnauthorizedError` | 401 | Missing/invalid auth |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource not found |
| `ValidationError` | 422 | Schema validation failed |
| `TooManyRequestsError` | 429 | Rate limit exceeded |

### Global Error Handler

All errors flow to the global error handler (`src/middleware/errorHandler.ts`):

1. **Log the error** with full stack trace
2. **Determine if operational** (expected) or programming error
3. **Format response** accordingly
4. **Hide details in production** for non-operational errors

---

## Configuration Management

### Environment-Based Config

```typescript
// src/config/index.ts
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  database: {
    url: process.env.DATABASE_URL,
  },
  // ... more config
};
```

### Best Practices

1. **Never commit `.env`**: Use `.env.example` as template
2. **Validate required vars**: Fail fast if critical config missing
3. **Use typed config**: TypeScript interfaces for config object
4. **Environment-specific behavior**: Use `config.isDevelopment`, `config.isProduction`

---

## Extending the Architecture

### Adding a Repository Layer

For complex data access patterns:

```typescript
// src/modules/users/users.repository.ts
class UsersRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
```

### Adding Caching

```typescript
// src/core/cache.ts
import Redis from 'ioredis';

export const cache = new Redis(config.redis);

// In service
async getUser(id: string) {
  const cached = await cache.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await this.prisma.user.findUnique({ where: { id } });
  await cache.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

### Adding Event System

```typescript
// src/core/events.ts
import { EventEmitter } from 'events';

export const eventBus = new EventEmitter();

// Emit events from services
eventBus.emit('user.created', user);

// Subscribe to events
eventBus.on('user.created', async (user) => {
  await sendWelcomeEmail(user);
});
```
