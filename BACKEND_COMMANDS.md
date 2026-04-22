# Backend Commands

The backend code has been moved to the `backend/` folder. All backend-related commands should be run from there.

## Quick Reference

### Frontend Commands (from root)

```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Commands (from backend/ folder)

```bash
# Navigate to backend folder
cd backend

# Install backend dependencies
npm install

# Start backend server
npm start          # Production
npm run dev        # Development (with nodemon)

# Database setup
npm run setup:db       # Instructions for database schema
npm run setup:storage  # Instructions for storage buckets

# Admin user management
npm run seed:admin     # Create admin user
npm run verify:admin   # Verify admin user exists

# Permissions
npm run init:permissions   # Initialize default permissions
npm run delete:permissions # Delete all permissions (caution!)

# Testing
npm run test:family  # Run family registration integration test
```

## Database Setup

### 1. Run Database Schema

1. Go to: https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Copy contents of: `backend/database/database_schema_unified_with_if_not_exists.sql`
5. Paste and click "Run"

### 2. Setup Storage Buckets

1. Go to: https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Copy contents of: `backend/database/supabase-storage-setup.sql`
5. Paste and click "Run"

### 3. Create Admin User

```bash
cd backend
npm run seed:admin
```

### 4. Initialize Permissions

```bash
cd backend
npm run init:permissions
```

## File Locations

### Backend Files
```
backend/
├── server.js                       # Main server file
├── routes/                         # API routes
├── middleware/                     # Middleware
├── functions/                      # Business logic
├── database/                       # SQL files
│   ├── database_schema_unified.sql
│   └── supabase-storage-setup.sql
├── scripts/                        # Setup scripts
│   ├── runInitPermissions.js
│   └── deletePermissions.js
├── seed-admin.js                   # Admin seeding script
└── verify-admin.js                 # Admin verification script
```

### Frontend Files
```
(root)/
├── App.tsx                         # Main React component
├── index.tsx                       # React entry point
├── components/                     # React components
├── views/                          # Page components
├── services/                       # Frontend services
└── utils/                          # Frontend utilities
```

## Environment Variables

### Frontend (.env in root)
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
BACKEND_API_URL=http://localhost:3001/api
```

### Backend (backend/.env)
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
PORT=3001
FRONTEND_URL=http://localhost:5173
BACKEND_API_URL=http://localhost:3001/api
```

## Documentation

- **Backend Structure:** `backend/STRUCTURE.md`
- **Family Registration:** `backend/FAMILY_REGISTRATION_BACKEND_GUIDE.md`
- **Database Seeding:** `backend/SEEDING_INSTRUCTIONS.md`
- **Storage Setup:** `backend/STORAGE_SETUP_GUIDE.md`

## Troubleshooting

### Backend Won't Start

1. Navigate to backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Check `.env` file exists with correct values
4. Verify port 3001 is not in use

### Database Errors

1. Run database schema in Supabase SQL Editor
2. Run storage setup in Supabase SQL Editor
3. Seed admin user: `npm run seed:admin`
4. Initialize permissions: `npm run init:permissions`

### File Upload Fails

1. Run storage setup script in Supabase SQL Editor
2. Verify buckets exist: `id-cards`, `medical-reports`, `signatures`
3. Check storage policies are created

## Full Setup Flow

```bash
# 1. Frontend setup (from root)
npm install

# 2. Backend setup (from backend/)
cd backend
npm install

# 3. Database setup
# Run database/schema SQL in Supabase
# Run database/supabase-storage-setup.sql in Supabase

# 4. Create admin user
npm run seed:admin

# 5. Initialize permissions
npm run init:permissions

# 6. Start backend
npm run dev

# 7. Start frontend (from root, in new terminal)
cd ..
npm run dev
```

Both servers should now be running:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

**Last Updated:** 2026-02-18
