# Panduan Responsive Design - SIMPEL

## 📱 Breakpoint System

### Tailwind Breakpoints (Custom)
```css
xs:  475px  /* Extra small devices (large phones) */
sm:  640px  /* Small devices (landscape phones) */
md:  768px  /* Medium devices (tablets) */
lg:  1024px /* Large devices (desktops) */
xl:  1280px /* Extra large devices */
2xl: 1400px /* 2X large devices */
```

### Usage Strategy
```jsx
// Mobile First Approach
<div className="text-sm md:text-base lg:text-lg">
  // Base: mobile (320px+)
  // md: tablet (768px+)
  // lg: desktop (1024px+)
</div>
```

## 🎨 Responsive Utilities

### Typography
```jsx
// Responsive text sizes
<p className="text-xs sm:text-sm md:text-base">
<h1 className="text-xl sm:text-2xl md:text-3xl">
<h2 className="text-lg sm:text-xl md:text-2xl">

// Custom utility classes
<p className="text-responsive-sm">  // text-xs sm:text-sm
<h1 className="text-responsive-2xl"> // text-xl sm:text-2xl md:text-3xl
```

### Spacing
```jsx
// Responsive padding
<div className="p-3 sm:p-4 md:p-5 lg:p-6">
<div className="padding-responsive"> // utility class

// Responsive gaps
<div className="gap-3 sm:gap-4 md:gap-5 lg:gap-6">
<div className="space-y-2 sm:space-y-3 md:space-y-4">
```

### Grid Layouts
```jsx
// Dashboard stats grid
<div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">

// Chart grid
<div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">

// Form grid
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

### Touch Targets
```jsx
// Minimum 44x44px for accessibility
<Button className="h-9 sm:h-10 touch-target">
<button className="min-h-[44px] min-w-[44px]">
```

## 📊 Component Patterns

### StatCard (Dashboard)
```jsx
<StatCard 
  title="Total Pegawai"
  value={stats.total}
  icon={Users}
  variant="primary"
/>

// Responsive features:
// - Icon: h-10 w-10 sm:h-12 sm:w-12
// - Title: text-xs sm:text-sm
// - Value: text-xl sm:text-2xl md:text-3xl
// - Description: text-[10px] sm:text-xs
```

### AppLayout
```jsx
<AppLayout>
  {children}
</AppLayout>

// Responsive features:
// - Header: h-14 sm:h-16
// - Padding: p-3 sm:p-4 md:p-5 lg:p-6
// - Sidebar offset: lg:pl-64
```

### AppSidebar
```jsx
<AppSidebar 
  mobileOpen={mobileOpen}
  onMobileClose={() => setMobileMenuOpen(false)}
/>

// Responsive features:
// - Desktop: hidden lg:flex lg:w-64
// - Mobile: drawer w-[280px] xs:w-72
// - Collapsed state for desktop
// - Touch-friendly navigation items
```

### Sheet/Dialog
```jsx
<SheetContent className="w-[90vw] sm:w-[400px] max-w-md">
  {content}
</SheetContent>

// Responsive features:
// - Mobile: 90% viewport width
// - Desktop: fixed 400px
// - Max width constraint
```

## 🔧 CSS Utilities

### Scroll Container
```jsx
<div className="scroll-container overflow-x-auto">
  <table>...</table>
</div>

// Features:
// - Custom scrollbar styling
// - Touch-friendly scrolling
// - Visual scroll indicators
```

### Mobile Table Pattern
```jsx
<table className="table-mobile-card">
  <thead>...</thead>
  <tbody>
    <tr>
      <td data-label="Nama">John Doe</td>
      <td data-label="NIP">123456</td>
    </tr>
  </tbody>
</table>

// Mobile: Card layout with labels
// Desktop: Standard table
```

## 🎯 Best Practices

### 1. Mobile First
```jsx
// ✅ Good
<div className="text-sm md:text-base lg:text-lg">

// ❌ Bad
<div className="text-lg md:text-base sm:text-sm">
```

### 2. Consistent Breakpoints
```jsx
// ✅ Good - Progressive enhancement
<div className="p-3 sm:p-4 md:p-5 lg:p-6">

// ❌ Bad - Skipping breakpoints
<div className="p-3 lg:p-6">
```

### 3. Touch Targets
```jsx
// ✅ Good - Minimum 44x44px
<Button className="h-10 w-10 sm:h-12 sm:w-12">

// ❌ Bad - Too small for touch
<Button className="h-6 w-6">
```

### 4. Text Truncation
```jsx
// ✅ Good - Responsive truncation
<p className="truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">

// ❌ Bad - Fixed truncation
<p className="truncate max-w-[200px]">
```

### 5. Flexible Layouts
```jsx
// ✅ Good - Flex with wrap
<div className="flex flex-col sm:flex-row gap-3">

// ❌ Bad - Fixed direction
<div className="flex flex-row gap-3">
```

## 📱 Testing Checklist

### Device Sizes to Test
- [ ] 320px - iPhone SE (portrait)
- [ ] 375px - iPhone 12/13 (portrait)
- [ ] 414px - iPhone 12/13 Pro Max (portrait)
- [ ] 768px - iPad (portrait)
- [ ] 1024px - iPad (landscape)
- [ ] 1280px - Desktop
- [ ] 1920px - Large desktop

### Features to Verify
- [ ] No horizontal scroll at any breakpoint
- [ ] Touch targets minimum 44x44px
- [ ] Text readable without zoom
- [ ] Images scale properly
- [ ] Forms usable on mobile
- [ ] Tables accessible on mobile
- [ ] Navigation works on all devices
- [ ] Modals/dialogs fit screen
- [ ] Charts render correctly
- [ ] Loading states visible

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast ratio > 4.5:1
- [ ] Focus indicators visible
- [ ] Reduced motion respected
- [ ] Touch targets adequate
- [ ] Alt text for images
- [ ] ARIA labels present

## 🚀 Performance Tips

### 1. Lazy Load Images
```jsx
<img loading="lazy" src="..." alt="..." />
```

### 2. Optimize Fonts
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

### 3. Reduce Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4. Efficient Grids
```jsx
// Use CSS Grid for complex layouts
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

// Use Flexbox for simple layouts
<div className="flex flex-wrap gap-4">
```

## 🎨 Design Tokens

### Spacing Scale
```
3  = 0.75rem (12px)
4  = 1rem    (16px)
5  = 1.25rem (20px)
6  = 1.5rem  (24px)
8  = 2rem    (32px)
10 = 2.5rem  (40px)
```

### Font Sizes
```
xs   = 0.75rem  (12px)
sm   = 0.875rem (14px)
base = 1rem     (16px)
lg   = 1.125rem (18px)
xl   = 1.25rem  (20px)
2xl  = 1.5rem   (24px)
3xl  = 1.875rem (30px)
```

## 📚 Resources

### Documentation
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev Responsive](https://web.dev/responsive-web-design-basics/)

### Tools
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- BrowserStack for real device testing
- Lighthouse for performance audit

### Testing
```bash
# Run Lighthouse audit
npm run build
npx serve -s dist
# Open Chrome DevTools > Lighthouse > Mobile
```

## 🔄 Migration Guide

### Converting Non-Responsive to Responsive

#### Before
```jsx
<div className="p-6 text-base">
  <h1 className="text-3xl">Title</h1>
  <div className="grid grid-cols-4 gap-6">
    {items.map(item => <Card key={item.id} />)}
  </div>
</div>
```

#### After
```jsx
<div className="p-3 sm:p-4 md:p-5 lg:p-6 text-sm sm:text-base">
  <h1 className="text-xl sm:text-2xl md:text-3xl">Title</h1>
  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
    {items.map(item => <Card key={item.id} />)}
  </div>
</div>
```

## ✅ Implementation Status

### Completed
- ✅ Dashboard responsive grid
- ✅ StatCard mobile optimization
- ✅ AppLayout responsive padding
- ✅ AppSidebar mobile drawer
- ✅ Touch target optimization
- ✅ Typography scaling
- ✅ Custom breakpoints (xs)
- ✅ Utility classes
- ✅ Reduced motion support
- ✅ Scroll indicators

### In Progress
- 🔄 Table mobile view
- 🔄 Form responsive layouts
- 🔄 Chart mobile optimization

### Planned
- 📋 Employee list mobile cards
- 📋 Form modal responsive
- 📋 Data builder mobile view
- 📋 Import pages mobile
