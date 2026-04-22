# Search & Filter Implementation Guide

## ✅ Completed Implementation

### 1. Arabic Text Normalization Utility
**File:** `utils/arabicTextUtils.ts`

Features:
- `normalizeArabic(text)` - Normalizes Arabic character variations:
  - أ/إ/آ → ا
  - ة → ه
  - ى → ي
  - Removes diacritics (تَشْكِيل)
  - Normalizes Persian/Urdu characters
- `matchesArabicSearch(text, searchTerm)` - Case-insensitive search with normalization
- `matchesArabicSearchMulti(searchTerm, fields)` - Multi-field search
- `highlightMatch(text, searchTerm)` - Highlight matched text
- `debounce(func, delay)` - Optimize search input

### 2. Reusable Filter Components
**Directory:** `components/filters/`

#### SearchInput.tsx
- Arabic normalization hint display
- Debounced search (300ms default)
- Clear button
- Visual feedback for Arabic search
- Props: `value`, `onChange`, `placeholder`, `debounceMs`, `showArabicHint`, `iconColor`

#### DateRangeFilter.tsx
- Start/End date pickers
- Preset ranges (Today, Last 7 Days, Last 30 Days, This Month, etc.)
- Clear button
- Props: `startDate`, `endDate`, `onChange`, `presetRanges`, `label`

#### MultiSelectFilter.tsx
- Multi-select dropdown with checkboxes
- Searchable options
- Select All / Clear All
- Badge display for selected items
- Props: `options`, `value`, `onChange`, `searchable`, `showSelectAll`, `iconColor`

#### FilterPanel.tsx
- Collapsible panel
- Active filter badges with remove buttons
- Clear All button
- Props: `activeFilters`, `onClearAll`, `defaultOpen`, `title`, `iconColor`

### 3. Updated Pages

#### DPManagement.tsx ✅
**Enhanced Search:**
- Arabic-normalized search across: name, national ID, phone, region, landmark
- Search hint shows normalized text

**New Filters:**
- Governorate (current & original)
- Region
- Housing Type (tent, concrete, apartment, other)
- Family Size Range (min-max)
- Vulnerability Levels (multi-select)
- Registration Date Range
- Existing: Status, Marital Status, Gender, Vulnerability Priority

**Active Filter Badges:**
- Shows all active filters
- Click X to remove individual filters
- "مسح الكل" button to clear all

---

## 📋 Implementation Pattern for Remaining Pages

For each remaining page, follow this pattern:

### Step 1: Add Imports
```typescript
import { SearchInput, DateRangeFilter, MultiSelectFilter, FilterPanel } from '../../components/filters';
import { normalizeArabic, matchesArabicSearchMulti } from '../../utils/arabicTextUtils';
```

### Step 2: Add Filter State Variables
```typescript
// Enhanced filters
const [searchTerm, setSearchTerm] = useState('');
const [filterStatus, setFilterStatus] = useState<string>('all');
const [filterCategory, setFilterCategory] = useState<string>('all');
const [filterStartDate, setFilterStartDate] = useState<string>('');
const [filterEndDate, setFilterEndDate] = useState<string>('');
const [showFilters, setShowFilters] = useState(false);
```

### Step 3: Update Filter Logic
```typescript
const filteredData = data.filter(item => {
  // Arabic-normalized search
  const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
    item.name,
    item.name_ar,
    item.description,
    item.notes
  ]);
  
  // Other filters
  const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
  const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
  
  return matchesSearch && matchesStatus && matchesCategory;
});
```

### Step 4: Replace Search/Filter UI with FilterPanel
```tsx
<FilterPanel
  title="تصفية النتائج"
  activeFilters={[
    ...(searchTerm ? [{ id: 'search', label: `بحث: "${searchTerm}"`, value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
    ...(filterStatus !== 'all' ? [{ id: 'status', label: `الحالة: ${filterStatus}`, value: filterStatus, onRemove: () => setFilterStatus('all') }] : [])
  ]}
  onClearAll={() => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategory('all');
  }}
  defaultOpen={showFilters}
  iconColor="emerald" // or appropriate color
>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Search Input */}
    <div className="lg:col-span-3">
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="ابحث..."
        iconColor="emerald"
        showArabicHint
      />
    </div>
    
    {/* Other filters... */}
  </div>
</FilterPanel>
```

---

## 📝 Page-Specific Requirements

### AidCampaigns.tsx
**Search Fields:**
- Campaign name (name, name_ar)
- Description
- Notes
- Aid type

**Filters:**
- Status (planned, active, completed, cancelled)
- Category (food, non_food, medical, cash, hygiene, shelter, other)
- Aid Type (from inventory)
- Date Range (start/end date)
- Target Families Count Range
- Progress Percentage Range
- Inventory Item (multi-select)

**Color:** Emerald/Green

---

### InventoryLedger.tsx
**Search Fields:**
- Item name (name_ar, name)
- Notes
- Processed by user name

**Filters:**
- Transaction Type (in, out)
- Related To (purchase, donation, distribution, transfer, adjustment, damage)
- Item Category (multi-select)
- Date Range (processed date)
- Quantity Range (min-max)
- Item (multi-select from inventory)

**Color:** Amber/Orange

---

### DistributionManagement.tsx
**Search Fields:**
- Campaign name
- Family name (head of family)
- Notes

**Filters:**
- Campaign (multi-select)
- Status (distributed, pending)
- Aid Category
- Date Range (distribution date)
- Quantity Range
- Family Size Range

**Color:** Amber/Orange

---

### StaffManagement.tsx
**Search Fields:**
- First name, Last name (Arabic normalized)
- Email
- Phone number

**Filters:**
- Status (active, suspended)
- Role (field officer, other)
- Last Login Date Range
- Phone Number Prefix

**Color:** Emerald/Green

---

### InventoryItemsSetup.tsx
**Search Fields:**
- Item name (name_ar, name)
- Notes
- Category

**Filters:**
- Category (multi-select: food, non_food, medical, etc.)
- Status (active, inactive)
- Stock Level (low stock, normal, overstocked)
- Quantity Range (min-max)
- Date Range (created date)

**Color:** Emerald/Green

---

### AidTypesConfig.tsx
**Search Fields:**
- Name (Arabic & English)
- Description
- Category

**Filters:**
- Category (food, non_food, medical, cash, other)
- Status (active, inactive)
- Unit Type

**Color:** Emerald/Green

---

### CampDashboard.tsx
**Search Fields:**
- Family name
- Location/Region

**Filters:**
- Vulnerability Level (multi-select)
- Housing Type
- Governorate/Region
- Registration Status
- Family Size Range
- Date Range (registration date)

**Color:** Blue/Indigo

---

## 🎨 Color Scheme Reference

```typescript
const colorConfigs = {
  emerald: { // For inventory, aid, staff
    focus: 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
    icon: 'bg-emerald-100 text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  },
  blue: { // For DP/family management
    focus: 'focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
    icon: 'bg-blue-100 text-blue-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  amber: { // For distribution, ledger
    focus: 'focus:border-amber-500 focus:ring-4 focus:ring-amber-100',
    icon: 'bg-amber-100 text-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200'
  },
  red: { // For alerts, critical items
    focus: 'focus:border-red-500 focus:ring-4 focus:ring-red-100',
    icon: 'bg-red-100 text-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200'
  }
};
```

---

## 🧪 Testing Arabic Normalization

Test cases for search:
- أحمد vs احمد vs إحمد vs آحمد (all should match)
- فاطمة vs فاطمه (should match)
- مستشفى vs مستشفي (should match)
- الْقِرَادة vs القرادة (with/without diacritics)

Example test:
```typescript
import { normalizeArabic, matchesArabicSearch } from '../utils/arabicTextUtils';

console.log(normalizeArabic('أحمد')); // 'احمد'
console.log(normalizeArabic('فاطمة')); // 'فاطمه'
console.log(matchesArabicSearch('أحمد محمد', 'احمد')); // true
console.log(matchesArabicSearch('إبراهيم', 'ابراهيم')); // true
```

---

## 🚀 Next Steps

1. **Update Remaining Pages** (follow the pattern above)
2. **Backend Integration** - Add server-side search support
3. **URL State Management** - Save filters in URL query params
4. **Search History** - Store recent searches in localStorage
5. **Keyboard Shortcuts** - Ctrl+F for search, Ctrl+R to reset
6. **Performance Optimization** - Virtual scrolling for large lists
7. **Export Functionality** - Export filtered results to CSV/PDF

---

## 📊 Performance Considerations

- Use `debounce` for search inputs (300ms recommended)
- Implement virtual scrolling for lists > 100 items
- Consider server-side pagination and filtering for large datasets
- Cache normalized text for frequently searched fields
- Use React.memo for filter components to prevent re-renders

---

## 📞 Support

For questions or issues with the implementation:
1. Check the component props in the TypeScript definitions
2. Review the DPManagement.tsx implementation as a reference
3. Test Arabic normalization with the provided test cases
