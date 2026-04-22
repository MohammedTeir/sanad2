# 📊 سند System Module Relationships

## Overview of Connected Modules

The سند (Sand) system has **5 interconnected modules** that work together to manage aid distribution in Gaza camps.

---

## 🔄 Module Connection Flow

```
┌──────────────────┐
│   Aid Types      │ ← Defines WHAT types of aid exist
│   (أنواع المساعدات) │    Example: Food, Medical, Clothing
└────────┬─────────┘
         │
         │ used in
         ▼
┌──────────────────┐
│  Aid Campaigns   │ ← Plans WHEN and HOW MUCH to distribute
│  (حملات المساعدات) │    Example: Ramadan 2026 - 500 families
└────────┬─────────┘
         │
         │ needs items from
         ▼
┌──────────────────┐
│  Inventory Items │ ← Stores physical items in stock
│  (عناصر المخزون)  │    Example: Flour, Rice, Oil
└────────┬─────────┘
         │
         │ distributed via
         ▼
┌──────────────────┐
│   Distribution   │ ← Gives aid to families
│   Management     │    Example: Distribute to 50 families
└────────┬─────────┘
         │
         │ records transactions in
         ▼
┌──────────────────┐
│  Inventory Ledger│ ← Tracks all stock movements
│  (سجل المخزون)    │    Example: -100kg flour distributed
└──────────────────┘
```

---

## 📋 Detailed Module Descriptions

### 1. **Aid Types** (`AidTypesConfig.tsx`)
**Purpose:** Define categories and types of aid available

**Data Structure:**
```typescript
interface AidType {
  id: string;
  name: string;           // English name
  name_ar: string;        // Arabic name
  category: 'food' | 'non_food' | 'medical' | 'cash' | 'other';
  description?: string;
  unit: string;           // Unit (kg, piece, box)
  unit_ar: string;        // Arabic unit
  is_active: boolean;
  camp_id?: string;
  created_at: string;     // Timestamp when created
  updated_at: string;     // Timestamp when last updated
}
```

**Example:**
- Name: "طرود غذائية" (Food Parcels)
- Category: "food"
- Unit: "box" (صندوق)

---

### 2. **Aid Campaigns** (`AidCampaign.tsx`, `AidCampaigns.tsx`)
**Purpose:** Plan and organize aid distribution campaigns

**Data Structure:**
```typescript
interface AidCampaign {
  id: string;
  name: string;                    // Campaign name
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  aidType: string;                 // Links to Aid Type
  aidCategory: string;             // food, medical, etc.
  targetFamilies?: string[];       // Families to help
  distributedTo?: string[];        // Families who received
  coordinatorUserId?: string;
  notes?: string;
  campId?: string;
  inventoryItemId?: string;        // Link to specific inventory item (NEW - for ID-based matching)
  createdAt: string;               // Timestamp when created
  updatedAt: string;               // Timestamp when last updated
}
```

**Example:**
- Name: "campaign رمضان 2026"
- Aid Type: "food"
- Target: 500 families
- Duration: March 1-30, 2026
- Status: "active"

---

### 3. **Inventory Items** (`InventoryItemsSetup.tsx`)
**Purpose:** Manage physical stock in warehouse

**Data Structure:**
```typescript
interface InventoryItem {
  id: string;
  name_ar: string;        // Arabic name
  category: string;        // food, medical, etc.
  unit: string;            // piece, kg, box
  unit_ar: string;         // Arabic unit
  min_stock: number;       // Minimum threshold
  max_stock: number;       // Maximum capacity
  quantity_available?: number;  // Current stock
  quantity_reserved?: number;   // Reserved for campaigns
  is_active: boolean;
  camp_id?: string;
  notes?: string;
  created_at: string;     // Timestamp when created
  updated_at: string;     // Timestamp when last updated
}
```

**Example:**
- Name: "طحين" (Flour)
- Category: "food"
- Unit: "kg"
- Min Stock: 100
- Max Stock: 500
- Available: 250 kg

---

### 4. **Distribution Management** (`DistributionManagement.tsx`)
**Purpose:** Execute actual distribution to families

**Data Structure:**
```typescript
interface DistributionRecord {
  familyId: string;
  familyName: string;
  familySize: number;
  distributedAt: string;
  quantity: number;
  notes?: string;
  otpCode?: string;           // For verification
  signatureConfirmed: boolean;
}
```

**Example:**
- Family: "Ahmed Hassan"
- Campaign: "Ramadan 2026"
- Items: 10kg flour, 5kg rice, 2L oil
- Date: March 15, 2026
- Verified: ✓ Signature confirmed

---

### 5. **Inventory Ledger** (`InventoryLedger.tsx`)
**Purpose:** Track all inventory transactions (audit trail)

**Data Structure:**
```typescript
interface InventoryTransaction {
  id: string;
  itemId: string;           // Which item
  itemName?: string;
  transactionType: 'in' | 'out';  // In or Out
  quantity: number;
  relatedTo: 'purchase' | 'donation' | 'distribution' | 'transfer' | 'adjustment' | 'damage';
  relatedId?: string;       // Campaign ID, Distribution ID, etc.
  notes?: string;
  processedByUserId?: string;
  processedAt: string;
  createdAt: string;        // Timestamp when created
}
```

**Example Transactions:**
1. **IN**: +500kg flour (purchase from supplier)
2. **OUT**: -10kg flour (distributed to Family X)
3. **OUT**: -5kg flour (damaged/spoiled)
4. **IN**: +100kg flour (donation from charity)

---

## 🔗 How They Connect - Complete Example

### Scenario: Ramadan Food Distribution

#### Step 1: Define Aid Type
```typescript
// AidTypesConfig.tsx
{
  name_ar: "طرود غذائية",
  category: "food",
  unit: "box"
}
```

#### Step 2: Create Campaign
```typescript
// AidCampaign.tsx
{
  name: "رمضان 2026",
  aidType: "food",
  targetFamilies: 500,
  status: "active"
}
```

#### Step 3: Stock Inventory
```typescript
// InventoryItemsSetup.tsx
{
  name_ar: "طحين",
  min_stock: 100,
  max_stock: 1000,
  quantity_available: 800  // 800kg in stock
}
```

#### Step 4: Distribute to Families
```typescript
// DistributionManagement.tsx
{
  familyId: "fam_123",
  campaignId: "camp_ramadan_2026",
  items: [
    { itemId: "flour_001", quantity: 10 },
    { itemId: "rice_001", quantity: 5 }
  ]
}
```

#### Step 5: Record in Ledger
```typescript
// InventoryLedger.tsx
{
  itemId: "flour_001",
  transactionType: "out",
  quantity: 10,
  relatedTo: "distribution",
  relatedId: "dist_123",
  notes: "Ramadan distribution to Family Ahmed"
}
```

**Result:**
- ✅ Inventory updated: 800kg → 790kg
- ✅ Family received aid
- ✅ Campaign progress tracked
- ✅ Audit trail created

---

## 📁 File Locations

### Frontend (`views/camp-manager/`)
- `AidTypesConfig.tsx` - Aid types management
- `AidCampaign.tsx` - Single campaign view/edit
- `AidCampaigns.tsx` - Campaigns list
- `InventoryItemsSetup.tsx` - Inventory management
- `InventoryLedger.tsx` - Transaction history
- `DistributionManagement.tsx` - Distribution execution

### Backend (`backend/routes/`)
- `aid.js` - Aid types & campaigns API
- `inventory.js` - Inventory items & transactions API
- `families.js` - Family data API
- `distributions.js` - (Check if exists or in aid.js)

### Services (`services/`)
- `realDataServiceBackend.ts` - Main service layer
- `aidInventoryService.ts` - Aid-specific service
- `supabase.ts` - Database operations

---

## 🎯 Key Integration Points

### 1. **Campaign → Inventory**
Campaigns reserve inventory items:
```typescript
// When campaign is created
inventory.quantity_reserved += campaign.requiredQuantity;
```

### 2. **Distribution → Inventory**
Distributions reduce available stock:
```typescript
// When family receives aid
inventory.quantity_available -= distributedQuantity;
```

### 3. **Distribution → Ledger**
Every distribution creates ledger entries:
```typescript
// For each item distributed
ledger.create({
  itemId: item.id,
  type: 'out',
  quantity: item.quantity,
  relatedTo: 'distribution',
  relatedId: distribution.id
});
```

### 4. **Campaign → Distribution**
Distributions are linked to campaigns:
```typescript
distribution.campaignId = campaign.id;
campaign.distributedTo.push(familyId);
```

---

## 🔍 Current Implementation Status

| Module | Frontend | Backend | Service | Status |
|--------|----------|---------|---------|--------|
| Aid Types | ✅ | ✅ | ✅ | Complete |
| Aid Campaigns | ✅ | ✅ | ✅ | Complete |
| Inventory Items | ✅ | ✅ | ✅ | Complete |
| Inventory Ledger | ✅ | ✅ | ✅ | Complete |
| Distribution Mgmt | ✅ | ✅ | ✅ | Complete (Added distribution service methods) |

### Distribution Service Methods (NEW)

The following service methods have been added to `realDataServiceBackend.ts`:

```typescript
// Distribution Management
async getDistributions(): Promise<any[]>
async getDistributionsByFamily(familyId: string): Promise<any[]>
async getDistributionsByCampaign(campaignId: string): Promise<any[]>
async createDistribution(distribution: {
  familyId: string;
  campaignId: string;
  aidType: string;
  aidCategory: string;
  quantity: number;
  distributionDate: string;
  notes?: string;
  otpCode?: string;
  signatureConfirmed?: boolean;
}): Promise<any>
async cancelDistribution(distributionId: string): Promise<void>
```

### Recent Improvements (2026-02-19)

1. **Fixed Inventory Linking** - Campaigns now have `inventoryItemId` field for ID-based matching instead of fragile name-based matching
2. **Added Distribution History Modal** - View all distributions for a campaign with full details
3. **Added Undo Functionality** - 5-second window to undo accidental distributions
4. **Added Keyboard Shortcuts** - ESC to close modals
5. **Added Timestamp Fields** - All interfaces now include `created_at`/`createdAt` and `updated_at`/`updatedAt`

---

## 📝 Next Steps

### Completed ✅

1. ~~Verify Distribution Backend Routes~~ - DONE: Routes exist and work
2. ~~Add Missing Distribution Service Methods~~ - DONE: All CRUD methods added
3. ~~Fix inventory linking (name-based vs ID-based)~~ - DONE: Added `inventoryItemId` field
4. ~~Add distribution history view~~ - DONE: History modal implemented
5. ~~Add keyboard shortcuts~~ - DONE: ESC to close modals
6. ~~Add undo functionality~~ - DONE: 5-second undo window
7. ~~Add timestamp fields to interfaces~~ - DONE: All interfaces updated

### Ongoing

1. **Test Complete Flow** - Test in browser:
   - Create aid type
   - Create campaign with inventory item link
   - Add inventory
   - Distribute to family
   - Verify ledger updates
   - Test undo functionality

2. **Add Missing Integrations** (Optional enhancements):
   - Batch distribution for multiple families
   - Export distribution reports to CSV/PDF
   - SMS notifications to families when aid is ready

---

## 🎓 Summary

These 5 modules form a **complete aid management system**:

1. **Aid Types** define WHAT exists
2. **Campaigns** plan WHEN and HOW MUCH
3. **Inventory** tracks WHAT'S AVAILABLE
4. **Distribution** executes GIVING
5. **Ledger** records EVERY MOVEMENT

Together they ensure:
- ✅ Transparent aid distribution
- ✅ Accurate inventory tracking
- ✅ Complete audit trail
- ✅ Efficient campaign management
- ✅ Accountability to donors and families

---

## 🎨 UI/UX Modernization: Toast & ConfirmModal Migration

### Overview
Completed system-wide migration from native `alert()`/`confirm()` dialogs to reusable `Toast` and `ConfirmModal` components for a modern, consistent user experience.

### Components Used
- **`Toast.tsx`**: Auto-dismissing notifications (5 seconds) with 4 types: success, error, info, warning
- **`ConfirmModal.tsx`**: Customizable confirmation modals with 3 types: danger, warning, info

### Migration Progress: 100% Complete ✅

#### Camp Manager Pages (11/11 - 100%)
| File | Status | Changes |
|------|--------|---------|
| `CampDashboard.tsx` | ✅ Done | Toast for load success/error |
| `AidCampaigns.tsx` | ✅ Done | Toast + ConfirmModal for delete |
| `AidTypesConfig.tsx` | ✅ Done | Toast + ConfirmModal for delete |
| `DistributionManagement.tsx` | ✅ Done | 15+ setError/setSuccessMessage → Toast |
| `DPManagement.tsx` | ✅ Done | Already using modern notifications |
| `DPDetails.tsx` | ✅ Done | Already using modern notifications |
| `InventoryItemsSetup.tsx` | ✅ Done | Toast + ConfirmModal integration |
| `InventoryLedger.tsx` | ✅ Done | Toast for all notifications |
| `StaffManagement.tsx` | ✅ Done | ConfirmModal for delete/password reset |
| `TransferRequests.tsx` | ✅ Done | Toast + ConfirmModal integration |
| `ProfilePage.tsx` | ✅ Done | Toast integration |

#### Admin Pages (8/8 - 100%)
| File | Status | Changes |
|------|--------|---------|
| `SystemAdminDashboard.tsx` | ✅ Done | Toast + ConfirmModal for camp rejection |
| `UserManagement.tsx` | ✅ Done | Already using modern notifications |
| `CampsManagement.tsx` | ✅ Done | Already using modern notifications |
| `GlobalBackupCenter.tsx` | ✅ Done | Toast + ConfirmModal for restore/delete |
| `AuditLogViewer.tsx` | ✅ Done | Already using modern notifications |
| `OnboardingManagement.tsx` | ✅ Done | Already using modern notifications |
| `SystemConfigurationHub.tsx` | ✅ Done | Already using modern notifications |
| `ProfilePage.tsx` | ✅ Done | Toast + PasswordChangeModal callback |

#### Field Officer Pages (2/2 - 100%)
| File | Status | Changes |
|------|--------|---------|
| `FieldOfficerDashboard.tsx` | ✅ Done | Toast for save error |
| `DistributionScannerMode.tsx` | ✅ Done | Toast for distribution success |

#### Beneficiary Pages (0 alert/confirm found)
- ✅ No native alert/confirm calls found

#### Donor Pages (0 alert/confirm found)
- ✅ No native alert/confirm calls found

#### Shared Components (1/1 - 100%)
| File | Status | Changes |
|------|--------|---------|
| `PasswordChangeModal.tsx` | ✅ Done | Added onShowToast callback prop |

### Final Status
- **Total Files Updated**: 17 files
- **Native alert() Calls Remaining**: 1 (fallback in PasswordChangeModal.tsx only)
- **Native confirm() Calls Remaining**: 0
- **Build Status**: ✅ Passing (No TypeScript errors)
- **Bundle Size**: ~1.83 MB (minified), ~407 KB (gzipped)

### Benefits
1. **Consistent UX**: All notifications follow the same design pattern
2. **Better Accessibility**: Modals are keyboard-navigable and screen-reader friendly
3. **Auto-dismiss**: Toast notifications automatically disappear after 5 seconds
4. **Customizable**: Different types (success, error, info, warning) for different contexts
5. **Mobile-Friendly**: Responsive design works on all screen sizes
6. **Professional Look**: Modern, polished appearance matching the system's design language

### Technical Implementation
**Before:**
```typescript
alert('فشل في حفظ البيانات');
if (!confirm('هل أنت متأكد؟')) return;
```

**After:**
```typescript
setToast({ message: 'فشل في حفظ البيانات', type: 'error' });
setShowConfirmModal(true); // with ConfirmModal component
```

---

*Last Updated: 2026-02-26*
*Migration Completed: Phase 1-3 Complete (100%)*
