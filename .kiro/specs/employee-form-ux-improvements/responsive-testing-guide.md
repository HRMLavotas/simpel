# Responsive Layout Testing Guide
## Employee Form Modal - Manual Testing Instructions

This guide provides step-by-step instructions for manually testing the responsive layout of the Employee Form Modal.

---

## Quick Start

### Using Browser DevTools

1. **Open the Application**
   - Navigate to the Employees page
   - Click "Tambah Pegawai" or edit an existing employee

2. **Open DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

3. **Enable Device Toolbar**
   - Press `Ctrl+Shift+M` (Windows/Linux)
   - Press `Cmd+Shift+M` (Mac)
   - Or click the device icon in DevTools

---

## Test Scenarios

### 📱 Test 1: Mobile View (<640px)

**Viewport Settings:**
- Width: 375px (iPhone SE)
- Width: 390px (iPhone 12/13)
- Width: 414px (iPhone 14 Pro Max)

**Expected Behavior:**
```
✅ Modal width: ~356px (95% of 375px)
✅ Single column layout (fields stack vertically)
✅ Tabs: 3 equal-width buttons, horizontally arranged
✅ All fields full-width within container
✅ No horizontal scrolling
✅ Vertical scrolling enabled when content exceeds screen
```

**Testing Steps:**
1. Set viewport to 375px width
2. Open Employee Form Modal
3. Verify modal takes 95% of screen width
4. Check "Data Utama" tab:
   - Fields should be in single column
   - NIP and Name fields stack vertically
   - All fields full-width
5. Switch to "Riwayat" tab:
   - Verify tab switches correctly
   - History sections remain readable
6. Switch to "Keterangan" tab:
   - Notes sections remain usable
7. Scroll through entire form:
   - No horizontal scrolling should occur
   - Vertical scrolling should be smooth

**Screenshot Checkpoints:**
- [ ] Modal at 375px width
- [ ] Single column layout visible
- [ ] Tab navigation at mobile size

---

### 📱 Test 2: Tablet View (640px-1024px)

**Viewport Settings:**
- Width: 768px (iPad Mini)
- Width: 820px (iPad Air)
- Width: 1024px (iPad Pro)

**Expected Behavior:**
```
✅ Modal width: ~730px (95% of 768px) or max 768px
✅ Two column layout (fields side-by-side)
✅ Tabs: 3 equal-width buttons, comfortable spacing
✅ Grid layout: 2 columns with gap-4
✅ No horizontal scrolling
✅ Comfortable reading width
```

**Testing Steps:**
1. Set viewport to 768px width
2. Open Employee Form Modal
3. Verify modal width (should be ~730px)
4. Check "Data Utama" tab:
   - NIP and Name fields side-by-side
   - Gelar Depan and Gelar Belakang side-by-side
   - All field pairs in 2-column grid
5. Verify spacing:
   - Gap between columns should be visible
   - Fields not cramped
6. Test at 1024px:
   - Modal should cap at 768px max-width
   - Centered on screen

**Screenshot Checkpoints:**
- [ ] Modal at 768px width
- [ ] Two column layout visible
- [ ] Modal centered at 1024px

---

### 🖥️ Test 3: Desktop View (>1024px)

**Viewport Settings:**
- Width: 1280px (Laptop)
- Width: 1920px (Desktop)
- Width: 2560px (Large Monitor)

**Expected Behavior:**
```
✅ Modal width: 768px (max-w-3xl constraint)
✅ Modal centered on screen
✅ Two column layout maintained
✅ Tabs: 3 equal-width buttons
✅ Optimal reading width
✅ No excessive whitespace in modal
```

**Testing Steps:**
1. Set viewport to 1920px width
2. Open Employee Form Modal
3. Verify modal is exactly 768px wide
4. Verify modal is centered horizontally
5. Check layout consistency:
   - Same 2-column layout as tablet
   - No layout shifts from tablet view
6. Verify max-height constraint:
   - Modal should not exceed 90% of viewport height
   - Scroll should appear if content is tall

**Screenshot Checkpoints:**
- [ ] Modal centered at 1920px
- [ ] Width capped at 768px
- [ ] Consistent layout with tablet

---

## Test 4: Tab Navigation Accessibility

**Test on ALL screen sizes (375px, 768px, 1920px)**

**Expected Behavior:**
```
✅ Tabs always visible and accessible
✅ Equal width distribution
✅ Active tab clearly indicated
✅ Smooth tab switching
✅ Content changes when tab clicked
✅ No layout shift during tab switch
```

**Testing Steps:**
1. Open Employee Form Modal
2. Click "Data Utama" tab:
   - Should show main data sections
   - Tab should be highlighted
3. Click "Riwayat" tab:
   - Should show history sections
   - Previous content should hide
   - Tab should be highlighted
4. Click "Keterangan" tab:
   - Should show notes sections
   - Tab should be highlighted
5. Verify on mobile (375px):
   - Tabs should not wrap to multiple lines
   - All 3 tabs visible
   - Touch targets adequate (not too small)

**Keyboard Testing:**
1. Tab to the tab list
2. Use arrow keys to navigate between tabs
3. Press Enter/Space to activate tab
4. Verify keyboard navigation works on all screen sizes

---

## Test 5: Modal Height and Scrolling

**Test with different viewport heights**

**Viewport Settings:**
- Height: 600px (Short laptop)
- Height: 800px (Standard laptop)
- Height: 1080px (Desktop)

**Expected Behavior:**
```
✅ Modal max-height: 90% of viewport height
✅ Vertical scrolling when content exceeds height
✅ Scroll indicator visible when scrollable
✅ Smooth scrolling behavior
✅ Header remains visible while scrolling
```

**Testing Steps:**
1. Set viewport to 1920x600 (wide but short)
2. Open Employee Form Modal
3. Verify modal height is ~540px (90% of 600px)
4. Verify scroll bar appears
5. Scroll through form:
   - Header should remain visible
   - Content should scroll smoothly
6. Test at 1920x1080:
   - Modal may not need scrolling if content fits
   - Should still respect max-height

---

## Test 6: Form Field Usability

**Test on minimum supported width (640px)**

**Expected Behavior:**
```
✅ All fields accessible and usable
✅ Input fields have adequate width
✅ Dropdowns open correctly
✅ Date pickers functional
✅ Labels fully visible
✅ Help text readable
✅ Error messages visible
```

**Testing Steps:**
1. Set viewport to exactly 640px width
2. Open Employee Form Modal
3. Test each field type:
   - Text input (Name): Type text, verify visible
   - Select dropdown (Status ASN): Open, select option
   - Date input (Tanggal Lahir): Open picker, select date
4. Trigger validation error:
   - Leave Name field empty
   - Try to submit
   - Verify error message visible and readable
5. Test warning messages:
   - Change Golongan/Pangkat
   - Verify warning appears below field
   - Verify warning text readable

---

## Test 7: Edge Cases

### Very Narrow Screens (<375px)
**Viewport:** 320px (iPhone SE 1st gen)

**Expected Behavior:**
- Modal should still be usable
- May require more scrolling
- Fields should not break layout

**Testing Steps:**
1. Set viewport to 320px
2. Open form
3. Verify no horizontal scrolling
4. Verify all fields accessible

### Very Tall Content
**Scenario:** Add many history entries

**Testing Steps:**
1. Open form with employee that has 10+ history entries
2. Navigate to "Riwayat" tab
3. Verify scrolling works
4. Verify modal doesn't exceed 90vh

### Landscape Mobile
**Viewport:** 667x375 (iPhone landscape)

**Expected Behavior:**
- Modal should adapt to landscape
- May show more content vertically
- Tabs should remain accessible

---

## Browser-Specific Testing

### Chrome/Edge (Chromium)
- [ ] Test all scenarios above
- [ ] Verify smooth scrolling
- [ ] Check DevTools responsive mode

### Firefox
- [ ] Test all scenarios above
- [ ] Verify layout consistency
- [ ] Check responsive design mode

### Safari (Desktop)
- [ ] Test all scenarios above
- [ ] Verify modal rendering
- [ ] Check responsive mode

### Mobile Browsers (Real Devices)
- [ ] iOS Safari (iPhone)
- [ ] Chrome (Android)
- [ ] Test touch interactions
- [ ] Verify native select behavior

---

## Common Issues to Watch For

### ❌ Layout Issues
- Horizontal scrolling on mobile
- Fields cut off or hidden
- Tabs wrapping to multiple lines
- Modal exceeding viewport

### ❌ Interaction Issues
- Dropdowns not opening
- Date pickers not functional
- Tabs not clickable
- Scroll not working

### ❌ Visual Issues
- Text too small to read
- Insufficient spacing
- Overlapping elements
- Misaligned fields

---

## Reporting Issues

If you find any issues during testing, document:

1. **Screen Size:** Exact viewport dimensions
2. **Browser:** Name and version
3. **Issue:** Clear description
4. **Expected:** What should happen
5. **Actual:** What actually happens
6. **Screenshot:** Visual evidence

**Example Issue Report:**
```
Screen Size: 375x667
Browser: Chrome 120
Issue: Tabs wrapping to two lines
Expected: All 3 tabs on single line
Actual: "Keterangan" tab wraps to second line
Screenshot: [attached]
```

---

## Success Criteria

All tests pass when:

- ✅ No horizontal scrolling on any screen size
- ✅ All fields accessible and usable
- ✅ Tabs work on all screen sizes
- ✅ Modal respects width/height constraints
- ✅ Layout adapts correctly at breakpoints
- ✅ No visual glitches or overlaps
- ✅ Smooth scrolling and interactions

---

## Quick Reference: Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | <640px | 1 column |
| Tablet | 640-1024px | 2 columns |
| Desktop | >1024px | 2 columns (max 768px) |

**Modal Constraints:**
- Width: `95vw` (max `768px`)
- Height: `90vh` (max)
- Overflow: Vertical scroll

---

**Testing Duration:** ~30 minutes for complete manual test
**Recommended Frequency:** After any layout changes
**Last Updated:** 2024
