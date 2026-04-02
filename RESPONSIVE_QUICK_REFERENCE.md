# Responsive Design - Quick Reference

## 🎯 Breakpoints
```
xs:  475px  (large phones)
sm:  640px  (landscape phones)
md:  768px  (tablets)
lg:  1024px (desktops)
xl:  1280px (large desktops)
2xl: 1400px (extra large)
```

## 📏 Common Patterns

### Sizing
```jsx
// Icons
h-4 w-4 sm:h-5 sm:w-5           // Small icons
h-6 w-6 sm:h-7 sm:w-7           // Medium icons
h-8 w-8 sm:h-9 sm:w-9           // Large icons
h-10 w-10 sm:h-12 sm:w-12       // Extra large icons

// Buttons
h-8 sm:h-9                       // Small buttons
h-9 sm:h-10                      // Default buttons
h-10 sm:h-11                     // Large buttons

// Touch targets (minimum 44x44px)
min-h-[44px] min-w-[44px]
touch-target                     // Utility class
```

### Typography
```jsx
// Headings
text-xl sm:text-2xl md:text-3xl      // H1
text-lg sm:text-xl md:text-2xl       // H2
text-base sm:text-lg md:text-xl      // H3

// Body text
text-xs sm:text-sm                   // Small text
text-sm sm:text-base                 // Body text
text-base sm:text-lg                 // Large text

// Utility classes
text-responsive-xs                   // text-[10px] sm:text-xs
text-responsive-sm                   // text-xs sm:text-sm
text-responsive-base                 // text-sm sm:text-base
text-responsive-lg                   // text-base sm:text-lg md:text-xl
text-responsive-xl                   // text-lg sm:text-xl md:text-2xl
text-responsive-2xl                  // text-xl sm:text-2xl md:text-3xl
```

### Spacing
```jsx
// Padding
p-3 sm:p-4 md:p-5 lg:p-6            // All sides
px-3 sm:px-4 md:px-5 lg:px-6        // Horizontal
py-3 sm:py-4 md:py-5 lg:py-6        // Vertical

// Utility classes
padding-responsive                   // p-3 sm:p-4 md:p-5 lg:p-6
padding-responsive-x                 // px-3 sm:px-4 md:px-5 lg:px-6
padding-responsive-y                 // py-3 sm:py-4 md:py-5 lg:py-6

// Gap
gap-3 sm:gap-4 md:gap-5 lg:gap-6    // Flex/Grid gap
space-y-2 sm:space-y-3 md:space-y-4 // Vertical spacing

// Utility classes
spacing-responsive-sm                // space-y-2 sm:space-y-3 md:space-y-4
spacing-responsive-md                // space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6
```

### Grids
```jsx
// 2 columns → 4 columns
grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4

// 1 column → 2 columns
grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6

// 1 → 2 → 3 columns
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4

// Form grid
grid grid-cols-1 sm:grid-cols-2 gap-4
```

### Flex
```jsx
// Column → Row
flex flex-col sm:flex-row gap-3

// Wrap
flex flex-wrap gap-3 sm:gap-4

// Center
flex items-center justify-center

// Space between
flex items-center justify-between
```

### Visibility
```jsx
// Hide on mobile
hidden sm:block                      // Show from sm up
hidden md:block                      // Show from md up
hidden lg:block                      // Show from lg up

// Show on mobile only
sm:hidden                            // Hide from sm up
md:hidden                            // Hide from md up

// Conditional text
<span className="hidden xs:inline">Full Text</span>
<span className="xs:hidden">Short</span>
```

### Width
```jsx
// Full width → Fixed width
w-full sm:w-auto
w-full sm:w-[240px]
w-full sm:w-64

// Responsive max-width
max-w-[120px] sm:max-w-[200px] lg:max-w-none

// Sheet/Dialog width
w-[90vw] sm:w-[400px] max-w-md
w-[280px] xs:w-72
```

### Height
```jsx
// Header heights
h-14 sm:h-16                         // App header
h-28 sm:h-32                         // Stat cards
h-72 sm:h-80                         // Charts
```

## 🎨 Component Templates

### StatCard
```jsx
<div className="stat-card">
  <div className="flex items-start justify-between gap-3">
    <div className="space-y-1 min-w-0 flex-1">
      <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
        {title}
      </p>
      <p className="text-xl sm:text-2xl md:text-3xl font-bold">
        {value}
      </p>
      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
        {description}
      </p>
    </div>
    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
    </div>
  </div>
</div>
```

### Page Header
```jsx
<div className="page-header mb-0">
  <h1 className="page-title flex items-center gap-2 text-xl sm:text-2xl md:text-3xl">
    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
    <span className="truncate">{title}</span>
  </h1>
  <p className="page-description text-xs sm:text-sm">
    {description}
  </p>
</div>
```

### Button
```jsx
<Button 
  variant="outline" 
  size="default" 
  className="gap-2 h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
>
  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
  <span className="hidden xs:inline">Full Text</span>
  <span className="xs:hidden">Short</span>
</Button>
```

### Sheet/Dialog
```jsx
<SheetContent className="overflow-y-auto w-[90vw] sm:w-[400px] max-w-md">
  <SheetHeader>
    <SheetTitle className="text-base sm:text-lg">Title</SheetTitle>
    <SheetDescription className="text-xs sm:text-sm">
      Description
    </SheetDescription>
  </SheetHeader>
  
  <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
    {content}
  </div>
</SheetContent>
```

### Card Grid
```jsx
<div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
  {items.map(item => (
    <Card key={item.id} className="p-3 sm:p-4">
      {item.content}
    </Card>
  ))}
</div>
```

### Form Layout
```jsx
<form className="space-y-4 sm:space-y-5">
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
    <div className="space-y-2">
      <Label className="text-xs sm:text-sm">Label</Label>
      <Input className="h-9 sm:h-10 text-sm" />
    </div>
  </div>
  
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
    <Button className="h-9 sm:h-10 w-full sm:w-auto">Submit</Button>
    <Button variant="outline" className="h-9 sm:h-10 w-full sm:w-auto">
      Cancel
    </Button>
  </div>
</form>
```

### Table Wrapper
```jsx
<div className="scroll-container overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr>
        <th className="text-xs sm:text-sm">Header</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="text-xs sm:text-sm py-2 sm:py-3">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

## ✅ Checklist

### Before Committing
- [ ] Tested at 320px (mobile)
- [ ] Tested at 768px (tablet)
- [ ] Tested at 1024px (desktop)
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44px
- [ ] Text readable without zoom
- [ ] Images scale properly
- [ ] Buttons accessible
- [ ] Forms usable

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Screen reader compatible
- [ ] Reduced motion respected

## 🚫 Common Mistakes

### ❌ Don't
```jsx
// Skipping breakpoints
<div className="p-3 lg:p-6">

// Desktop first
<div className="text-lg md:text-base sm:text-sm">

// Fixed widths on mobile
<div className="w-[400px]">

// Too small touch targets
<button className="h-6 w-6">

// No responsive consideration
<div className="grid grid-cols-4 gap-6">
```

### ✅ Do
```jsx
// Progressive enhancement
<div className="p-3 sm:p-4 md:p-5 lg:p-6">

// Mobile first
<div className="text-sm md:text-base lg:text-lg">

// Flexible widths
<div className="w-full sm:w-[400px]">

// Adequate touch targets
<button className="h-9 w-9 sm:h-10 sm:w-10">

// Responsive grid
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
```

## 🔧 Utility Classes

### Custom Classes (src/index.css)
```css
.touch-target              /* min-h-[44px] min-w-[44px] */
.text-responsive-xs        /* text-[10px] sm:text-xs */
.text-responsive-sm        /* text-xs sm:text-sm */
.text-responsive-base      /* text-sm sm:text-base */
.padding-responsive        /* p-3 sm:p-4 md:p-5 lg:p-6 */
.spacing-responsive-sm     /* space-y-2 sm:space-y-3 md:space-y-4 */
.scroll-container          /* Custom scrollbar styling */
.table-mobile-card         /* Mobile card layout for tables */
```

## 📱 Testing Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lighthouse audit
npm run build && npx serve -s dist
# Then open Chrome DevTools > Lighthouse
```

## 🎯 Quick Tips

1. **Always mobile first** - Start with base styles, add breakpoints up
2. **Use utility classes** - Leverage custom utilities for consistency
3. **Test early** - Check responsiveness as you build
4. **Touch targets** - Minimum 44x44px for interactive elements
5. **Flexible layouts** - Use flex/grid with responsive columns
6. **Progressive enhancement** - Add features for larger screens
7. **Accessibility** - Consider keyboard, screen readers, reduced motion
8. **Performance** - Optimize images, fonts, animations

---

**Last Updated:** 2 April 2026
**Version:** 1.0
