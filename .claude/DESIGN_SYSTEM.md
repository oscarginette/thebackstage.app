# Backstage Design System - Component Spacing Reference

**Purpose**: Ensure ALL new components follow consistent vertical spacing, typography, and styling patterns.

**Critical Rule**: ALWAYS reference this document when creating new UI components. Vertical compactness is a priority.

---

## 📏 Spacing Scale (Tailwind)

Use these values consistently:

| Value | Tailwind | Pixels | Usage |
|-------|----------|--------|-------|
| `0.5` | `space-y-0.5` / `mb-0.5` | 2px | Micro spacing (rare) |
| `1` | `space-y-1` / `mb-1` | 4px | Title to subtitle |
| `1.5` | `space-y-1.5` | 6px | CardHeader internal |
| `2` | `space-y-2` / `mt-2` | 8px | Form field internal (label→input→helper) |
| `2.5` | `py-2.5` | 10px | Option item vertical padding |
| `3` | `space-y-3` / `gap-3` | 12px | Compact list items |
| `4` | `space-y-4` / `gap-4` | 16px | Form field groups, grid gaps |
| `5` | `space-y-5` / `mb-5` | 20px | **Section spacing (default)** |
| `6` | `p-6` | 24px | **Card padding (default)** |
| `8` | `p-8` | 32px | Large card padding |

**Key Principle**: Use `space-y-5` (20px) for section-level spacing, `space-y-2` (8px) for component-internal spacing.

---

## 🎨 Typography System

### Headings (Use `font-serif`)

```tsx
// Section Title (h2)
<h2 className="text-base font-serif mb-1 text-foreground">
  Section Title
</h2>

// Page Title (h1)
<h1 className="text-4xl md:text-5xl font-serif text-foreground">
  Page Title
</h1>
```

**Rules**:
- Section titles: `text-base` (16px)
- Always `font-serif` for headings
- Margin-bottom: `mb-1` (4px) if followed by subtitle

### Body Text

```tsx
// Subtitle/Description
<p className="text-foreground/50 text-xs">
  Descriptive text under heading
</p>

// Helper Text (smallest)
<p className="text-[10px] text-foreground/40">
  Helper or hint text
</p>

// Label (uppercase micro)
<label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
  LABEL
</label>
```

**Rules**:
- Subtitles: `text-xs` (12px) at 50% opacity
- Helper text: `text-[10px]` at 40% opacity
- Labels: `text-[9px]` uppercase, black weight, wide tracking

### Text Sizes Reference

| Class | Size | Usage |
|-------|------|-------|
| `text-4xl` | 36px | Page title (h1) |
| `text-base` | 16px | Section title (h2) |
| `text-sm` | 14px | Option labels, button text |
| `text-xs` | 12px | Descriptions, subtitles |
| `text-[10px]` | 10px | Helper text, notes |
| `text-[9px]` | 9px | Field labels (uppercase) |

---

## 🧩 Component Patterns

### 1. Section Header (Standard)

```tsx
<div>
  <h2 className="text-base font-serif mb-1 text-foreground">
    Section Title
  </h2>
  <p className="text-foreground/50 text-xs">
    Short description of what this section does
  </p>
</div>
```

**Spacing**:
- Title to subtitle: `mb-1` (4px)
- Subtitle to content: handled by parent `space-y-5`

---

### 2. Form Field (Standard)

```tsx
<div className="space-y-2">
  {/* Label */}
  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
    EMAIL
  </label>

  {/* Input */}
  <input
    type="email"
    className="w-full h-10 px-4 rounded-xl border border-black/10 dark:border-white/10
               bg-white dark:bg-[#111] text-sm font-medium
               focus:outline-none focus:ring-2 focus:ring-accent/20
               transition-all"
  />

  {/* Helper/Error Text */}
  <p className="text-[10px] text-foreground/40 ml-1">
    We'll never share your email
  </p>
</div>
```

**Spacing**:
- Wrapper: `space-y-2` (8px between label, input, helper)
- Input height: `h-10` (40px)
- Horizontal padding: `px-4` (16px)

---

### 3. Checkbox/Toggle Option (Compact)

```tsx
<div className="flex items-center justify-between py-2.5 px-3
                border border-black/5 dark:border-white/10
                rounded-xl bg-white/50 dark:bg-[#0A0A0A]/50
                hover:bg-white/80 dark:hover:bg-[#0A0A0A]/80
                transition-colors">
  <label htmlFor="option-id" className="flex-1 cursor-pointer">
    <span className="text-sm font-medium text-foreground block">
      Option Label
    </span>
    <span className="text-[10px] text-foreground/40 block mt-0.5">
      Short description
    </span>
  </label>
  <input
    type="checkbox"
    id="option-id"
    className="h-4 w-4 rounded border-gray-300 text-primary
               focus:ring-2 focus:ring-primary/20
               cursor-pointer ml-3 flex-shrink-0"
  />
</div>
```

**Spacing**:
- Vertical padding: `py-2.5` (10px)
- Horizontal padding: `px-3` (12px)
- Label to description: `mt-0.5` (2px)
- Checkbox margin: `ml-3` (12px)
- Checkbox size: `h-4 w-4` (16px)

**List Spacing**:
```tsx
<div className="space-y-3">
  {/* Checkbox options here */}
</div>
```

---

### 4. Card Container (Standard)

```tsx
<section className="bg-white/90 dark:bg-[#0A0A0A]
                    backdrop-blur-md
                    border border-black/5 dark:border-white/10
                    rounded-2xl p-6
                    shadow-sm">
  {/* Content */}
</section>
```

**Variants**:
- Default padding: `p-6` (24px)
- Large padding: `p-8` (32px)
- Border radius: `rounded-2xl` (16px)

---

### 5. Alert/Message Banner (Compact)

```tsx
{/* Error */}
<div className="px-3 py-2
                bg-red-50 dark:bg-red-900/20
                border border-red-200 dark:border-red-800
                rounded-xl">
  <p className="text-xs text-red-800 dark:text-red-200">
    Error message
  </p>
</div>

{/* Success */}
<div className="px-3 py-2
                bg-green-50 dark:bg-green-900/20
                border border-green-200 dark:border-green-800
                rounded-xl">
  <p className="text-xs text-green-800 dark:text-green-200">
    Success message
  </p>
</div>
```

**Spacing**:
- Padding: `px-3 py-2` (12px horizontal, 8px vertical)
- Text size: `text-xs` (12px)
- Border radius: `rounded-xl` (12px)

---

### 6. Button Sizes

```tsx
import { BUTTON_STYLES } from '@/domain/types/design-tokens';

// Extra Small (32px)
<button className="h-8 px-3 text-xs rounded-xl">
  Button
</button>

// Small (36px)
<button className="h-9 px-4 text-xs rounded-xl">
  Button
</button>

// Medium (40px - default)
<button className="h-10 px-6 text-sm rounded-xl">
  Button
</button>

// Large (48px)
<button className="h-12 px-8 text-base rounded-xl">
  Button
</button>
```

**Rules**:
- Always use design tokens from `/domain/types/design-tokens.ts`
- Default: `h-10` (40px) with `text-sm`
- Border radius: `rounded-xl` (12px)

---

### 7. Grid Layout (Form Fields)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Form fields */}
</div>
```

**Spacing**:
- Gap between columns: `gap-4` (16px)
- Responsive: Single column on mobile, 2 columns on desktop

---

## 🎯 Complete Section Example (Best Practice)

```tsx
<div className="space-y-5">
  {/* Header */}
  <div>
    <h2 className="text-base font-serif mb-1 text-foreground">
      Section Title
    </h2>
    <p className="text-foreground/50 text-xs">
      Brief description of this section
    </p>
  </div>

  {/* Error/Success Messages */}
  {error && (
    <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
      <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
    </div>
  )}

  {/* Content */}
  <div className="space-y-3">
    {/* Compact options/items here */}
  </div>

  {/* Helper Note */}
  <p className="text-[10px] text-foreground/40">
    Optional helper note
  </p>
</div>
```

**Key Spacing**:
- Section wrapper: `space-y-5` (20px between major sections)
- Content items: `space-y-3` (12px for compact lists)
- Form fields: `space-y-2` (8px internal)

---

## 🌓 Dark Mode (Automatic)

**Always use semantic color variables**:

```tsx
// ✅ CORRECT - Adapts to theme automatically
<div className="bg-background text-foreground border-border">

// ❌ WRONG - Hard-coded colors
<div className="bg-white text-black border-gray-300">
```

**Available Variables**:
- `background` - Page background
- `foreground` - Main text color
- `card` - Card background
- `border` - Border color
- `primary` - Accent/brand color
- `muted-foreground` - Secondary text

**Opacity Utilities**:
```tsx
text-foreground/50    // 50% opacity
text-foreground/40    // 40% opacity
border-black/5        // Light mode border
border-white/10       // Dark mode border
```

**Dual Mode Styles**:
```tsx
// Pattern: light-mode-class dark:dark-mode-class
<div className="bg-white/90 dark:bg-[#0A0A0A]
                border-black/5 dark:border-white/10">
```

---

## 📐 Vertical Spacing Checklist

When creating a new component, verify:

- [ ] **Section spacing**: Using `space-y-5` (20px) between major sections?
- [ ] **Item spacing**: Using `space-y-3` (12px) for compact lists?
- [ ] **Form spacing**: Using `space-y-2` (8px) for field internal?
- [ ] **Typography**: Using `text-base font-serif` for section titles?
- [ ] **Subtitles**: Using `text-xs text-foreground/50`?
- [ ] **Helper text**: Using `text-[10px] text-foreground/40`?
- [ ] **Padding**: Using `px-3 py-2.5` for compact options?
- [ ] **Border radius**: Using `rounded-xl` (12px) for cards/inputs?
- [ ] **Dark mode**: Using semantic variables (not hard-coded colors)?
- [ ] **Design tokens**: Importing from `/domain/types/design-tokens.ts`?

---

## 🚫 Common Mistakes (Anti-Patterns)

### ❌ Too Much Vertical Space

```tsx
// DON'T: Excessive spacing
<div className="space-y-8">
  <h2 className="text-2xl mb-4">Title</h2>
  <p className="text-base mt-6">Description</p>
</div>
```

### ✅ Correct: Compact

```tsx
// DO: Compact spacing
<div className="space-y-5">
  <h2 className="text-base font-serif mb-1">Title</h2>
  <p className="text-xs text-foreground/50">Description</p>
</div>
```

---

### ❌ Inconsistent Typography

```tsx
// DON'T: Random sizes
<h2 className="text-xl">Title</h2>
<p className="text-base">Description</p>
<span className="text-sm">Helper</span>
```

### ✅ Correct: Design System Sizes

```tsx
// DO: System-defined hierarchy
<h2 className="text-base font-serif">Title</h2>
<p className="text-xs text-foreground/50">Description</p>
<span className="text-[10px] text-foreground/40">Helper</span>
```

---

### ❌ Hard-Coded Colors

```tsx
// DON'T: Won't work in dark mode
<div className="bg-white text-black border-gray-300">
```

### ✅ Correct: Semantic Variables

```tsx
// DO: Adapts to theme
<div className="bg-background text-foreground border-border">
```

---

### ❌ Bloated Option Cards

```tsx
// DON'T: Too much padding
<div className="p-6 space-y-4">
  <label className="text-lg">Option</label>
  <p className="text-base">Description</p>
</div>
```

### ✅ Correct: Compact Options

```tsx
// DO: Minimal padding, smaller text
<div className="py-2.5 px-3">
  <label className="text-sm font-medium block">Option</label>
  <span className="text-[10px] text-foreground/40 block mt-0.5">
    Description
  </span>
</div>
```

---

## 📚 Design Token Constants

**ALWAYS import and use design tokens**:

```typescript
import {
  CARD_STYLES,
  BUTTON_STYLES,
  INPUT_STYLES,
  TEXT_STYLES,
  LAYOUT_STYLES
} from '@/domain/types/design-tokens';

// Example usage
<div className={CARD_STYLES.base + ' ' + CARD_STYLES.padding.md}>
  <h2 className={TEXT_STYLES.heading.h2}>Title</h2>
  <p className={TEXT_STYLES.body.subtle}>Description</p>
</div>
```

**File location**: `/domain/types/design-tokens.ts`

---

## 🎨 Color Palette Reference

### Light Theme
- Background: `#FDFCF8` (Cream)
- Foreground: `#1c1c1c` (Almost black)
- Primary: `#FF5500` (Orange)
- Border: `#E8E6DF`
- Card: `#FFFFFF`

### Dark Theme
- Background: `#0A0A0A` (Near black)
- Foreground: `#EDEDED` (Off-white)
- Primary: `#FF6B2C` (Brighter orange)
- Border: `#2D2D2D`
- Card: `#0A0A0A`

**Always use CSS variables** (`var(--background)`, `text-foreground`, etc.)

---

## 📝 Quick Reference Table

| Element | Tailwind Classes | Spacing |
|---------|------------------|---------|
| Section container | `space-y-5` | 20px |
| Section title | `text-base font-serif mb-1` | 16px font, 4px margin |
| Section subtitle | `text-xs text-foreground/50` | 12px font |
| Compact list | `space-y-3` | 12px |
| Form field wrapper | `space-y-2` | 8px |
| Input height | `h-10` | 40px |
| Checkbox option padding | `py-2.5 px-3` | 10px/12px |
| Alert/banner padding | `px-3 py-2` | 12px/8px |
| Helper text | `text-[10px] text-foreground/40` | 10px font |
| Card padding | `p-6` | 24px |
| Border radius (cards) | `rounded-2xl` | 16px |
| Border radius (inputs) | `rounded-xl` | 12px |

---

## 🔧 Usage Instructions

**Before creating ANY new UI component**:

1. Read this document
2. Identify the component type (section, form field, option, etc.)
3. Copy the relevant pattern from above
4. Verify spacing matches the checklist
5. Test in both light and dark modes
6. Ensure vertical compactness

**Goal**: Every component should look like it belongs to the same cohesive design system with minimal vertical space usage.

---

**Last Updated**: 2026-01-10
**Maintained by**: Claude (SuperClaude configuration)
**Project**: Backstage (backstage.app)
