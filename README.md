# Node.js Architecture Template

A production-ready, clean architecture Node.js skeleton template. No business logic - just a solid foundation for building scalable backend applications.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18+-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.0+-2D3748?logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Adding New Modules](#adding-new-modules)
- [Configuration](#configuration)
- [API Standards](#api-standards)
- [Development Workflow](#development-workflow)

---

## Architecture Overview

This template follows a **Clean/Layered Architecture** pattern, ensuring separation of concerns and maintainability.

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Routes    │  │ Controllers │  │ Middleware  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                       Business Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Services   │  │ Validators  │  │    DTOs     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Prisma    │  │   Models    │  │ Repositories│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **HTTP Layer** | Request handling, routing, input validation, middleware |
| **Business Layer** | Business logic, data transformation, service orchestration |
| **Data Layer** | Database operations, data persistence, ORM models |

### Key Principles

- **Single Responsibility**: Each module handles one specific domain
- **Dependency Injection**: Services are injected, not instantiated inline
- **Separation of Concerns**: Clear boundaries between layers
- **Testability**: Each layer can be tested in isolation

---

## Tech Stack

### Core

| Package | Purpose |
|---------|--------|
| **Express.js** | Fast, minimal web framework |
| **TypeScript** | Type safety and better DX |
| **Prisma** | Type-safe ORM for database operations |

### Security

| Package | Purpose |
|---------|--------|
| **Helmet** | Security headers |
| **CORS** | Cross-origin resource sharing |
| **express-rate-limit** | Rate limiting protection |

### Validation & Logging

| Package | Purpose |
|---------|--------|
| **Joi** | Schema validation |
| **Winston** | Structured logging |

### Performance

| Package | Purpose |
|---------|--------|
| **compression** | Response compression |

### Development

| Package | Purpose |
|---------|--------|
| **ts-node-dev** | Hot reload development |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Jest** | Testing framework |

### Infrastructure

| Tool | Purpose |
|------|--------|
| **Docker** | Containerization |
| **PostgreSQL** | Primary database |
| **Redis** | Caching (optional) |

---

## Directory Structure

```
nodejs-architecture/
├── prisma/
│   └── schema.prisma         # Database schema
├── src/
│   ├── config/               # Configuration management
│   │   ├── index.ts          # Environment config loader
│   │   └── database.ts       # Database connection
│   ├── core/                 # Core utilities
│   │   ├── logger.ts         # Winston logger setup
│   │   ├── errors.ts         # Custom error classes
│   │   └── response.ts       # Standardized responses
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts           # Authentication
│   │   ├── validation.ts     # Request validation
│   │   ├── errorHandler.ts   # Global error handler
│   │   └── rateLimiter.ts    # Rate limiting
│   ├── modules/              # Feature modules
│   │   └── health/           # Health check example
│   │       ├── health.controller.ts
│   │       ├── health.routes.ts
│   │       ├── health.service.ts
│   │       └── index.ts
│   ├── shared/               # Shared utilities
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── constants/        # Application constants
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── docker-compose.yml        # Docker services
├── Dockerfile                # Production container
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose (optional)
- PostgreSQL (if not using Docker)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/zylex-io/nodejs-architecture.git
cd nodejs-architecture

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start database (Docker)
npm run docker:up

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### Using Docker only

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

---

## Adding New Modules

Follow these steps to add a new feature module:

### 1. Create Module Directory

```bash
mkdir -p src/modules/users
```

### 2. Create Service (Business Logic)

```typescript
// src/modules/users/users.service.ts
import { getDatabase } from '../../config/database';

export class UsersService {
  private prisma = getDatabase();

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }
}
```

### 3. Create Controller (HTTP Handling)

```typescript
// src/modules/users/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { sendSuccess } from '../../core/response';

export class UsersController {
  private usersService = new UsersService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.usersService.findAll();
      return sendSuccess(res, 'Users retrieved', users);
    } catch (error) {
      next(error);
    }
  };
}
```

### 4. Create Routes

```typescript
// src/modules/users/users.routes.ts
import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new UsersController();

router.get('/', authenticate, controller.getAll);

export const usersRoutes = router;
```

### 5. Create Index Export

```typescript
// src/modules/users/index.ts
export * from './users.controller';
export * from './users.routes';
export * from './users.service';
```

### 6. Register Routes in App

```typescript
// src/app.ts
import { usersRoutes } from './modules/users';

// Inside createApp function
apiRouter.use('/users', usersRoutes);
```

### Module Structure

```
src/modules/users/
├── users.controller.ts   # HTTP request handlers
├── users.routes.ts       # Route definitions
├── users.service.ts      # Business logic
├── users.dto.ts          # Data transfer objects (optional)
├── users.validation.ts   # Joi schemas (optional)
└── index.ts              # Module exports
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|--------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `API_PREFIX` | API route prefix | `/api/v1` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `LOG_LEVEL` | Logging level | `debug` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |

---

## API Standards

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Email is required"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Successful GET/PUT/PATCH |
| `201` | Successful POST (created) |
| `204` | Successful DELETE (no content) |
| `400` | Bad request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not found |
| `422` | Validation error |
| `429` | Rate limited |
| `500` | Server error |

### Error Handling

Use the custom error classes from `src/core/errors.ts`:

```typescript
import { NotFoundError, ValidationError } from '../../core/errors';

// Throw a not found error
throw new NotFoundError('User not found');

// Throw a validation error
throw new ValidationError('Validation failed', {
  email: ['Invalid email format']
});
```

---

## Development Workflow

### Code Style

- ESLint + Prettier configured
- Run `npm run lint:fix` before committing
- Use meaningful variable/function names
- Add JSDoc comments for public APIs

### Git Workflow

```bash
# Feature branch
git checkout -b feature/user-module

# Make changes, lint, and test
npm run lint:fix
npm test

# Commit with conventional commits
git commit -m "feat: add user module"
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --testPathPattern=users
```

---

## License

MIT License - feel free to use this template for any project.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
