# Adding New Modules

This guide walks you through the process of adding a new feature module to the application.

## Table of Contents

- [Quick Start](#quick-start)
- [Step-by-Step Guide](#step-by-step-guide)
- [Complete Example: Products Module](#complete-example-products-module)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Create module directory
mkdir -p src/modules/products

# Create module files
touch src/modules/products/products.service.ts
touch src/modules/products/products.controller.ts
touch src/modules/products/products.routes.ts
touch src/modules/products/products.validation.ts
touch src/modules/products/index.ts
```

---

## Step-by-Step Guide

### Step 1: Define Database Model

Add your model to `prisma/schema.prisma`:

```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Float
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("products")
}
```

Run migration:

```bash
npm run prisma:migrate
```

### Step 2: Create Validation Schemas

```typescript
// src/modules/products/products.validation.ts
import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).optional(),
  price: Joi.number().positive().required(),
  stock: Joi.number().integer().min(0).default(0),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  price: Joi.number().positive().optional(),
  stock: Joi.number().integer().min(0).optional(),
}).min(1); // At least one field required

export const getProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional(),
});
```

### Step 3: Create Service

```typescript
// src/modules/products/products.service.ts
import { getDatabase } from '../../config/database';
import { NotFoundError } from '../../core/errors';
import { PaginationParams, PaginatedResult } from '../../shared/types';

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock?: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export class ProductsService {
  private prisma = getDatabase();

  async findAll(params: PaginationParams): Promise<PaginatedResult<Product>> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { isActive: true } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  async create(data: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    await this.findById(id); // Ensure exists
    return this.prisma.product.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // Ensure exists
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false }, // Soft delete
    });
  }
}
```

### Step 4: Create Controller

```typescript
// src/modules/products/products.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service';
import { sendSuccess, sendPaginated } from '../../core/response';

export class ProductsController {
  private productsService = new ProductsService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query;
      const result = await this.productsService.findAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      });

      return sendPaginated(res, 'Products retrieved', result.data, result.meta);
    } catch (error) {
      next(error);
    }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productsService.findById(req.params.id);
      return sendSuccess(res, 'Product retrieved', product);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productsService.create(req.body);
      return sendSuccess(res, 'Product created', product, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await this.productsService.update(req.params.id, req.body);
      return sendSuccess(res, 'Product updated', product);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.productsService.delete(req.params.id);
      return sendSuccess(res, 'Product deleted', null, 204);
    } catch (error) {
      next(error);
    }
  };
}
```

### Step 5: Create Routes

```typescript
// src/modules/products/products.routes.ts
import { Router } from 'express';
import { ProductsController } from './products.controller';
import { validate } from '../../middleware/validation';
import { authenticate, authorize } from '../../middleware/auth';
import {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
} from './products.validation';

const router = Router();
const controller = new ProductsController();

// Public routes
router.get('/', validate(getProductsSchema, 'query'), controller.getAll);
router.get('/:id', controller.getOne);

// Protected routes (require authentication)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createProductSchema),
  controller.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateProductSchema),
  controller.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  controller.delete,
);

export const productsRoutes = router;
```

### Step 6: Create Index Export

```typescript
// src/modules/products/index.ts
export * from './products.controller';
export * from './products.routes';
export * from './products.service';
export * from './products.validation';
```

### Step 7: Register Routes

```typescript
// src/app.ts
import { productsRoutes } from './modules/products';

// Inside createApp() function, add to apiRouter:
apiRouter.use('/products', productsRoutes);
```

---

## Best Practices

### 1. Keep Services Pure

Services should contain only business logic, no HTTP-specific code:

```typescript
// ✅ Good
async createProduct(data: CreateProductDto): Promise<Product> {
  return this.prisma.product.create({ data });
}

// ❌ Bad - Don't use res object in service
async createProduct(data: CreateProductDto, res: Response) {
  const product = await this.prisma.product.create({ data });
  res.json(product); // HTTP logic in service!
}
```

### 2. Use DTOs for Input/Output

Define clear data contracts:

```typescript
// Input DTO
export interface CreateProductDto {
  name: string;
  price: number;
}

// Output DTO (optional - for hiding internal fields)
export interface ProductResponseDto {
  id: string;
  name: string;
  price: number;
  // No internal fields like createdAt, updatedAt
}
```

### 3. Validate at the Edge

Validation happens in middleware, not service:

```typescript
// Route with validation middleware
router.post('/', validate(createProductSchema), controller.create);

// Controller receives validated data
create = async (req: Request, res: Response) => {
  // req.body is already validated
  const product = await this.service.create(req.body);
};
```

### 4. Handle Errors Appropriately

```typescript
// Let errors bubble up to global handler
create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await this.service.create(req.body);
    return sendSuccess(res, 'Created', product, 201);
  } catch (error) {
    next(error); // Global handler will format response
  }
};
```

---

## Troubleshooting

### "Cannot find module" Error

Ensure the module is exported in `index.ts`:

```typescript
// src/modules/products/index.ts
export * from './products.routes';
```

### Database Errors

1. Run `npm run prisma:generate` after schema changes
2. Run `npm run prisma:migrate` to apply migrations
3. Check `DATABASE_URL` in `.env`

### TypeScript Errors

Ensure correct imports:

```typescript
// Use relative paths
import { ProductsService } from './products.service';

// Or use path aliases (if configured)
import { NotFoundError } from '@core/errors';
```
