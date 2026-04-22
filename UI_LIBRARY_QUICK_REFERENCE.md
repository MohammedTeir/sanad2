# 🎨 Professional UI Library - سند System

**Quick Reference Guide** | Version 1.0 | 2026-03-07

---

## 🚀 Quick Start

### Import Components
```tsx
import {
  PageHeader,
  StatCard,
  ActionCard,
  SectionCard,
  InfoBadge,
  EmptyState,
  LoadingSkeleton,
  ProfessionalCard,
  GradientCard,
  DataTable,
  FilterBar
} from '../../components/ui';
import Toast from '../../components/Toast';
```

---

## 📦 Components

### PageHeader
Professional page headers with breadcrumbs, actions, and refresh.

```tsx
<PageHeader
  title="Page Title"
  subtitle="Subtitle"
  onRefresh={loadData}
  refreshing={refreshing}
  icon={<Icon />}
  actionButton={{
    label: 'Add New',
    onClick: () => navigate('/new'),
    color: 'emerald'
  }}
/>
```

### StatCard
Statistics cards with 6 color variants.

```tsx
<StatCard
  title="Total Families"
  value={stats.totalFamilies}
  subtitle={`${stats.totalMembers} members`}
  icon={<UsersIcon />}
  variant="primary" // primary, success, warning, danger, info, purple
  onClick={() => navigate('/families')}
/>
```

### ActionCard
Quick action buttons with icons and badges.

```tsx
<ActionCard
  title="Register Family"
  icon={<PlusIcon />}
  variant="emerald" // emerald, blue, amber, red, purple, teal
  size="md" // sm, md, lg
  badge="3" // Optional notification badge
  onClick={() => navigate('/register')}
/>
```

### SectionCard
Section containers with headers.

```tsx
<SectionCard
  title="Section Title"
  subtitle="Optional subtitle"
  icon={<Icon />}
  headerAction={<button>View All</button>}
>
  {/* Content */}
</SectionCard>
```

### InfoBadge
Status badges with 6 color variants.

```tsx
<InfoBadge
  label="Approved"
  variant="success" // success, warning, danger, info, neutral, primary
  size="md" // sm, md, lg
/>
```

### EmptyState
Empty state displays with illustrations.

```tsx
<EmptyState
  illustration="data" // search, data, success, error, custom
  title="No data found"
  message="Try adjusting your filters"
  actionButton={{
    label: 'Add New',
    onClick: () => navigate('/new')
  }}
/>
```

### LoadingSkeleton
Loading placeholders.

```tsx
<LoadingSkeleton
  type="dashboard" // card, table, list, grid, dashboard
  count={4}
/>
```

### ProfessionalCard
Flexible card component.

```tsx
<ProfessionalCard
  padding="md" // none, sm, md, lg
  border="light" // none, light, medium
  rounded="2xl" // md, lg, xl, 2xl, 3xl
  hover={true}
  onClick={() => {}}
>
  {/* Content */}
</ProfessionalCard>
```

### GradientCard
Gradient background cards.

```tsx
<GradientCard
  title="Important Stats"
  value={1234}
  subtitle="Total count"
  variant="emerald" // emerald, blue, amber, red, purple, indigo
  icon={<Icon />}
>
  {/* Content */}
</GradientCard>
```

### DataTable
Data tables with sorting and row click.

```tsx
<DataTable
  data={data}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status', render: (item) => <InfoBadge label={item.status} /> },
    { key: 'date', header: 'Date' }
  ]}
  onRowClick={(item) => navigate(`/details/${item.id}`)}
  emptyMessage="No data found"
  striped={true}
  hoverable={true}
/>
```

### FilterBar
Search and filter bar.

```tsx
<FilterBar
  onSearch={(query) => setSearchQuery(query)}
  searchPlaceholder="Search..."
  filters={[
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' }
      ]
    }
  ]}
/>
```

---

## 🎨 Design System

### Colors
```
Emerald: #059669 (Primary, Success)
Blue:    #2563eb (Info)
Amber:   #d97706 (Warning)
Red:     #dc2626 (Danger)
Purple:  #9333ea (Admin)
Teal:    #0d9488 (Success Variant)
```

### Typography
```
font-black  - Headings, numbers
font-bold   - Emphasis, subtitles
text-xs     - 12px (labels, badges)
text-sm     - 14px (body text)
text-base   - 16px (default)
text-lg     - 18px (section titles)
text-xl     - 20px (page titles)
text-2xl    - 24px (hero titles)
text-3xl+   - 30px+ (stats)
```

### Spacing
```
gap-2  - 8px
gap-3  - 12px
gap-4  - 16px
gap-6  - 24px
gap-8  - 32px
```

### Border Radius
```
rounded-xl      - 12px (small cards)
rounded-2xl     - 16px (standard)
rounded-[2rem]  - 32px (large cards)
rounded-[2.5rem] - 40px (hero)
```

### Shadows
```
shadow-sm  - Default
shadow     - Normal
shadow-lg  - Hover
shadow-xl  - Modals
shadow-2xl - Hero sections
```

---

## 📱 Responsive Patterns

### Grid Layouts
```tsx
// Stats cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

// Action cards
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">

// Content sections
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

### Spacing
```tsx
p-4 md:p-6 lg:p-8  // Progressive padding
text-lg md:text-xl // Responsive font sizes
gap-3 md:gap-4     // Responsive gaps
```

---

## ✨ Animations

```tsx
// Page transitions
className="animate-in fade-in duration-500"

// Card hover
className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300"

// Icon scale
className="group-hover:scale-110 transition-transform"

// Loading
className="animate-pulse"

// Refresh spin
className="animate-spin"
```

---

## 📋 Templates

### Dashboard Template
```tsx
import { PageHeader, StatCard, SectionCard, ActionCard, GradientCard } from '../../components/ui';

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Dashboard" onRefresh={loadData} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total" value={count} icon={<Icon />} variant="primary" />
        <StatCard title="Active" value={count} icon={<Icon />} variant="success" />
        <StatCard title="Pending" value={count} icon={<Icon />} variant="warning" />
        <StatCard title="Alerts" value={count} icon={<Icon />} variant="danger" />
      </div>

      <SectionCard title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <ActionCard title="Add" icon={<Icon />} variant="emerald" onClick={() => {}} />
          <ActionCard title="View" icon={<Icon />} variant="blue" onClick={() => {}} />
          <ActionCard title="Edit" icon={<Icon />} variant="amber" onClick={() => {}} />
          <ActionCard title="Delete" icon={<Icon />} variant="red" onClick={() => {}} />
        </div>
      </SectionCard>

      <SectionCard title="Data">
        <DataTable data={data} columns={columns} onRowClick={(item) => {}} />
      </SectionCard>
    </div>
  );
};
```

### List Page Template
```tsx
import { PageHeader, SectionCard, DataTable, InfoBadge, EmptyState } from '../../components/ui';

const ListPage = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Items"
        actionButton={{ label: 'Add New', onClick: () => navigate('/new'), color: 'emerald' }}
      />

      <FilterBar
        onSearch={setSearchQuery}
        filters={[
          { key: 'status', label: 'Status', type: 'select', value: filter, onChange: setFilter }
        ]}
      />

      <SectionCard title="Items List">
        {data.length === 0 ? (
          <EmptyState title="No items" message="Try adjusting filters" />
        ) : (
          <DataTable
            data={data}
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'status', header: 'Status', render: (item) => <InfoBadge label={item.status} /> }
            ]}
            onRowClick={(item) => navigate(`/details/${item.id}`)}
          />
        )}
      </SectionCard>
    </div>
  );
};
```

---

## 🔧 Build & Test

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Preview
npm run preview
```

---

## 📚 Documentation

- **FINAL_SUMMARY.md** - Complete overview
- **PROFESSIONAL_UI_IMPLEMENTATION_GUIDE.md** - Detailed implementation guide
- **REBUILD_STATUS.md** - Progress tracking
- **CAMPAIGN_MANAGER_DASHBOARD_REBUILD.md** - Dashboard case study

---

## ✅ Checklist

For each page migration:

- [ ] Import UI components
- [ ] Replace headers with PageHeader
- [ ] Replace stat cards with StatCard
- [ ] Replace action buttons with ActionCard
- [ ] Replace sections with SectionCard
- [ ] Replace badges with InfoBadge
- [ ] Replace empty states with EmptyState
- [ ] Replace loading with LoadingSkeleton
- [ ] Add animations (`animate-in fade-in duration-500`)
- [ ] Add responsive classes (`md:`, `lg:`)
- [ ] Test on mobile, tablet, desktop
- [ ] Build successfully (`npm run build`)

---

**Last Updated:** 2026-03-07
**Version:** 1.0
**Status:** ✅ Production Ready
