# Phase 1: Project Setup & Database

## Initialize Project

```bash
npx create-next-app@latest recipe-planner --typescript --tailwind --eslint --app --src-dir
cd recipe-planner

npm install prisma @prisma/client
npm install @tanstack/react-query axios
npm install next-auth @auth/prisma-adapter bcryptjs
npm install zod react-hook-form @hookform/resolvers
npm install date-fns lucide-react
npm install -D @types/bcryptjs
```

## Environment Variables

```env
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/recipe_planner"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
SPOONACULAR_API_KEY="your-spoonacular-api-key"
```

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  favorites     Favorite[]
  mealPlans     MealPlan[]
  shoppingLists ShoppingList[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model CachedRecipe {
  id              Int      @id
  title           String
  image           String?
  imageType       String?
  servings        Int?
  readyInMinutes  Int?
  sourceUrl       String?
  summary         String?  @db.Text
  cuisines        String[] @default([])
  dishTypes       String[] @default([])
  diets           String[] @default([])
  instructions    String?  @db.Text
  extendedIngredients Json?
  nutrition       Json?
  cachedAt        DateTime @default(now())
  updatedAt       DateTime @updatedAt

  favorites       Favorite[]
  mealPlanEntries MealPlanEntry[]

  @@index([cachedAt])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  recipeId  Int
  createdAt DateTime @default(now())

  user   User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe CachedRecipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([userId, recipeId])
  @@index([userId])
}

model MealPlan {
  id        String   @id @default(cuid())
  userId    String
  name      String
  weekStart DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  entries MealPlanEntry[]

  @@index([userId, weekStart])
}

model MealPlanEntry {
  id         String   @id @default(cuid())
  mealPlanId String
  recipeId   Int
  dayOfWeek  Int      // 0 = Monday, 6 = Sunday
  mealType   MealType
  servings   Int      @default(1)

  mealPlan MealPlan     @relation(fields: [mealPlanId], references: [id], onDelete: Cascade)
  recipe   CachedRecipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([mealPlanId])
}

model ShoppingList {
  id        String   @id @default(cuid())
  userId    String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  items ShoppingListItem[]

  @@index([userId])
}

model ShoppingListItem {
  id             String  @id @default(cuid())
  shoppingListId String
  name           String
  amount         Float?
  unit           String?
  aisle          String?
  checked        Boolean @default(false)

  shoppingList ShoppingList @relation(fields: [shoppingListId], references: [id], onDelete: Cascade)

  @@index([shoppingListId])
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}
```

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Database Client

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```
