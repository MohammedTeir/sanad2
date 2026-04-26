# Deployment Preparation Plan

This plan outlines the steps required to prepare the SND Camp Management System for deployment on Vercel (Frontend) and Render (Backend).

## 1. Code Fixes (Frontend)
The frontend has several hardcoded `localhost` references in service files that will bypass environment variables and fail in production.

- **Objective:** Convert all hardcoded `http://localhost:3001/api` URLs to relative paths.
- **Affected Files:**
    - `services/auth.ts`: Update `register`, `getCurrentUserProfile`, `hasPermission`, `updateUser` etc.
    - `services/realDataService.ts`: Update `login` fetch.
    - `services/realDataServiceJWT.ts`: Update `login` fetch.
    - `services/realDataServiceBackend.ts`: Update `BACKEND_API_URL` fallback and fetch calls.
    - `services/auditService.ts`: Update `apiUrl` fallback.
    - `views/admin/GlobalBackupCenter.tsx`: Update `apiUrl` fallback.

## 2. Infrastructure Configuration

### Backend (Render)
Configure the following environment variables in the Render dashboard:
- `NODE_ENV`: `production`
- `PORT`: (Render sets this automatically, but ensure `server.js` uses it)
- `FRONTEND_URL`: The URL where the frontend is deployed (e.g., `https://sanad-app.vercel.app`)
- `SUPABASE_URL`: Your production Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your production Supabase service role key
- `JWT_SECRET`: A secure, random string for JWT signing
- `JWT_EXPIRES_IN`: `24h`

### Frontend (Vercel)
Configure the following environment variables in the Vercel dashboard:
- `VITE_BACKEND_API_URL`: The URL of your Render backend + `/api` (e.g., `https://sanad-api.onrender.com/api`)
- `VITE_SUPABASE_URL`: Your production Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Your production Supabase anon key
- `GEMINI_API_KEY`: Your Google Gemini API key (if using AI features)

## 3. Vercel SPA Configuration
Create a `vercel.json` file in the root directory to handle client-side routing.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 4. Database Migration
Ensure the production Supabase database is up to date:
1. Run `backend/database/database_schema_unified_with_if_not_exists.sql` in the Supabase SQL Editor.
2. Run all migration scripts in `backend/database/migrations/` in sequential order.
3. Run `backend/scripts/runInitPermissions.js` (or equivalent SQL) to initialize roles and permissions.

## 5. Verification Steps
1. **Frontend Build:** Run `npm run build` locally to ensure no build errors.
2. **Backend Start:** Run `npm start` in the `backend` folder locally with production-like env vars.
3. **CORS Check:** Verify that the frontend can communicate with the backend without CORS errors once deployed.
4. **Auth Flow:** Test login, profile loading, and permission-based access.

