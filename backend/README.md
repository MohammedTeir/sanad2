# SND Backend API

This is the backend API for the SND (سند) camp management system. It provides a secure, JWT-based API layer between the frontend and the Supabase database.

## Features

- JWT-based authentication and authorization
- Role-based access control (SYSTEM_ADMIN, CAMP_MANAGER, FIELD_OFFICER, BENEFICIARY, DONOR_OBSERVER)
- Secure API endpoints for all system entities
- Input validation and sanitization
- Rate limiting and security headers
- Comprehensive error handling

## Prerequisites

- Node.js 16+
- npm or yarn
- Access to Supabase project (URL and Service Role Key)

## Installation

1. Clone the repository
2. Navigate to the backend directory: `cd backend`
3. Install dependencies: `npm install`
4. Create a `.env` file with your configuration (see below)
5. Start the server: `npm run dev`

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_signing_key_change_this_in_production
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run migrate` - Run database migrations (not implemented yet)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Verify JWT token
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:userId` - Get user by ID (admin only)
- `PATCH /api/users/profile` - Update current user profile
- `PUT /api/users/:userId` - Update user (admin only)

### Camps
- `GET /api/camps` - Get all camps
- `GET /api/camps/:campId` - Get camp by ID
- `POST /api/camps` - Create new camp (admin only)
- `PUT /api/camps/:campId` - Update camp
- `DELETE /api/camps/:campId` - Delete camp (admin only)

### Families
- `GET /api/families` - Get all families
- `GET /api/families/:familyId` - Get family by ID
- `POST /api/families` - Create new family
- `PUT /api/families/:familyId` - Update family
- `DELETE /api/families/:familyId` - Delete family (admin only)

### Individuals
- `GET /api/individuals` - Get all individuals
- `GET /api/individuals/:individualId` - Get individual by ID
- `POST /api/individuals` - Create new individual
- `PUT /api/individuals/:individualId` - Update individual
- `DELETE /api/individuals/:individualId` - Delete individual

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:itemId` - Get inventory item by ID
- `POST /api/inventory` - Create new inventory item
- `PUT /api/inventory/:itemId` - Update inventory item
- `DELETE /api/inventory/:itemId` - Delete inventory item

### Aid Management
- `GET /api/aid/types` - Get all aid types
- `GET /api/aid/distributions` - Get all aid distributions
- `GET /api/aid/distributions/family/:familyId` - Get aid distributions by family
- `GET /api/aid/distributions/campaign/:campaignId` - Get aid distributions by campaign
- `POST /api/aid/distributions` - Create new aid distribution
- `GET /api/aid/campaigns` - Get all aid campaigns
- `GET /api/aid/campaigns/:campaignId` - Get aid campaign by ID
- `POST /api/aid/campaigns` - Create new aid campaign
- `PUT /api/aid/campaigns/:campaignId` - Update aid campaign

### Reports
- `GET /api/reports/vulnerability` - Get vulnerability reports
- `GET /api/reports/aid-distribution` - Get aid distribution reports
- `GET /api/reports/camp-occupancy` - Get camp occupancy reports
- `GET /api/reports/health-status` - Get health status reports
- `GET /api/reports/inventory` - Get inventory reports

## Security Features

- JWT token-based authentication
- Role-based authorization
- Rate limiting to prevent abuse
- Helmet.js for security headers
- CORS configured for frontend domain
- Input validation and sanitization

## Architecture

The backend follows a layered architecture:

- **Routes**: Handle HTTP requests and responses
- **Middleware**: Handle authentication, authorization, and validation
- **Services**: Business logic (not fully implemented yet)
- **Database**: Supabase integration layer
- **Utilities**: Helper functions and constants

## Error Handling

The API uses consistent error responses:

```json
{
  "error": {
    "message": "Error message",
    "stack": "Stack trace (only in development)"
  }
}
```

## Development

For development, use `npm run dev` to start the server with hot reloading. The server will restart automatically when you make changes to the code.

## Production Deployment

For production deployment, ensure you have:

1. A strong JWT_SECRET in your environment variables
2. NODE_ENV set to 'production'
3. Proper SSL certificates for HTTPS
4. A reverse proxy (nginx) in front of the Node.js server
5. Proper logging and monitoring solutions