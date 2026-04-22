# Backend API Routes Reference

**Date:** 2026-02-23
**Base URL:** `http://localhost:3001/api`

---

## 🔍 All Available Routes

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `POST/refresh-token` - Refresh authentication token

### Users (`/api/users`)
- `GET /` - Get all users
- `GET /:userId` - Get user by ID
- `POST /` - Create user
- `PUT /:userId` - Update user
- `DELETE /:userId` - Delete user

### Camps (`/api/camps`)
- `GET /` - Get all camps
- `GET /:campId` - Get camp by ID
- `POST /` - Create camp
- `PUT /:campId` - Update camp
- `DELETE /:campId` - Delete camp

### Families (`/api/families`)
- `GET /` - Get all families (with optional campId filter)
- `GET /:familyId` - Get family by ID ✅
- `POST /` - Create new family
- `PUT /:familyId` - Update family
- `PUT /:familyId/approve` - Approve family
- `PUT /:familyId/reject` - Reject family
- `DELETE /:familyId` - Delete family

### Individuals (`/api/individuals`)
- `GET /` - Get all individuals (with optional familyId filter) ✅
- `GET /:individualId` - Get individual by ID
- `POST /` - Create individual
- `PUT /:individualId` - Update individual
- `DELETE /:individualId` - Delete individual

### Inventory (`/api/inventory`)
- `GET /items` - Get all inventory items
- `GET /items/:itemId` - Get item by ID
- `POST /items` - Create inventory item
- `PUT /items/:itemId` - Update inventory item
- `DELETE /items/:itemId` - Delete inventory item
- `GET /transfers` - Get transfer requests
- `POST /transfers` - Create transfer request
- `PUT /transfers/:transferId` - Update transfer request

### Aid (`/api/aid`)
- `GET /types` - Get all aid types
- `POST /types` - Create aid type
- `PUT /types/:id` - Update aid type
- `DELETE /types/:id` - Delete aid type
- `GET /distributions` - Get all aid distributions
- `GET /distributions/family/:familyId` - Get distributions by family ✅
- `GET /distributions/campaign/:campaignId` - Get distributions by campaign
- `POST /distributions` - Create distribution
- `GET /campaigns` - Get all aid campaigns
- `GET /campaigns/:campaignId` - Get campaign by ID
- `POST /campaigns` - Create campaign
- `PUT /campaigns/:campaignId` - Update campaign
- `DELETE /campaigns/:campaignId` - Delete campaign

### Reports (`/api/reports`)
- Various report endpoints

### Permissions (`/api/permissions`)
- Permission management endpoints

### Backup/Sync (`/api/backup-sync`)
- `GET /` - Get backups

### Security (`/api/security`)
- Security audit logs

### Soft Deletes (`/api/soft-deletes`)
- Soft delete management

### Config (`/api/config`)
- Configuration management

### Public (`/api/public`)
- `GET /families/lookup` - Lookup family by national ID (no auth required)

---

## ✅ Correct Endpoint Usage

### For DP Details Page:

```typescript
// ✅ Get single family by ID
const family = await makeAuthenticatedRequest(`/families/${familyId}`);

// ✅ Get family members (individuals)
const members = await makeAuthenticatedRequest(`/individuals?familyId=${familyId}`);

// ✅ Get aid distributions for family
const distributions = await makeAuthenticatedRequest(`/aid/distributions/family/${familyId}`);

// ❌ WRONG - This endpoint doesn't exist!
// const distributions = await makeAuthenticatedRequest(`/aid-distributions?familyId=${familyId}`);
```

---

## 🐛 Fixed Issues

### Issue: "العائلة غير موجودة" Error

**Cause:** The `getDPById` method was calling a non-existent endpoint `/aid-distributions?familyId=${id}`

**Solution:** Changed to correct endpoint `/aid/distributions/family/${id}`

**Files Modified:**
- `services/realDataServiceBackend.ts` - Fixed endpoint and added error handling
- `views/camp-manager/DPDetails.tsx` - Added fallback method and better logging

---

## 🔧 Debug Tips

1. **Check browser console** for API call logs
2. **Check backend logs** for route matching
3. **Verify authentication token** is valid
4. **Check user permissions** for the route

### Example Console Logs:
```
[DPDetails] Loading DP: fam_123
[getDPById] Fetching DP: fam_123
[getDPById] Backend API URL: http://localhost:3001/api
[getDPById] Family record received: Ahmed Hassan
[getDPById] Individual records count: 5
[getDPById] Aid distributions count: 3
[getDPById] DP loaded successfully: Ahmed Hassan
```

---

## 📝 Notes

- All routes require authentication token in `Authorization: Bearer <token>` header
- Some routes have role-based access control (SYSTEM_ADMIN, CAMP_MANAGER, FIELD_OFFICER)
- CAMP_MANAGER can only access resources in their assigned camp
- FIELD_OFFICER has limited access (only approved families)

---

**Last Updated:** 2026-02-23
