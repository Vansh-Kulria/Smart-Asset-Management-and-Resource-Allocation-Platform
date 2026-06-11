# AssetFlow: Smart Asset Management & Resource Allocation Platform

AssetFlow is a production-ready, full-stack Next.js application built for the **Cultural Council of IIT Roorkee**. It provides a centralized console for managing, allocating, tracking, and maintaining council assets (cameras, lighting rigs, audio gear, props, costumes, and event infrastructure) with a premium responsive dark theme, QR code scanning, dynamic notifications, and detailed system audit logging.

---

## 📂 Project Structure

This repository is designed to be fully self-contained, reproducible, and easily readable. It contains:

*   **Source Code (`src/`)**: 
    *   `src/app/`: Next.js 15 App Router views, templates, actions, and API routes.
    *   `src/components/`: Reusable components (e.g., Header, Sidebar, ProfileForm).
    *   `src/lib/`: Unified database connectors (`db.ts`) and next-auth configuration (`auth.ts`).
    *   `src/proxy.ts`: Middleware routing and domain onboarding validation.
*   **Configuration Files**:
    *   `package.json`: Dependency manifests, build scripts, and lifecycle hook generators.
    *   `tsconfig.json` & `next.config.ts`: TypeScript and Next.js compiler parameters.
    *   `postcss.config.mjs` & `eslint.config.mjs`: Build pipeline styling and style checkers.
    *   `.env.example`: Environment variables template mapping out all database, NextAuth, OAuth, and Cloudinary keys.
*   **Database Scripts & Containers**:
    *   `prisma/schema.prisma`: The database schema representing users, assets, bookings, returns, maintenance logs, notifications, and system logs.
    *   `prisma/seed.js`: Pre-configured database initializer script loading mock users, inventory, bookings, return records, and audits.
    *   `docker-compose.yml`: Instantiates a local PostgreSQL container for testing and offline development.
*   **Documentation**:
    *   `README.md`: This step-by-step setup and architecture guide.

---

## ⚡ Main System Features

1.  **Unified Authentication**: Supports Credentials registration/login alongside GitHub and Google OAuth integration.
2.  **Auto Onboarding Redirect**: Detects first-time OAuth logins and redirects them to fill out profiles before accessing dashboards.
3.  **Visual Audit Dashboard**: High-fidelity system log details containing:
    *   KPI activity summary widgets (Total Logs, Assets, Bookings, Users).
    *   Full-text search queries (matches usernames, emails, assets) and select menus.
    *   Detailed visual formatting (asset diff comparisons, return conditions, rejections).
    *   Collapsible payload inspector with copy-to-clipboard.
    *   One-click downloads for **CSV** and **JSON** exports.
    *   Client-side pagination.
4.  **QR Code Scan Workflows**: Dynamic QR code generation for new assets and instant scan-to-issue/scan-to-return camera features (preloaded dynamically inside handlers to prevent server-side crashes).
5.  **Inventory Management & Live Statistics**: Dashboard charts representing current stock, outstanding items, maintenance pipelines, and section requests.
6.  **Secure Admin Demote Prevention**: Blocks admins from self-demoting to bypass lockouts.
7.  **Theme Aesthetics**: Deep slate-dark colors, micro-animations, neon borders, and custom scrollbars.

---

## 🛠️ Onboarding & Replication Guide

Follow these sequential steps to run the application on your local machine:

### 1. Prerequisites
Ensure you have the following installed on your system:
*   [Node.js (v18.x or higher)](https://nodejs.org/)
*   [Git](https://git-scm.com/)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local database, or use any PostgreSQL instance)

---

### 2. Configure Environment Variables
1.  Copy the example environment template to create your `.env` file:
    ```bash
    cp .env.example .env
    ```
2.  Open the newly created `.env` file and replace placeholders with your custom parameters.
    *   *NextAuth Secret*: You can generate a random 32-character string using:
        ```bash
        npx nextauth secret
        # or
        openssl rand -base64 32
        ```
    *   *OAuth IDs & Cloudinary Secrets*: Add your developer console keys to enable live OAuth flow and image uploads.

---

### 3. Provision the Database
If you do not have an active PostgreSQL database, launch the pre-packaged Postgres docker container:
```bash
docker-compose up -d
```
This boots an isolated PostgreSQL container bound to port `5432` containing a `smart_assets` database.

---

### 4. Database Schema Sync
Generate the Prisma Client and sync the database structure:
```bash
npx prisma generate
npx prisma db push
```

---

### 5. Seed Mock Data
Run the database seed script to populate sample accounts, assets, active/returned requests, and audit logs:
```bash
npx prisma db seed
```
**Default Seed Credentials:**
*   **Admin User**:
    *   **Email**: `admin@cultural.iitr.ac.in`
    *   **Password**: `AdminPassword123`
*   **Consumer User**:
    *   **Email**: `rohan@cultural.iitr.ac.in`
    *   **Password**: `MemberPassword123`

---

### 6. Run the Application
Start the local Next.js development server:
```bash
npm run dev
```
Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 🚀 Deployment (Vercel)

1.  Connect your GitHub repository to your Vercel project console.
2.  Add the environment variables listed in your `.env` file inside **Vercel Project Settings > Environment Variables**.
3.  Ensure the Next.js build command is standard (`npm run build`). The Prisma client generation is automated during the build via the `postinstall` script hook configured inside `package.json`.
