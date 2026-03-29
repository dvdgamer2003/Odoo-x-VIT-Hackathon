# Project Setup & Quickstart

This document contains the commands required to start both the frontend and backend of the project locally.

## Prerequisite
Make sure you have installed all necessary dependencies in both directories by running `npm install` inside both `/frontend` and `/backend`.

---

## 1. Start the Backend

The backend is a Node.js API. To start it in development mode:

1. Open a new terminal.
2. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

*The backend server will typically run on `http://localhost:3001`.*

---

## 2. Start the Frontend

The frontend is a Next.js application. To start it in development mode:

1. Open a second, separate terminal.
2. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

*The frontend application will be instantly available at `http://localhost:3000`. You can test your connection by visiting it in your browser.*

---

## 3. Test Accounts

The database comes pre-seeded with the following test accounts. You can use these to test different roles and approval workflows:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin / Finance Director** | `admin@acme.com` | `password123` |
| **Manager** | `manager@acme.com` | `password123` |
| **Employee** | `johnny@acme.com` | `password123` |
