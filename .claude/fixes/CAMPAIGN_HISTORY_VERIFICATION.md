# Campaign History Fix - Verification Checklist

## Pre-Deployment Verification

### Code Review
- [x] `GetExecutionHistoryUseCase.ts` updated with new query
- [x] Query filters by `emails_sent > 0` instead of `new_tracks = 1`
- [x] Query uses `COALESCE` for fallback values
- [x] `ExecutionHistory.tsx` handles empty URLs gracefully
- [x] No breaking changes to existing interfaces

### Logic Verification
- [x] SoundCloud tracks still appear (backward compatible)
- [x] Custom campaigns now included (bug fix)
- [x] Execution logs with `track_id = null` are fetched
- [x] UI shows "Custom Campaign" label when no URL exists

---

## Post-Deployment Testing

### Test Case 1: Send Custom Campaign

**Steps:**
1. Navigate to `/dashboard?tab=engagement`
2. Click "Send Custom Email" button
3. Fill in:
   - Subject: "Test Custom Campaign"
   - Greeting: "Hello!"
   - Message: "This is a test campaign"
   - Signature: "Best regards"
4. Click "Send Now"
5. Wait for success message

**Expected Results:**
- ✅ Success message appears: "Email enviado a X contacto(s)"
- ✅ Campaign appears in "Campaign History" section
- ✅ Title shows: "Campaign: Test Custom Campaign"
- ✅ Label shows: "CUSTOM CAMPAIGN" (not "Listen Track" button)
- ✅ Stats appear: Delivered, Opens, Clicks, Bounced

**Database Verification:**
```sql
-- Check execution_logs
SELECT id, executed_at, new_tracks, emails_sent, track_id, track_title
FROM execution_logs
WHERE track_title LIKE '%Test Custom Campaign%'
ORDER BY executed_at DESC
LIMIT 1;

-- Expected:
-- track_id: NULL
-- track_title: "Campaign: Test Custom Campaign"
-- new_tracks: 0
-- emails_sent: > 0
```

---

### Test Case 2: Send SoundCloud Track (Regression Test)

**Steps:**
1. Navigate to `/dashboard?tab=engagement`
2. Scroll to "Quick-send Tracks" section
3. Click "Send" on any track
4. Wait for success message

**Expected Results:**
- ✅ Success message appears
- ✅ Track appears in "Campaign History" section
- ✅ Title shows: Track name (e.g., "My New Track")
- ✅ Button shows: "Listen Track" (clickable link)
- ✅ Stats appear: Delivered, Opens, Clicks, Bounced

**Database Verification:**
```sql
-- Check execution_logs
SELECT id, executed_at, new_tracks, emails_sent, track_id, track_title
FROM execution_logs
WHERE new_tracks = 1
ORDER BY executed_at DESC
LIMIT 1;

-- Expected:
-- track_id: "123456789" (SoundCloud ID)
-- track_title: Track name
-- new_tracks: 1
-- emails_sent: > 0
```

---

### Test Case 3: Send Draft Campaign

**Steps:**
1. Navigate to `/dashboard?tab=engagement`
2. Click "Send Custom Email" button
3. Fill in campaign details
4. Click "Save as Draft" (not "Send Now")
5. Wait for success message
6. Refresh page
7. Find draft in "Saved Drafts" section
8. Click "Send" on the draft
9. Confirm send

**Expected Results:**
- ✅ Draft saved successfully
- ✅ Draft appears in "Saved Drafts" section
- ✅ After sending, success message appears
- ✅ Draft disappears from "Saved Drafts"
- ✅ Campaign appears in "Campaign History"
- ✅ Label shows: "CUSTOM CAMPAIGN"

**Database Verification:**
```sql
-- Check email_campaigns
SELECT id, subject, status, sent_at
FROM email_campaigns
WHERE subject = '<your-draft-subject>'
ORDER BY created_at DESC
LIMIT 1;

-- Before send:
-- status: 'draft'
-- sent_at: NULL

-- After send:
-- status: 'sent'
-- sent_at: <timestamp>
```

---

### Test Case 4: History Display (UI)

**Steps:**
1. Navigate to `/dashboard?tab=overview`
2. Scroll to "Campaign History" section (should show last 5)
3. Navigate to `/dashboard?tab=engagement`
4. Scroll to bottom "Campaign History" section (should show all)

**Expected Results:**
- ✅ Both SoundCloud tracks and custom campaigns visible
- ✅ SoundCloud tracks show "Listen Track" button
- ✅ Custom campaigns show "CUSTOM CAMPAIGN" label
- ✅ All campaigns show stats (delivered, opened, clicked, bounced)
- ✅ Campaigns ordered by `executed_at DESC` (most recent first)
- ✅ No JavaScript errors in console
- ✅ No broken links or 404s

---

### Test Case 5: Empty State

**Steps:**
1. Create a fresh test account (or use account with no history)
2. Navigate to `/dashboard?tab=engagement`
3. Scroll to "Campaign History" section

**Expected Results:**
- ✅ Shows empty state message: "No campaigns yet"
- ✅ Shows subtitle: "Your sent history will appear here"
- ✅ No loading spinner stuck
- ✅ No errors in console

---

## Edge Cases

### Edge Case 1: Campaign with `emails_sent = 0`

**Scenario:** Campaign logged but no emails actually sent (all failed)

**Expected:**
- Campaign should NOT appear in history (filter: `emails_sent > 0`)

**Database Setup:**
```sql
INSERT INTO execution_logs (new_tracks, emails_sent, track_id, track_title)
VALUES (0, 0, NULL, 'Campaign: Failed Campaign');
```

**Verification:**
- Navigate to dashboard
- **Expected:** Campaign does NOT appear in history

---

### Edge Case 2: Campaign with Missing Title

**Scenario:** Execution log with `track_title = NULL`

**Expected:**
- Title shows: "Untitled Campaign" (COALESCE fallback)

**Database Setup:**
```sql
INSERT INTO execution_logs (new_tracks, emails_sent, track_id, track_title)
VALUES (0, 5, NULL, NULL);
```

**Verification:**
- Navigate to dashboard
- **Expected:** Campaign appears with title "Untitled Campaign"

---

### Edge Case 3: SoundCloud Track Deleted from `soundcloud_tracks`

**Scenario:** Execution log references track_id, but track no longer in database

**Expected:**
- Title shows: Track title from `execution_logs.track_title`
- URL shows: Empty (no link)
- Label shows: "CUSTOM CAMPAIGN"

**Database Setup:**
```sql
-- Create execution log
INSERT INTO execution_logs (new_tracks, emails_sent, track_id, track_title)
VALUES (1, 5, 'deleted-track-id', 'Deleted Track');

-- Don't insert into soundcloud_tracks (simulates deletion)
```

**Verification:**
- Navigate to dashboard
- **Expected:** Campaign appears with title "Deleted Track" and no link

---

## Performance Testing

### Query Performance

**Test:** Verify execution history query performs well with large dataset

**Steps:**
1. Insert 1000 execution logs:
   ```sql
   INSERT INTO execution_logs (new_tracks, emails_sent, track_id, track_title)
   SELECT
     0,
     FLOOR(RANDOM() * 100) + 1,
     CASE WHEN RANDOM() > 0.5 THEN NULL ELSE 'track-' || generate_series END,
     'Campaign ' || generate_series
   FROM generate_series(1, 1000);
   ```
2. Open dashboard and check "Campaign History"
3. Measure load time (should be < 1 second)

**Expected:**
- ✅ Query returns in < 500ms
- ✅ Page loads without freezing
- ✅ No timeout errors

**Optimization Check:**
- Verify index exists: `CREATE INDEX idx_execution_logs_executed_at ON execution_logs(executed_at DESC);`
- Verify LIMIT 20 is applied (not fetching all 1000 rows)

---

## Rollback Plan

If the fix causes issues:

### Immediate Rollback

**Revert GetExecutionHistoryUseCase:**
```typescript
// Restore original query
const result = await sql`
  SELECT
    st.track_id,
    st.title,
    st.url,
    st.published_at,
    st.cover_image,
    st.description,
    st.created_at,
    el.emails_sent,
    el.duration_ms,
    el.executed_at
  FROM soundcloud_tracks st
  LEFT JOIN execution_logs el ON el.executed_at >= st.created_at
  WHERE el.new_tracks = 1
  ORDER BY el.executed_at DESC
  LIMIT 20
`;
```

**Revert ExecutionHistory.tsx:**
```tsx
// Restore original button
<a href={item.url} target="_blank" rel="noreferrer">
  <Button variant="secondary" size="xs">
    Listen Track
  </Button>
</a>
```

---

## Success Criteria

Fix is considered successful if:

- ✅ All test cases pass
- ✅ No regression in SoundCloud track functionality
- ✅ Custom campaigns appear in history
- ✅ No JavaScript errors in console
- ✅ No 404s or broken links
- ✅ Performance remains acceptable (< 1s load time)
- ✅ No user-reported issues after 24 hours

---

## Sign-off

**Tested By:** _________________
**Date:** _________________
**Environment:** Production / Staging
**Result:** Pass / Fail
**Notes:**

---

**Status:** Ready for deployment
**Confidence:** High (backward compatible, no breaking changes)
**Risk Level:** Low (query change only, UI fallback added)
