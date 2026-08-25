# Recipe & Meal Planner - Complete Build Guide

## Project Overview

A full-stack meal planning application that integrates with an external recipe API (Spoonacular), allowing users to search recipes, save favorites, plan weekly meals, and generate shopping lists.

---

## Phases

The implementation plan has been split into individual files for better readability and organization.

- **[Phase 1: Project Setup & Database](./phases/phase-1-setup.md)**
  Scaffold Next.js app, configure environment variables, Prisma schema, and DB client.

- **[Phase 2: External API Integration](./phases/phase-2-api-integration.md)**
  Type definitions, Spoonacular client with caching, and filter constants.

- **[Phase 3: Authentication](./phases/phase-3-authentication.md)**
  NextAuth setup, registration API, and server-side authentication helpers.

- **[Phase 4: API Routes](./phases/phase-4-api-routes.md)**
  Backend endpoints for recipe search, favorites, meal plans, and shopping lists.

- **[Phase 5: Custom Hooks](./phases/phase-5-hooks.md)**
  React hooks for search debouncing, recipe lookup, and favorites toggling.

- **[Phase 6: UI Components](./phases/phase-6-ui-components.md)**
  Core building blocks: Root Layout, Navbar, RecipeCard, Filters, Pagination.

- **[Phase 7: Pages](./phases/phase-7-pages.md)**
  Application views: Home, Search, Recipe Details, Meal Planner, Shopping Lists, and Auth.

- **[Phase 8: Configuration & Architecture](./phases/phase-8-config-architecture.md)**
  Next.js image domain settings, architecture summary, and key technical patterns.