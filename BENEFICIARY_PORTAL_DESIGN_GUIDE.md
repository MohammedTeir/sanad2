# Beneficiary Portal - Visual Design Guide

## Layout Structure

### Desktop View (> 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (Sticky Top)                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [س] سند                        [User Avatar]                │ │
│ │ بوابة النازحين                                              │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ [الملف الشخصي] [أفراد الأسرة] [السكن] [الصحة] [المساعدات] │ │
│ │ [الطلبات] [الشكاوى] [الإعدادات]                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Main Content Area (Scrollable)                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  [Profile Summary Card - Gradient Emerald Background]      │ │
│ │  ┌──────────────────────────────────────────────────────┐  │ │
│ │  │ Name: إبراهيم يوسف أحمد العطار                       │  │ │
│ │  │ Status: [موافق عليه] Priority: [عالي جداً]          │  │ │
│ │  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │  │ │
│ │  │ │ 5   │ │ 3   │ │ 2   │ │ 85    │                     │  │ │
│ │  │ │أفراد│ │ذكور │ │إناث │ │هشاشة │                     │  │ │
│ │  │ └─────┘ └─────┘ └─────┘ └─────┘                     │  │ │
│ │  └──────────────────────────────────────────────────────┘  │ │
│ │                                                             │ │
│ │  [Quick Stats Grid]                                         │ │
│ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │ │
│ │  │👨‍👩‍👧‍👦│ │👦│ │👴│ │📊│                       │ │
│ │  │  5   │ │  2   │ │  1   │ │ 85   │                      │ │
│ │  │أفراد │ │أطفال │ │كبار  │ │هشاشة │                      │ │
│ │  └──────┘ └──────┘ └──────┘ └──────┘                      │ │
│ │                                                             │ │
│ │  [Family Composition Chart]                                 │ │
│ │  ┌────────────────────────────────────────────────────┐    │ │
│ │  │ [👨] 3 ذكور | [👩] 2 إناث | [👶] 2 أطفال | ...    │    │ │
│ │  └────────────────────────────────────────────────────┘    │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile View (< 768px)

```
┌─────────────────────────────────┐
│ Header (Sticky)                 │
│ ┌─────────────────────────────┐ │
│ │ ☰  [س] سند        👤        │ │
│ │    بوابة النازحين           │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Content (Scrollable)            │
│                                 │
│ [Profile Card]                  │
│ ┌─────────────────────────────┐ │
│ │ Name & Stats                │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Quick Stats]                   │
│ ┌─────┐ ┌─────┐                │ │
│ │  5  │ │  3  │                │ │
│ └─────┘ └─────┘                │ │
│                                 │
│ ... more content ...            │
│                                 │
├─────────────────────────────────┤
│ Bottom Tab Bar (Fixed)          │
│ ┌─────┬─────┬─────┬─────┬─────┐│
│ │🏠  │👨‍👩‍👧 │🏠  │❤️  │⚙️  ││
│ │ملف │أسرة │سكن │صحة │أكثر ││
│ └─────┴─────┴─────┴─────┴─────┘│
└─────────────────────────────────┘
```

## Component Designs

### Profile Summary Card

```
╔═══════════════════════════════════════════════════════════╗
║  Gradient Background (Emerald 600 → 700 → 800)            ║
║  Text: White                                              ║
║                                                           ║
║  ┌────────────────────────────────────────────────────┐  ║
║  │ إبراهيم يوسف أحمد العطار                          │  ║
║  │ رقم الهوية: 401234567                              │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                           ║
║  Badges:                                                  ║
║  [موافق عليه ✅] [عالي جداً ⚠️]                         ║
║                                                           ║
║  Stats Grid (White/10 backdrop):                         ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   ║
║  │ عدد الأفراد │ │ الذكور   │ │ الإناث   │ │ الهشاشة │   ║
║  │    5     │ │    3     │ │    2     │ │   85    │   ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────┘   ║
║                                                           ║
║  Additional Info:                                         ║
║  ┌────────────┐ ┌────────────┐ ┌────────────┐           ║
║  │ المخيم     │ │ رقم الوحدة │ │ التسجيل    │           ║
║  │ دير البلح │ │ خيمة-042   │ │ 2023-11-20│           ║
║  └────────────┘ └────────────┘ └────────────┘           ║
╚═══════════════════════════════════════════════════════════╝
```

### Family Member Card

```
╔═══════════════════════════════════════════════════════════╗
║  White Background, Border: Gray-100                       ║
║  Hover: Shadow-lg, Border: Emerald-200                    ║
║                                                           ║
║  [👶] ياسين إبراهيم العطار                    [▼]        ║
║       8 سنة • ذكر • الابن                                 ║
║                                                           ║
║  Health Badges:                                           ║
║  [إعاقة 🔴] [متابعة طبية 🔵]                             ║
║                                                           ║
║  ───────────────────────────────────────────────────────  ║
║  (Expanded Content - when clicked)                        ║
║                                                           ║
║  Personal Info:                                           ║
║  ┌──────────────────┐ ┌──────────────────┐              ║
║  │ تاريخ الميلاد    │ │ رقم الهوية       │              ║
║  │ 2016-03-15       │ │ 401234567        │              ║
║  └──────────────────┘ └──────────────────┘              ║
║                                                           ║
║  Education/Work (Gray-50 BG):                            ║
║  ┌──────────────────────────────────────────────────┐   ║
║  │ الحالة الدراسية: ابتدائي ✓                       │   ║
║  │ الحالة العملية: لا يدرس                          │   ║
║  └──────────────────────────────────────────────────┘   ║
║                                                           ║
║  Health Details (Red-50 BG):                             ║
║  ┌──────────────────────────────────────────────────┐   ║
║  │ الإعاقة: حركية (متوسطة)                          │   ║
║  └──────────────────────────────────────────────────┘   ║
║                                                           ║
║  Actions:                                                 ║
║  [تعديل ✅] [حذف ❌]                                     ║
╚═══════════════════════════════════════════════════════════╝
```

### Tab Button

```
Inactive State:
┌──────────────────────────┐
│ [🏠] الملف الشخصي        │  White BG, Gray-600 Text
└──────────────────────────┘  Hover: Emerald-50 BG

Active State:
┌──────────────────────────┐
│ [🏠] الملف الشخصي        │  Emerald Gradient BG, White Text
└──────────────────────────┘  Shadow: Emerald-200
```

### Aid Distribution Item

```
╔═══════════════════════════════════════════════════════════╗
║  White Background, Border: Gray-100                       ║
║                                                           ║
║  [🍞] سلة غذائية شهرية              [تم التسليم ✅]      ║
║       مواد غذائية                                         ║
║                                                           ║
║  ┌───────────┐ ┌───────────────┐ [✍️]                   ║
║  │ الكمية: 1 │ │ 15 مايو 2024 │                         ║
║  └───────────┘ └───────────────┘                         ║
║                                                           ║
║  ملاحظات: تم الاستلام من قبل رب الأسرة                   ║
╚═══════════════════════════════════════════════════════════╝
```

## Color Palette

### Primary Colors
```
Emerald (Primary):
- 600: #059669  (Buttons, Headers)
- 700: #047857  (Hover states)
- 50:  #ECFDF5  (Backgrounds)

Blue (Secondary):
- 600: #2563eb  (Secondary actions)
- 50:  #EFF6FF  (Backgrounds)

Amber (Warning):
- 600: #d97706  (Warnings)
- 50:  #FFFBEB  (Backgrounds)

Red (Danger/High Priority):
- 600: #dc2626  (Errors, Urgent)
- 50:  #FEF2F2  (Backgrounds)
```

### Status Colors
```
Success:  bg-emerald-100, text-emerald-700, border-emerald-200
Warning:  bg-amber-100, text-amber-700, border-amber-200
Info:     bg-blue-100, text-blue-700, border-blue-200
Danger:   bg-red-100, text-red-700, border-red-200
Neutral:  bg-gray-100, text-gray-700, border-gray-200
```

## Typography

### Arabic Font Stack
```css
font-family: 'Tajawal', 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Font Weights
```
Black (900):  Headings, Important text
Bold (700):   Body text, Labels
Normal (400): Secondary text
```

### Text Sizes
```
3xl (30px):   Page titles
2xl (24px):   Section headers
xl (20px):    Card titles
lg (18px):    Subtitles
base (16px):  Body text
sm (14px):    Labels, Secondary text
xs (12px):    Captions, Hints
```

## Animations

### Transitions
```css
transition-all duration-300  /* Standard */
transition-all duration-500  /* Slow, emphasis */
transition-transform duration-300  /* Transform only */
```

### Hover Effects
```
Cards:
- transform: translateY(-2px)
- shadow: shadow-lg
- border-color: emerald-200

Buttons:
- opacity: 0.9
- transform: scale(1.02)
```

### Loading States
```
Spinner:
- 16x16, 32x32, 64x64 sizes
- Border: 4px solid
- Colors: Emerald-500
- Animation: spin 1s linear infinite
```

## Responsive Breakpoints

```
Mobile:     320px - 767px
Tablet:     768px - 1023px
Desktop:    1024px - 1439px
Large:      1440px+
```

## Iconography

### Icon Style
- Outline icons (stroke-width: 2)
- Consistent 24x24 size
- Rounded caps and joins
- Color matches text color

### Icon Usage
```
🏠 Profile/ Home
👨‍👩‍👧‍👦 Family
🏠 Housing
❤️ Health
📦 Aid
📋 Requests
📝 Complaints
⚙️ Settings
```

## Accessibility

### Focus States
```css
focus:outline-none
focus:ring-2
focus:ring-emerald-500
focus:ring-offset-2
```

### ARIA Labels
```html
<button aria-label="إضافة فرد جديد">
<input aria-label="الاسم الأول">
```

### Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- All color combinations tested

---

This design guide ensures consistency across the entire beneficiary portal while maintaining a modern, beautiful, and accessible user interface.
