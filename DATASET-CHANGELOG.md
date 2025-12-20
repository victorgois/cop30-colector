# Dataset Changelog

This document tracks all major changes to the COP30 dataset.

---

## Version 3.0 - November-Only Dataset (December 19, 2025)

### Summary
Further cleaned dataset to focus exclusively on COP30 event period (November-December 2025), removing all October 2025 posts that represented pre-event noise.

### Changes

**Before Final Cleanup:**
- Total posts: 9,628
- Date range: October 2, 2025 → December 1, 2025

**After Final Cleanup:**
- Total posts: 7,187
- Date range: November 1, 2025 → December 1, 2025

**Removed in this version:**
- 2,441 October 2025 posts (25.4% of intermediate dataset)

**Cumulative removal (from original):**
- Total removed: 2,931 posts (28.9% of original 10,118)
- Retained: 7,187 posts (71.1% of original)

### Distribution

| Month | Posts | % of Dataset |
|-------|-------|--------------|
| November 2025 | 6,934 | 96.5% |
| December 2025 | 253 | 3.5% |

---

## Version 2.0 - October-December Dataset (December 19, 2025) [SUPERSEDED]

### Summary
Initial cleanup removed posts from before October 2025.

**Changes:**
- Removed: 490 posts (Aug 2020 - Sep 2025)
- Retained: 9,628 posts (Oct-Dec 2025)

**Note:** This version was superseded by Version 3.0 which removed October posts.

### Rationale for November-Only Dataset

The project focuses on conversations **during** COP30 (held in November 2025). Analysis revealed:

1. **October posts (removed):**
   - Mostly generic "climate" and "sustainability" content
   - Low correlation with COP30 specifically
   - Average 79 posts/day (low signal)

2. **November posts (retained - 96.5%):**
   - Direct discussion of COP30 event
   - High average: 231 posts/day (3x October rate)
   - Clear thematic relevance

3. **December posts (retained - 3.5%):**
   - Immediate post-event reactions
   - Important for capturing outcomes/sentiment

**Decision:** Remove October to eliminate noise and focus on event period.

### Backups

**Latest backup (before November cleanup):**
- File: `backup-nodejs-2025-12-20T02-09-56.sql`
- Size: 98.32 MB
- Contains: 9,628 posts (Oct-Dec 2025)

**Original backup (before any cleanup):**
- File: `backup-nodejs-2025-12-20T02-03-08.sql`
- Size: 102.02 MB
- Contains: 10,118 posts (Aug 2020 - Dec 2025)

**To restore:**
```bash
# Restore October-December version
psql "$DATABASE_URL" < database/backups/backup-nodejs-2025-12-20T02-09-56.sql

# Or restore original (all data)
psql "$DATABASE_URL" < database/backups/backup-nodejs-2025-12-20T02-03-08.sql
```

### Technical Details

**Script used:** `database/cleanup-old-posts.js`

**SQL executed:**
```sql
DELETE FROM posts
WHERE created_at < '2025-10-01'::date
-- Deleted 490 rows
```

**Verification query:**
```sql
SELECT
  COUNT(*) as total,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM posts;

-- Result: 9,628 posts from Oct 2 to Dec 1, 2025
```

### Impact on Analysis

**Positive impacts:**
- Cleaner temporal analysis (no historical noise)
- Focus on relevant period for COP30 research
- Consistent date range across all posts

**Considerations:**
- Lost historical context (pre-2025 mentions of COP30)
- Cannot analyze long-term trends
- Dataset now represents snapshot of specific 2-month period

### Validation

- ✅ All remaining posts are from Oct 1, 2025 onwards
- ✅ No posts with NULL created_at
- ✅ Backup created successfully before cleanup
- ✅ Views and statistics updated automatically
- ✅ API endpoints return correct filtered data

---

## Version 1.1 - Security Fixes (December 18, 2025)

### Summary
Applied Row Level Security (RLS) policies and fixed security definer views.

### Changes

**RLS Enabled:**
- `posts` table: 4 policies (public read, authenticated write)
- `users` table: 4 policies (public read, authenticated write)
- `collection_logs` table: 4 policies (public read, authenticated write)

**Views Updated:**
- `stats_summary`: Added `security_invoker = true`
- `daily_timeline`: Added `security_invoker = true`
- `top_hashtags`: Added `security_invoker = true`

**Backups:**
- `backup-nodejs-2025-12-18T13-49-45.sql` (before security fixes)
- `backup-nodejs-2025-12-18T13-48-07.sql` (first backup)

### Impact
- Improved security posture
- Compliance with Supabase security linter
- Public read access maintained
- Write operations require authentication

---

## Version 1.0 - Initial Dataset (November 30, 2025)

### Summary
Initial collection completed.

### Statistics
- Total posts: 10,118
- Date range: Aug 2020 → Dec 2025
- Platforms: Instagram, TikTok
- Keywords: 8 (COP30, Cop30, Amazonia, Amazônia, clima, climate, sustentabilidade, sustainability)
- Hashtags: 33,343 unique
- Timeline records: 650

### Collection Period
- October 2025: System development and testing
- November 2025: Intensive collection (30 days)
- December 2025: Final collection and analysis

---

## Data Quality Notes

### Completeness
- ✅ All posts have required fields (platform, post_id, created_at)
- ✅ 0 posts with NULL created_at
- ⚠️ Some posts missing engagement metrics (varies by platform API)

### Consistency
- ✅ Post IDs are unique (enforced by UNIQUE constraint)
- ✅ Platforms are normalized ('instagram' or 'tiktok')
- ✅ Dates are properly formatted (ISO 8601)

### Accuracy
- ℹ️ Engagement metrics (likes, comments) are snapshots at collection time
- ℹ️ Deleted posts after collection are not tracked
- ℹ️ Some fields may be empty if not available via scraper

---

## Future Considerations

### Potential Updates
1. **Platform-specific cleanup**: Remove posts with suspicious metrics
2. **Duplicate detection**: Enhanced deduplication beyond post_id
3. **Language filtering**: Separate Portuguese, Spanish, English posts
4. **Bot detection**: Identify and flag potential bot accounts

### Archival Strategy
- Keep all backups in `database/backups/` directory
- Major version changes should be documented here
- Consider long-term archival (external storage) for historical backups

---

**Last Updated:** December 19, 2025
**Dataset Version:** 2.0
**Total Posts:** 9,628
**Period:** October 2 - December 1, 2025
