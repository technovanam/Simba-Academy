# Simba Preschool

A modern web application and management portal for Simba Preschool. It features separate portals for **Students** (storybooks, resources, notifications), **Teachers** (dashboard, tasks, lesson plans), and **Administrators** (user management, content approval, Google reviews, payments).

## 🚀 Repository Architecture

This codebase is structured as a full-stack monorepo:

- **[`backend/`](file:///c:/Users/Sasi/Documents/Simba-Academy/backend)**: Express API built with TypeScript, Prisma ORM, and MariaDB/MySQL.
- **[`frontend/`](file:///c:/Users/Sasi/Documents/Simba-Academy/frontend)**: Client-side web application built with React Router v7, Vite, and TailwindCSS.
- **[`scripts/`](file:///c:/Users/Sasi/Documents/Simba-Academy/scripts)**: Root-level administration and helper utilities.

---

## 🛠️ Technology Stack

| Component        | Technologies                                                                  |
| :--------------- | :---------------------------------------------------------------------------- |
| **Backend**      | Node.js (>=20), Express, TypeScript, Prisma ORM, MariaDB / MySQL              |
| **Frontend**     | React, React Router v7, Vite, TailwindCSS                                     |
| **Integrations** | Zoho Payments, Resend Email API, Google Business Profile API, Sentry, PostHog |

---

## 💻 Local Setup & Development

### 1. Prerequisites

Ensure you have the following installed locally:

- Node.js (version 20 or higher)
- MySQL or MariaDB server

### 2. Install Dependencies

Install dependencies at the root and for each sub-project:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Environment Variables

Copy and rename the environment templates to `.env` in both folders and fill in the configuration details:

- **Backend**:
  ```bash
  cp backend/.env.example backend/.env
  ```
- **Frontend**:
  ```bash
  cp frontend/.env.example frontend/.env
  ```

### 4. Database Setup

Initialize your database schema and seed the default administrator account:

```bash
cd backend
# Generate the Prisma client
npm run db:generate

# Push the schema to your local database instance
npm run db:push

# Seed the default admin (admin@simbaacademy.in)
npm run db:seed
```

### 5. Running the Application

To run the development servers concurrently:

```bash
# From the repository root
npm run dev
```

This runs the backend server on `http://localhost:3001` and the frontend server on `http://localhost:5173`.

---

## 📦 Production Deployment

### cPanel Node.js Application Startup (Recommended)

1. Run `npm run deploy:pack` inside the `backend` folder. This will build the TypeScript files and stage a deployable zip file (`simba-api.zip`) in the root directory.
2. Extract the zip file in your server folder via File Manager.
3. Use the Setup Node.js App configuration in cPanel, selecting `app.js` as the application startup file.
4. Run NPM Install and execute `scripts/cpanel-setup.mjs` to complete the database configuration and default seeding.

For a full deploy guide, refer to [`backend/deploy/simba-api/DEPLOY-CPANEL.md`](file:///c:/Users/Sasi/Documents/Simba-Academy/backend/deploy/simba-api/DEPLOY-CPANEL.md).
