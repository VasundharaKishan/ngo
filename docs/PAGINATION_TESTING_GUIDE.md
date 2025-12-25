# Testing Guide - Pagination Implementation

## Quick Test Checklist

### Backend Tests ✅
- [x] Run test suite: `mvn test -Dtest=DonationServicePaginationTest`
- [x] Verify all 9 tests pass
- [x] Check for SQL N+1 queries in logs (should use LEFT JOIN)

### Frontend Tests ✅
- [x] TypeScript compilation: `npx tsc --noEmit`
- [x] Dev server running: `npm run dev`
- [x] No console errors in browser

### Manual Testing (Required)
- [ ] Search functionality
- [ ] Status filtering
- [ ] Page size changes
- [ ] Pagination navigation
- [ ] Sorting columns
- [ ] URL state preservation
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling

## Detailed Test Scenarios

### 1. Search Functionality

#### Test Case 1.1: Search by Donor Name
**Steps:**
1. Navigate to http://localhost:5174/admin/donations
2. Type "john" in search box
3. Wait for debounce (300ms)

**Expected:**
- URL updates to `?q=john&page=0`
- Table shows only donations from donors with "john" in name
- Results count updates
- Loading spinner shows briefly

**Pass Criteria:**
- ✅ No console errors
- ✅ Results match search query
- ✅ Debounce works (network tab shows 1 request after 300ms, not multiple)

#### Test Case 1.2: Search by Email
**Steps:**
1. Clear previous search
2. Type "example.com" in search box
3. Wait for debounce

**Expected:**
- URL updates to `?q=example.com&page=0`
- Shows donations with "example.com" in email
- Case-insensitive matching

#### Test Case 1.3: Search by Campaign
**Steps:**
1. Clear search
2. Type "education" in search box
3. Wait for debounce

**Expected:**
- Shows donations to campaigns with "education" in title
- Campaign column matches search term

#### Test Case 1.4: Search with No Results
**Steps:**
1. Type "zzzzzzzzz" (unlikely to exist)
2. Wait for debounce

**Expected:**
- Empty state appears
- "No donations found" message
- "Clear filters" button visible

### 2. Status Filtering

#### Test Case 2.1: Filter by SUCCESS
**Steps:**
1. Clear all filters
2. Select "SUCCESS" from status dropdown

**Expected:**
- URL updates to `?status=SUCCESS&page=0`
- All rows show green "SUCCESS" badge
- Results count updates

#### Test Case 2.2: Filter by PENDING
**Steps:**
1. Select "PENDING" from status dropdown

**Expected:**
- All rows show yellow "PENDING" badge
- Different results from SUCCESS

#### Test Case 2.3: Filter by FAILED
**Steps:**
1. Select "FAILED" from status dropdown

**Expected:**
- All rows show red "FAILED" badge

#### Test Case 2.4: Return to ALL
**Steps:**
1. Select "All Status" from dropdown

**Expected:**
- URL status param removed
- Shows all donations regardless of status
- Mix of SUCCESS/PENDING/FAILED visible

### 3. Page Size Changes

#### Test Case 3.1: Change to 10 per page
**Steps:**
1. Clear all filters
2. Select "10 per page" from dropdown

**Expected:**
- URL updates to `?size=10&page=0`
- Table shows exactly 10 rows (or fewer if last page)
- Total pages increases
- "Showing 1-10 of X" displays

#### Test Case 3.2: Change to 100 per page
**Steps:**
1. Select "100 per page"

**Expected:**
- URL updates to `?size=100&page=0`
- Table shows up to 100 rows
- Total pages decreases
- "Showing 1-100 of X" displays

### 4. Pagination Navigation

#### Test Case 4.1: Navigate to Next Page
**Steps:**
1. Set page size to 10
2. Click "Next →" button

**Expected:**
- URL updates to `?page=1&size=10`
- Table shows different rows
- "Previous" button becomes enabled
- "Showing 11-20 of X" displays
- Page indicator shows "Page 2 of Y"

#### Test Case 4.2: Navigate to Last Page
**Steps:**
1. Keep clicking "Next" until disabled

**Expected:**
- "Next" button becomes disabled (grayed out)
- Cursor shows "not-allowed" on hover
- Last page may have fewer than page size items
- "Showing X-Y of Y" (where Y is total)

#### Test Case 4.3: Navigate Back to First
**Steps:**
1. From last page, click "Previous" repeatedly

**Expected:**
- Eventually reaches page 0
- "Previous" becomes disabled
- Shows first page items

### 5. Column Sorting

#### Test Case 5.1: Sort by Amount (Descending)
**Steps:**
1. Clear all filters
2. Click "Amount ⇅" header once

**Expected:**
- URL updates to `?sort=amount,desc&page=0`
- Icon changes to "Amount ↓"
- Highest amounts at top
- Resets to page 0

#### Test Case 5.2: Sort by Amount (Ascending)
**Steps:**
1. Click "Amount" header again

**Expected:**
- URL updates to `?sort=amount,asc&page=0`
- Icon changes to "Amount ↑"
- Lowest amounts at top

#### Test Case 5.3: Sort by Date (Descending - Default)
**Steps:**
1. Click "Date ⇅" header

**Expected:**
- URL updates to `?sort=createdAt,desc&page=0`
- Icon changes to "Date ↓"
- Most recent donations at top

#### Test Case 5.4: Sort by Date (Ascending)
**Steps:**
1. Click "Date" header again

**Expected:**
- URL updates to `?sort=createdAt,asc&page=0`
- Icon changes to "Date ↑"
- Oldest donations at top

### 6. URL State Preservation

#### Test Case 6.1: Bookmark and Reload
**Steps:**
1. Set filters: search="john", status=SUCCESS, sort=amount,desc, page=2, size=50
2. Copy URL from address bar
3. Open new tab
4. Paste URL

**Expected:**
- Page loads with exact same filters applied
- Same results visible
- Same pagination state
- All dropdowns/inputs show correct values

#### Test Case 6.2: Browser Back/Forward
**Steps:**
1. Start at default state
2. Search for "john"
3. Change status to SUCCESS
4. Change page size to 50
5. Click browser back button 3 times

**Expected:**
- Each back click restores previous state
- Forward button works to redo changes
- No page reloads (SPA behavior)

### 7. Combined Filters

#### Test Case 7.1: Search + Status + Sort
**Steps:**
1. Search: "education"
2. Status: SUCCESS
3. Sort: amount,desc

**Expected:**
- URL: `?q=education&status=SUCCESS&sort=amount,desc&page=0`
- Shows only SUCCESS donations to "education" campaigns
- Sorted by amount descending
- All filters work together

#### Test Case 7.2: Clear All Filters
**Steps:**
1. With filters from 7.1 active
2. Click "Clear Filters" button

**Expected:**
- URL resets to `/admin/donations` (no query params)
- Search input clears
- Status resets to "All Status"
- Page size resets to 25
- Sort resets to "createdAt,desc"
- Shows all donations

### 8. Loading States

#### Test Case 8.1: Initial Load
**Steps:**
1. Navigate to donations page
2. Observe loading state

**Expected:**
- Spinning icon appears immediately
- "Loading donations..." text visible
- Spinner disappears when data loads
- Table appears with data

#### Test Case 8.2: Filter Change Loading
**Steps:**
1. Change status filter
2. Observe loading

**Expected:**
- Brief loading spinner
- Previous data remains visible during load (optional)
- Or: loading overlay appears

### 9. Error Handling

#### Test Case 9.1: Network Error
**Steps:**
1. Stop backend server: `Ctrl+C` in backend terminal
2. Try to load donations page

**Expected:**
- Red error banner appears
- "Failed to load donations. Please try again." message
- No crash, no console spam
- Empty state or previous data visible

#### Test Case 9.2: 401 Unauthorized
**Steps:**
1. Delete `token` from localStorage: `localStorage.removeItem('token')`
2. Try to load donations page

**Expected:**
- Redirects to `/admin/login`
- No crash
- Token cleared from localStorage

### 10. Edge Cases

#### Test Case 10.1: Zero Donations
**Steps:**
1. Use filter that returns 0 results
2. Check empty state

**Expected:**
- "No donations found" message
- "Clear filters" button visible
- No errors in console

#### Test Case 10.2: Exactly One Page
**Steps:**
1. Filter to get ≤25 donations (default page size)

**Expected:**
- "Previous" and "Next" both disabled
- Shows "Page 1 of 1"
- "Showing 1-X of X" (where X < 25)

#### Test Case 10.3: Special Characters in Search
**Steps:**
1. Search for: `john@example.com`
2. Search for: `O'Brien`
3. Search for: `José`

**Expected:**
- No SQL errors
- Proper escaping
- Case-insensitive matching
- Accent-insensitive matching (if DB supports)

## Performance Tests

### Test Case P.1: Debounce Verification
**Steps:**
1. Open Network tab in DevTools
2. Type "john" quickly (all at once)
3. Observe network requests

**Expected:**
- Only 1 request sent after 300ms
- Not 4 requests (one per letter)

### Test Case P.2: Large Dataset
**Steps:**
1. Create 1000+ donation records (use backend script or SQL)
2. Load donations page

**Expected:**
- Still loads within 500ms
- No UI lag
- Pagination works smoothly
- No memory leaks (check DevTools)

### Test Case P.3: Rapid Filter Changes
**Steps:**
1. Rapidly change status: ALL → SUCCESS → PENDING → FAILED
2. Rapidly change page size: 10 → 25 → 50 → 100
3. Observe behavior

**Expected:**
- Only latest request matters
- Previous requests ignored or cancelled
- No race conditions (wrong data shown)
- UI remains responsive

## Browser Compatibility Tests

### Chrome/Edge
- [ ] Test all scenarios above
- [ ] Check DevTools console for errors
- [ ] Verify responsiveness (resize window)

### Firefox
- [ ] Repeat key scenarios
- [ ] Check for layout differences
- [ ] Test back/forward buttons

### Safari
- [ ] Repeat key scenarios
- [ ] Test on macOS and iOS
- [ ] Check for date formatting issues

## Accessibility Tests

### Keyboard Navigation
**Steps:**
1. Tab through all controls
2. Use Enter to activate buttons
3. Use Space to toggle dropdowns
4. Use arrow keys in dropdowns

**Expected:**
- All controls reachable via Tab
- Clear focus indicators (blue glow)
- Logical tab order
- No keyboard traps

### Screen Reader (Optional)
**Steps:**
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate page with screen reader

**Expected:**
- Status badges announced correctly
- Sort indicators announced
- Button states announced (disabled/enabled)
- Table structure clear

## Backend Performance Tests

### Test Case B.1: Query Optimization
**Steps:**
1. Enable SQL logging: Set `logging.level.org.hibernate.SQL=DEBUG`
2. Load donations page
3. Check logs

**Expected:**
- Only 2 queries per request:
  1. `SELECT ... FROM donations LEFT JOIN campaigns` (with pagination)
  2. `SELECT COUNT(*) FROM donations LEFT JOIN campaigns`
- No N+1 queries (multiple queries per row)
- Uses indexes (check EXPLAIN PLAN)

### Test Case B.2: Response Time
**Steps:**
1. Use DevTools Network tab
2. Note API response times

**Expected:**
- `/api/admin/donations?page=0&size=25` < 500ms
- `/api/admin/donations?q=john&...` < 1000ms (includes search)
- Consistent times across multiple requests

## Regression Tests

### Test Case R.1: Legacy Endpoint Still Works
**Steps:**
1. Use curl or Postman
2. Call: `GET /api/admin/donations` (no page param)

**Expected:**
- Returns array (not paginated object)
- All donations returned
- No errors

### Test Case R.2: Other Admin Pages Unaffected
**Steps:**
1. Visit `/admin/dashboard`
2. Visit `/admin/campaigns`
3. Visit `/admin/categories`

**Expected:**
- All pages load normally
- No JavaScript errors
- No styling issues
- No broken functionality

## Test Data Setup

### Minimal Test Data
```sql
-- Create at least 50 donations for testing
-- Mix of SUCCESS/PENDING/FAILED
-- Various amounts and dates
-- Multiple campaigns
```

### Script to Generate Test Data
```bash
# Run this in backend terminal
cd foundation-backend
./generate-test-donations.sh
```

## Automated Testing (Future)

### Unit Tests (Frontend)
```typescript
// src/hooks/useDebounce.test.ts
// src/hooks/usePaginationParams.test.ts
// src/pages/Donations.test.tsx
```

### Integration Tests (Backend)
```java
// DonationServicePaginationTest.java (already exists)
// AdminDonationControllerTest.java (create new)
```

### E2E Tests (Playwright/Cypress)
```typescript
// e2e/admin-donations-pagination.spec.ts
test('should filter donations by status', async ({ page }) => {
  // ...
});
```

## Test Results Template

```markdown
## Test Run: [Date]
**Tester**: [Name]
**Environment**: [Local/Staging/Production]
**Browser**: [Chrome 120, Firefox 121, etc.]

### Results
- [ ] Search functionality: PASS/FAIL
- [ ] Status filtering: PASS/FAIL
- [ ] Page size changes: PASS/FAIL
- [ ] Pagination navigation: PASS/FAIL
- [ ] Sorting columns: PASS/FAIL
- [ ] URL state: PASS/FAIL
- [ ] Loading states: PASS/FAIL
- [ ] Error handling: PASS/FAIL
- [ ] Edge cases: PASS/FAIL
- [ ] Performance: PASS/FAIL

### Issues Found
1. [Description]
2. [Description]

### Notes
[Any observations]
```

## Common Issues and Solutions

### Issue: Debounce not working
**Symptom**: Multiple API requests per keystroke
**Solution**: Check useDebounce hook implementation, verify delay parameter

### Issue: URL not updating
**Symptom**: Filters change but URL stays the same
**Solution**: Check usePaginationParams hook, verify setSearchParams calls

### Issue: Empty state shows with data
**Symptom**: "No donations found" but data exists
**Solution**: Check response parsing, verify items array in DonationPageResponse

### Issue: Pagination buttons always disabled
**Symptom**: Can't navigate pages
**Solution**: Check totalPages calculation, verify page < totalPages logic

### Issue: Sort icon not updating
**Symptom**: Icon stays as ⇅ after clicking
**Solution**: Check getSortIcon logic, verify sort state updates

## Test Completion Checklist

- [ ] All manual test cases executed
- [ ] All tests passed or issues documented
- [ ] Performance within acceptable range
- [ ] No console errors observed
- [ ] Tested on multiple browsers
- [ ] Tested on mobile (responsive)
- [ ] Accessibility verified
- [ ] Backend tests passing
- [ ] Frontend TypeScript clean
- [ ] Ready for production deployment

---

**Last Updated**: 2024-12-23
**Test Suite Version**: 1.0
**Status**: Ready for Testing
