# Backend Folder Structure

## 📁 Directory Organization

```
backend/
├── server.js                          # Main Express server entry point
├── package.json                       # Backend dependencies
├── .env                              # Backend environment variables
│
├── api/                              # API endpoints and controllers
│   └── batchSyncEndpoint.js          # Batch sync API for offline data
│
├── db/                               # Database configuration
│   └── connection.js                 # Supabase database connection
│
├── functions/                        # Backend utility functions
│   ├── calculateVulnerabilityScore.js  # Vulnerability scoring logic
│   └── geminiService.js              # Gemini AI service integration
│
├── middleware/                       # Express middleware
│   ├── auth.js                       # Authentication middleware
│   ├── maintenance.js                # Maintenance mode middleware
│   └── validation.js                 # Request validation middleware
│
├── migrations/                       # Database migrations
│   └── *.sql                         # SQL migration files
│
├── routes/                           # API route handlers
│   ├── public.js                     # Public endpoints (no auth required)
│   ├── auth.js                       # Authentication routes
│   ├── users.js                      # User management routes
│   ├── camps.js                      # Camp management routes
│   ├── families.js                   # Family registration routes
│   ├── individuals.js                # Individual records routes
│   ├── inventory.js                  # Inventory management routes
│   ├── aid.js                        # Aid distribution routes
│   ├── reports.js                    # Report generation routes
│   ├── permissions.js                # Permission management routes
│   ├── backupSync.js                 # Backup & sync routes
│   ├── security.js                   # Security audit routes
│   ├── softDeletes.js                # Soft delete handling routes
│   └── config.js                     # Configuration routes
│
├── utils/                            # Utility functions
│   └── logger.js                     # Logging utility
│
├── scripts/                          # Database setup scripts
│   ├── runInitPermissions.js         # Initialize default permissions
│   └── deletePermissions.js          # Delete all permissions
│
├── database/                         # Database schema files
│   ├── database_schema_unified.sql   # Complete database schema
│   ├── database_schema_unified_with_if_not_exists.sql  # Schema with IF NOT EXISTS
│   ├── disable-rls-all-tables.sql    # Disable RLS script
│   └── supabase-storage-setup.sql    # Storage buckets setup
│
├── docs/                             # Backend documentation
│   ├── FAMILY_REGISTRATION_BACKEND_GUIDE.md  # Family registration guide
│   ├── SEEDING_INSTRUCTIONS.md       # Database seeding instructions
│   └── STORAGE_SETUP_GUIDE.md        # Storage setup guide
│
└── test-family-registration.js       # Integration test script
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `.env` file in the backend folder:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Gemini API (for vulnerability scoring)
GEMINI_API_KEY=your-gemini-api-key

# Backend API URL
BACKEND_API_URL=http://localhost:3001/api
```

### 3. Setup Database

Run the database schema in Supabase SQL Editor:

```bash
# Option 1: Use the unified schema
# Copy contents of database/database_schema_unified_with_if_not_exists.sql
# Paste into Supabase SQL Editor and run

# Option 2: Use individual migration files
# Copy contents of migrations/*.sql files in order
```

Setup storage buckets:

```bash
# Copy contents of database/supabase-storage-setup.sql
# Paste into Supabase SQL Editor and run
```

### 4. Seed Admin User

```bash
node seed-admin.js
```

### 5. Initialize Permissions

```bash
node scripts/runInitPermissions.js
```

### 6. Start Server

```bash
npm start
# or for development:
npm run dev
```

Server will start on `http://localhost:3001`

## 📝 API Endpoints

### Public Endpoints (No Authentication)

- `POST /api/public/families` - Register a new family
- `POST /api/public/individuals` - Register an individual
- `GET /api/public/camps` - Get active camps

### Authentication Required

- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Protected Endpoints

- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

- `GET /api/camps` - Get all camps
- `POST /api/camps` - Create camp
- `PUT /api/camps/:id` - Update camp
- `DELETE /api/camps/:id` - Delete camp

- `GET /api/families` - Get all families
- `GET /api/families/:id` - Get family by ID
- `PUT /api/families/:id` - Update family
- `DELETE /api/families/:id` - Delete family

- `GET /api/individuals` - Get all individuals
- `POST /api/individuals` - Create individual
- `PUT /api/individuals/:id` - Update individual
- `DELETE /api/individuals/:id` - Delete individual

- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

- `GET /api/aid` - Get aid distributions
- `POST /api/aid` - Create aid distribution
- `PUT /api/aid/:id` - Update aid distribution
- `DELETE /api/aid/:id` - Delete aid distribution

- `GET /api/reports/vulnerability` - Get vulnerability report
- `GET /api/reports/statistics` - Get statistics report

- `GET /api/permissions` - Get permissions
- `POST /api/permissions` - Create permission
- `DELETE /api/permissions/:id` - Delete permission

- `POST /api/backup-sync` - Create backup
- `GET /api/backup-sync` - Get backup operations
- `POST /api/backup-sync/restore/:id` - Restore from backup

- `GET /api/security/audit-logs` - Get audit logs
- `POST /api/security/flag` - Flag security issue

## 🧪 Testing

### Run Integration Tests

```bash
node test-family-registration.js
```

This tests:
- Family registration endpoint
- Database insertion
- Individual creation
- File upload URLs

## 🗄️ Database Scripts

### Seed Admin User

```bash
node seed-admin.js
```

Creates a system admin user with:
- Email: `admin@sand.ps`
- Password: (set in script or environment)
- Role: `SYSTEM_ADMIN`

### Verify Admin User

```bash
node verify-admin.js
```

Verifies the admin user exists in the database.

### Initialize Permissions

```bash
node scripts/runInitPermissions.js
```

Creates default permissions for:
- `SYSTEM_ADMIN` - Full access
- `CAMP_MANAGER` - Camp-specific access
- `FIELD_OFFICER` - Limited access

### Delete Permissions

```bash
node scripts/deletePermissions.js
```

Removes all permissions (use with caution).

## 📦 File Upload

Files are uploaded directly to Supabase Storage:

### Buckets

- `id-cards` - ID card images (max 5MB)
- `medical-reports` - Medical documents (max 5MB)
- `signatures` - Signature images (max 2MB)

### Storage Structure

```
Bucket: id-cards
└── registrations/
    ├── timestamp-random.jpg
    └── timestamp-random.pdf
```

### Setup

Run the storage setup script in Supabase SQL Editor:

```sql
-- From database/supabase-storage-setup.sql
```

## 🔒 Security

### Authentication

- JWT-based authentication
- Tokens expire after 1 hour
- Refresh tokens supported

### Authorization

- Role-based access control (RBAC)
- Permissions stored in database
- Row Level Security (RLS) in Supabase

### Rate Limiting

- 100 requests per 15 minutes per IP
- Configurable in `server.js`

### CORS

- Configured in `server.js`
- Only allows requests from `FRONTEND_URL`

## 🐛 Troubleshooting

### Server Won't Start

1. Check `.env` file exists
2. Verify all environment variables are set
3. Check port 3001 is not in use
4. Run: `npm install`

### Database Errors

1. Verify Supabase credentials
2. Run database schema in SQL Editor
3. Check RLS policies are enabled
4. Verify tables exist

### File Upload Fails

1. Check storage buckets exist
2. Verify storage policies are set
3. Check file size limits
4. Verify MIME types are allowed

### Permission Errors

1. Run: `node scripts/runInitPermissions.js`
2. Verify user has correct role
3. Check permissions table in database

## 📚 Documentation

- `FAMILY_REGISTRATION_BACKEND_GUIDE.md` - Family registration flow
- `SEEDING_INSTRUCTIONS.md` - Database seeding guide
- `STORAGE_SETUP_GUIDE.md` - Storage setup instructions

## 🔄 Deployment

### Production Environment

1. Set `NODE_ENV=production`
2. Use production Supabase credentials
3. Set secure `FRONTEND_URL`
4. Enable HTTPS
5. Configure reverse proxy (nginx)

### Environment Variables

```env
# Production
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

## 📞 Support

For issues:
1. Check logs in `backend/functions/logger.js`
2. Review Supabase logs: https://app.supabase.com/project/_/logs
3. Check database errors in Supabase dashboard

---

**Last Updated:** 2026-02-18
**Version:** 1.0
