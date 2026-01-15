# Campaign History Fix

## Problem

After sending a custom campaign (e.g., "Easy Now"), it doesn't appear in the campaign history/sent campaigns list on the dashboard.

**Symptoms:**
- Campaign sent successfully
- Emails delivered
- Campaign status updated to 'sent' in database
- But campaign doesn't show in ExecutionHistory component

---

## Root Cause Analysis

### Issue 1: Execution History Query Only Fetches SoundCloud Tracks

**File:** `/Users/user/Code/backstage.app/domain/services/GetExecutionHistoryUseCase.ts`

**Original Query (BROKEN):**
```sql
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
WHERE el.new_tracks = 1  -- ❌ PROBLEM: Only shows SoundCloud tracks
ORDER BY el.executed_at DESC
LIMIT 20
```

**Why this breaks:**
1. Query starts from `soundcloud_tracks` table
2. Filters for `el.new_tracks = 1` (only SoundCloud track sends)
3. Custom campaigns have `new_tracks = 0` and `track_id = null`
4. **Result:** Custom campaigns are logged but never appear in history

### Issue 2: SendDraftUseCase Logs with `new_tracks = 0`

**File:** `/Users/user/Code/backstage.app/domain/services/SendDraftUseCase.ts` (line 390-396)

```typescript
await this.executionLogRepository.create({
  newTracks: 0,        // ❌ Custom campaigns logged with 0
  emailsSent,
  durationMs: Date.now() - startTime,
  trackId: null,       // ❌ No track_id for custom campaigns
  trackTitle: `Campaign: ${subject}`
});
```

**Why this works this way:**
- Custom campaigns are NOT SoundCloud tracks
- `newTracks: 0` is correct (no new tracks discovered)
- `trackId: null` is correct (no SoundCloud track associated)
- **But:** The history query filters these out!

---

## Solution Implemented

### Fix 1: Update Execution History Query

**File:** `/Users/user/Code/backstage.app/domain/services/GetExecutionHistoryUseCase.ts`

**New Query (FIXED):**
```sql
SELECT
  COALESCE(el.track_id, 'campaign-' || el.id) as track_id,
  COALESCE(st.title, el.track_title, 'Untitled Campaign') as title,
  COALESCE(st.url, '') as url,
  COALESCE(st.published_at, el.executed_at) as published_at,
  st.cover_image,
  st.description,
  el.emails_sent,
  el.duration_ms,
  el.executed_at
FROM execution_logs el
LEFT JOIN soundcloud_tracks st ON st.track_id = el.track_id
WHERE el.emails_sent > 0  -- ✅ Show ALL campaigns that sent emails
ORDER BY el.executed_at DESC
LIMIT 20
```

**Key Changes:**
1. **Start from `execution_logs`** instead of `soundcloud_tracks`
2. **Left join `soundcloud_tracks`** (optional, may be null for custom campaigns)
3. **Filter by `emails_sent > 0`** instead of `new_tracks = 1`
4. **Use `COALESCE`** to fallback to execution log data when track data is missing:
   - `track_id`: Use `'campaign-' || el.id` for custom campaigns
   - `title`: Use `el.track_title` for custom campaigns
   - `url`: Empty string for custom campaigns (no SoundCloud URL)
   - `published_at`: Use `el.executed_at` for custom campaigns

**Result:**
- ✅ SoundCloud track sends appear (with full track info)
- ✅ Custom campaign sends appear (with campaign info from execution_logs)
- ✅ All sent campaigns shown in chronological order

### Fix 2: Update ExecutionHistory Component

**File:** `/Users/user/Code/backstage.app/components/dashboard/ExecutionHistory.tsx`

**Before:**
```tsx
<a href={item.url} target="_blank" rel="noreferrer">
  <Button variant="secondary" size="xs">
    Listen Track
  </Button>
</a>
```

**After:**
```tsx
{item.url ? (
  <a href={item.url} target="_blank" rel="noreferrer">
    <Button variant="secondary" size="xs">
      Listen Track
    </Button>
  </a>
) : (
  <div className="px-3 py-1 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
    Custom Campaign
  </div>
)}
```

**Why:**
- Custom campaigns don't have a SoundCloud URL
- Show "Custom Campaign" label instead of broken link
- Prevents UI error when `item.url` is empty

---

## Testing Verification

### Manual Test Steps

1. **Send a custom campaign:**
   ```bash
   # Navigate to dashboard
   # Click "Send Custom Email"
   # Fill subject, greeting, message, signature
   # Click "Send Now"
   ```

2. **Verify in execution_logs:**
   ```sql
   SELECT id, executed_at, new_tracks, emails_sent, track_id, track_title
   FROM execution_logs
   WHERE track_id IS NULL
   ORDER BY executed_at DESC
   LIMIT 5;
   ```

   **Expected:**
   - `track_id`: `NULL`
   - `track_title`: `"Campaign: Easy Now"` (or your subject)
   - `new_tracks`: `0`
   - `emails_sent`: `> 0`

3. **Check dashboard:**
   - Navigate to Dashboard > Overview or Engagement tab
   - **Expected:** Campaign appears in "Campaign History" section
   - Title shows: "Campaign: Easy Now"
   - Button shows: "Custom Campaign" (not "Listen Track")
   - Stats show: delivered, opened, clicked, bounced

### Database State Verification

**Check execution_logs table:**
```sql
-- Custom campaigns (should now appear in history)
SELECT
  id,
  executed_at,
  new_tracks,
  emails_sent,
  track_id,
  track_title
FROM execution_logs
WHERE track_id IS NULL
ORDER BY executed_at DESC;
```

**Check email_campaigns table:**
```sql
-- Verify campaign was marked as sent
SELECT
  id,
  subject,
  status,
  sent_at,
  created_at
FROM email_campaigns
WHERE subject = 'Easy Now';
```

**Expected:**
- `status`: `'sent'` (not 'draft')
- `sent_at`: Recent timestamp (not NULL)

---

## Architecture Notes

### Clean Architecture Compliance

**Domain Layer:**
- `GetExecutionHistoryUseCase`: Updated to handle both track types
- No changes to domain entities (no breaking changes)

**Infrastructure Layer:**
- No repository changes needed (query is in use case temporarily)
- Future improvement: Move query to `IExecutionLogRepository.getHistoryWithTracks()`

**Presentation Layer:**
- `ExecutionHistory.tsx`: Updated to handle campaigns without URLs
- Backward compatible (SoundCloud tracks still work)

### SOLID Principles

**Single Responsibility:**
- ✅ Use case only retrieves execution history (no business logic added)
- ✅ Component only displays history (no data fetching logic)

**Open/Closed:**
- ✅ Extended functionality without modifying existing contracts
- ✅ Added support for custom campaigns without breaking SoundCloud tracks

**Dependency Inversion:**
- ✅ Still depends on `IExecutionLogRepository` and `ITrackRepository` interfaces
- ✅ No concrete implementation dependencies added

---

## Future Improvements

### Short-term (Recommended)

1. **Add campaign_id to execution_logs:**
   ```sql
   ALTER TABLE execution_logs
   ADD COLUMN campaign_id UUID REFERENCES email_campaigns(id);
   ```
   - Allows direct JOIN to `email_campaigns` table
   - Enables fetching full campaign metadata (cover image, HTML content, etc.)

2. **Create unified history view:**
   ```sql
   CREATE VIEW campaign_history AS
   SELECT
     ec.id as campaign_id,
     ec.subject,
     ec.cover_image_url,
     el.emails_sent,
     el.executed_at,
     -- ... stats
   FROM execution_logs el
   LEFT JOIN email_campaigns ec ON ec.id = el.campaign_id
   LEFT JOIN soundcloud_tracks st ON st.track_id = el.track_id
   WHERE el.emails_sent > 0;
   ```

### Long-term (Architecture)

1. **Move query to repository:**
   ```typescript
   interface IExecutionLogRepository {
     getHistoryWithDetails(): Promise<ExecutionHistoryItem[]>;
   }
   ```
   - Encapsulates complex JOIN logic
   - Easier to test and maintain

2. **Separate campaign types:**
   - `TrackCampaign` (SoundCloud tracks)
   - `CustomCampaign` (user-created emails)
   - Use polymorphism for rendering

3. **Add campaign analytics:**
   - Link execution_logs to email_events
   - Calculate open/click rates in real-time
   - Show engagement metrics per campaign

---

## Files Changed

1. **`/Users/user/Code/backstage.app/domain/services/GetExecutionHistoryUseCase.ts`**
   - Updated SQL query to fetch both SoundCloud and custom campaigns
   - Changed filter from `new_tracks = 1` to `emails_sent > 0`
   - Added COALESCE fallbacks for custom campaigns

2. **`/Users/user/Code/backstage.app/components/dashboard/ExecutionHistory.tsx`**
   - Added conditional rendering for URL button
   - Shows "Custom Campaign" label when no URL exists
   - Prevents broken links for custom campaigns

3. **`/Users/user/Code/backstage.app/scripts/check-execution-logs.js`** (NEW)
   - Debug script to inspect execution_logs table
   - Helps verify campaign logging

---

## Summary

**Problem:** Custom campaigns were being logged but not displayed in history.

**Root Cause:** Execution history query only fetched SoundCloud tracks (`new_tracks = 1`), excluding custom campaigns (`new_tracks = 0`).

**Solution:** Updated query to start from `execution_logs` and filter by `emails_sent > 0`, including both track types.

**Impact:**
- ✅ All sent campaigns now appear in history
- ✅ SoundCloud tracks still work as before
- ✅ Custom campaigns show with appropriate UI
- ✅ No breaking changes to existing functionality

**Testing:** Deploy and send a custom campaign. Verify it appears in dashboard history with "Custom Campaign" label.

---

**Status:** ✅ FIXED
**Date:** 2026-01-14
**Files Modified:** 2 core files + 1 debug script
**Breaking Changes:** None
**Requires Migration:** No
