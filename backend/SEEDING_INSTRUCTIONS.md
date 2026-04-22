# Setting Up Database and Seeding System Admin User

To set up the database and seed a system admin user, follow these steps:

## 1. Environment Variables Setup

Make sure your Supabase environment variables are set in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

💡 You can find your Service Role Key in your Supabase dashboard: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/settings/api`

## 2. Database Setup

Before seeding the admin user, you need to create the database tables:

### Option A: Using the setup script
```bash
npm run setup:db
```

### Option B: Manual setup (Recommended)
1. Go to your Supabase dashboard: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]`
2. Navigate to "SQL Editor" in the left sidebar
3. Copy the entire content of `database_schema.sql` file
4. Paste it in the SQL editor and click "Run"
5. Wait for all tables to be created successfully

## 3. Seed the System Admin User

After the database tables are created, run the following command to seed the system admin:

```bash
npm run seed:admin
```

Or if you want to use the TypeScript version:
```bash
npx tsx seed-admin.ts
```

After running the script, you'll see the credentials for the system admin user:
- Email: admin@snd.local
- Password: [You'll need to set this up in Supabase Auth]

Note: The script will only create the admin user if one doesn't already exist.