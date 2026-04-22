# Logo Component - سند

## 🎨 Overview

Beautiful Arabic calligraphy logo for "سند" (Sand) - Gaza Camp Management System.

---

## 📦 Usage

### Basic Usage

```tsx
import Logo from '../components/Logo';

// Simple logo
<Logo />
```

### Size Variants

```tsx
// Small (40px)
<Logo size="sm" />

// Medium (60px) - Default
<Logo size="md" />

// Large (80px)
<Logo size="lg" />

// Extra Large (120px)
<Logo size="xl" />
```

### Color Variants

```tsx
// Light variant (emerald greens) - Default
<Logo variant="light" />

// Dark variant (deep greens)
<Logo variant="dark" />

// Gradient variant (vibrant greens)
<Logo variant="gradient" />
```

### With Full Text

```tsx
// Show logo with full name underneath
<Logo showFullText={true} />

// Shows:
// سند
// نظام إدارة المخيمات
```

### Custom ClassName

```tsx
<Logo size="lg" className="mx-auto" />
```

---

## 🎯 Examples

### Login Page Header

```tsx
<div className="mb-4">
  <Logo size="md" variant="light" />
</div>
<h1>سند</h1>
<p>نظام إدارة مخيمات غزة المركزي</p>
```

### Navigation Bar

```tsx
<nav className="bg-white shadow-lg">
  <div className="container mx-auto px-4 py-3">
    <Logo size="sm" variant="gradient" />
  </div>
</nav>
```

### Footer

```tsx
<footer className="bg-emerald-900 text-white">
  <div className="text-center py-8">
    <Logo size="md" variant="light" />
    <p className="mt-4 text-emerald-200">
      جميع الحقوق محفوظة © 2026
    </p>
  </div>
</footer>
```

### Loading Screen

```tsx
<div className="min-h-screen flex items-center justify-center">
  <Logo size="xl" variant="gradient" />
</div>
```

### Email Header

```tsx
<div className="bg-emerald-600 p-8 text-center">
  <Logo size="lg" variant="light" />
</div>
```

---

## 🎨 Design Features

### Arabic Calligraphy

The logo features authentic Arabic calligraphy for "سند" with:

- **س (Sin)** - Flowing curved shape
- **ن (Nun)** - Single dot below
- **د (Dal)** - Small finishing curve

### Visual Elements

1. **Background Circle** - Subtle gradient circle
2. **Decorative Ring** - Thin outer ring for depth
3. **Shadow Effect** - Drop shadow for dimension
4. **Shine Effect** - Subtle highlight for polish
5. **Gradient Fill** - Modern emerald gradient

### Color Palette

**Light Variant:**
- Primary: `#059669` (Emerald 600)
- Secondary: `#047857` (Emerald 700)
- Accent: `#10b981` (Emerald 500)

**Dark Variant:**
- Primary: `#064e3b` (Emerald 900)
- Secondary: `#065f46` (Emerald 800)
- Accent: `#059669` (Emerald 600)

**Gradient Variant:**
- Start: `#10b981` (Emerald 500)
- Middle: `#059669` (Emerald 600)
- End: `#047857` (Emerald 700)

---

## 📐 Size Specifications

| Size | Logo Dimensions | Text Size | Full Text Size | Use Case |
|------|----------------|-----------|----------------|----------|
| `sm` | 40×40px | 24px | 14px | Navigation, small icons |
| `md` | 60×60px | 36px | 18px | Headers, cards (default) |
| `lg` | 80×80px | 48px | 24px | Hero sections, banners |
| `xl` | 120×120px | 72px | 32px | Landing pages, splash screens |

---

## 🔧 Customization

### Create Custom Variant

```tsx
<Logo 
  size="lg" 
  variant="gradient"
  className="custom-class"
/>
```

### Modify in CSS

```css
.logo-container svg {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}
```

---

## ♿ Accessibility

The logo is purely decorative and doesn't require alt text. However, if used as a link:

```tsx
<a href="/" aria-label="سند - الصفحة الرئيسية">
  <Logo size="md" />
</a>
```

---

## 🎯 Best Practices

### ✅ Do:

- Use `variant="light"` on dark backgrounds
- Use `variant="dark"` or `variant="gradient"` on light backgrounds
- Keep adequate spacing around the logo
- Use appropriate size for context

### ❌ Don't:

- Don't stretch or distort the logo
- Don't use on busy backgrounds
- Don't make it too small (< 40px)
- Don't change the colors arbitrarily

---

## 📱 Responsive Usage

```tsx
<div className="flex items-center gap-4">
  <Logo size="sm" className="hidden md:block" />
  <Logo size="md" className="md:hidden" />
</div>
```

---

## 🎨 Background Combinations

### Light Background

```tsx
<div className="bg-white">
  <Logo variant="gradient" />
</div>
```

### Dark Background

```tsx
<div className="bg-emerald-900">
  <Logo variant="light" />
</div>
```

### Gradient Background

```tsx
<div className="bg-gradient-to-r from-emerald-600 to-emerald-700">
  <Logo variant="light" />
</div>
```

---

## 🚀 Performance

- **SVG Format** - Scalable, crisp at any size
- **No External Dependencies** - Pure React/SVG
- **Optimized Paths** - Minimal file size
- **No Animations** - Instant render

---

## 📚 Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Logo size |
| `variant` | `'light' \| 'dark' \| 'gradient'` | `'gradient'` | Color scheme |
| `showFullText` | `boolean` | `false` | Show full name below logo |
| `className` | `string` | `''` | Additional CSS classes |

---

## 🎭 Animation (Optional)

Add your own animations:

```tsx
<Logo 
  size="lg" 
  className="animate-pulse hover:scale-110 transition-transform"
/>
```

---

## 📄 License

Part of the سند (Sand) project.

---

**Created:** 2026-02-18  
**Version:** 1.0  
**Component:** `components/Logo.tsx`
