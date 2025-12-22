# Monitoring Queries - Consent History

## Quick Health Checks

### Check if consent_history is working
```sql
SELECT COUNT(*) as total_consent_events
FROM consent_history;
```

### Recent consent changes (last 24 hours)
```sql
SELECT
  c.email,
  ch.action,
  ch.source,
  ch.timestamp
FROM consent_history ch
JOIN contacts c ON c.id = ch.contact_id
WHERE ch.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY ch.timestamp DESC;
```

---

## Unsubscribe Analytics

### Unsubscribe rate by week
```sql
SELECT
  DATE_TRUNC('week', timestamp) as week,
  COUNT(*) as unsubscribes
FROM consent_history
WHERE action = 'unsubscribe'
GROUP BY week
ORDER BY week DESC
LIMIT 12;
```

### Unsubscribe rate percentage
```sql
SELECT
  COUNT(DISTINCT CASE WHEN action = 'unsubscribe' THEN contact_id END) as total_unsubscribes,
  COUNT(DISTINCT contact_id) as total_contacts,
  ROUND(
    COUNT(DISTINCT CASE WHEN action = 'unsubscribe' THEN contact_id END)::numeric /
    NULLIF(COUNT(DISTINCT contact_id), 0) * 100,
    2
  ) as unsubscribe_rate_pct
FROM consent_history
WHERE timestamp > NOW() - INTERVAL '30 days';
```

### Top unsubscribe days (identify patterns)
```sql
SELECT
  DATE(timestamp) as date,
  COUNT(*) as unsubscribes
FROM consent_history
WHERE action = 'unsubscribe'
AND timestamp > NOW() - INTERVAL '90 days'
GROUP BY date
ORDER BY unsubscribes DESC
LIMIT 10;
```

---

## Resubscribe Analytics

### Resubscribe rate
```sql
SELECT
  COUNT(*) FILTER (WHERE action = 'resubscribe') as resubscribes,
  COUNT(*) FILTER (WHERE action = 'unsubscribe') as unsubscribes,
  ROUND(
    COUNT(*) FILTER (WHERE action = 'resubscribe')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE action = 'unsubscribe'), 0) * 100,
    2
  ) as resubscribe_rate_pct
FROM consent_history
WHERE timestamp > NOW() - INTERVAL '30 days';
```

### Users who unsubscribed then resubscribed
```sql
SELECT
  c.email,
  MAX(CASE WHEN ch.action = 'unsubscribe' THEN ch.timestamp END) as unsubscribed_at,
  MAX(CASE WHEN ch.action = 'resubscribe' THEN ch.timestamp END) as resubscribed_at,
  EXTRACT(EPOCH FROM (
    MAX(CASE WHEN ch.action = 'resubscribe' THEN ch.timestamp END) -
    MAX(CASE WHEN ch.action = 'unsubscribe' THEN ch.timestamp END)
  ))/3600 as hours_between
FROM consent_history ch
JOIN contacts c ON c.id = ch.contact_id
WHERE ch.action IN ('unsubscribe', 'resubscribe')
GROUP BY c.email
HAVING
  MAX(CASE WHEN ch.action = 'unsubscribe' THEN ch.timestamp END) IS NOT NULL
  AND MAX(CASE WHEN ch.action = 'resubscribe' THEN ch.timestamp END) IS NOT NULL
ORDER BY resubscribed_at DESC;
```

---

## Contact Lifetime Analysis

### Use the built-in view
```sql
SELECT
  email,
  days_subscribed,
  emails_received,
  reason,
  unsubscribed_at
FROM unsubscribe_analysis
ORDER BY unsubscribed_at DESC
LIMIT 20;
```

### Average days subscribed before unsubscribe
```sql
SELECT
  ROUND(AVG(days_subscribed), 1) as avg_days_subscribed,
  MIN(days_subscribed) as min_days,
  MAX(days_subscribed) as max_days,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_subscribed) as median_days
FROM unsubscribe_analysis;
```

### Emails received before unsubscribe (identify threshold)
```sql
SELECT
  emails_received,
  COUNT(*) as num_users
FROM unsubscribe_analysis
GROUP BY emails_received
ORDER BY emails_received;
```

---

## Consent by Source

### Breakdown by source
```sql
SELECT
  source,
  action,
  COUNT(*) as count
FROM consent_history
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY source, action
ORDER BY source, action;
```

### Email link vs Admin actions
```sql
SELECT
  CASE
    WHEN source = 'email_link' THEN 'User Self-Service'
    WHEN source = 'admin_action' THEN 'Admin/Support'
    ELSE source
  END as category,
  COUNT(*) as total_actions
FROM consent_history
GROUP BY category
ORDER BY total_actions DESC;
```

---

## IP Address Analysis (Fraud Detection)

### Unsubscribes by IP
```sql
SELECT
  ip_address,
  COUNT(*) as unsubscribe_count,
  COUNT(DISTINCT contact_id) as unique_contacts,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen
FROM consent_history
WHERE action = 'unsubscribe'
AND ip_address IS NOT NULL
GROUP BY ip_address
HAVING COUNT(*) > 5  -- Flag IPs with multiple unsubscribes
ORDER BY unsubscribe_count DESC;
```

### Check for suspicious activity
```sql
-- Same IP unsubscribing multiple contacts quickly
SELECT
  ip_address,
  COUNT(*) as rapid_unsubscribes,
  MIN(timestamp) as first_unsub,
  MAX(timestamp) as last_unsub,
  EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp)))/60 as minutes_span
FROM consent_history
WHERE action = 'unsubscribe'
AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY rapid_unsubscribes DESC;
```

---

## Consent Timeline for Specific Contact

### Full history for a contact
```sql
SELECT
  ch.action,
  ch.source,
  ch.ip_address,
  ch.timestamp,
  ch.metadata
FROM consent_history ch
JOIN contacts c ON c.id = ch.contact_id
WHERE c.email = 'user@example.com'
ORDER BY ch.timestamp ASC;
```

### Current status vs history
```sql
SELECT
  c.email,
  c.subscribed as current_status,
  c.unsubscribed_at,
  (SELECT COUNT(*) FROM consent_history WHERE contact_id = c.id AND action = 'unsubscribe') as total_unsubscribes,
  (SELECT COUNT(*) FROM consent_history WHERE contact_id = c.id AND action = 'resubscribe') as total_resubscribes,
  (SELECT timestamp FROM consent_history WHERE contact_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_action_at
FROM contacts c
WHERE c.email = 'user@example.com';
```

---

## Compliance Checks

### Contacts without consent tracking
```sql
-- Contacts that have never appeared in consent_history (legacy data)
SELECT
  c.id,
  c.email,
  c.created_at,
  c.subscribed
FROM contacts c
LEFT JOIN consent_history ch ON ch.contact_id = c.id
WHERE ch.id IS NULL
ORDER BY c.created_at DESC;
```

### GDPR data retention check
```sql
-- Old consent records (for potential archiving/deletion)
SELECT
  DATE_TRUNC('year', timestamp) as year,
  COUNT(*) as records,
  MIN(timestamp) as oldest_record,
  MAX(timestamp) as newest_record
FROM consent_history
GROUP BY year
ORDER BY year;
```

---

## Performance Monitoring

### Consent history table size
```sql
SELECT
  pg_size_pretty(pg_total_relation_size('consent_history')) as total_size,
  pg_size_pretty(pg_relation_size('consent_history')) as table_size,
  pg_size_pretty(pg_total_relation_size('consent_history') - pg_relation_size('consent_history')) as indexes_size;
```

### Index usage
```sql
SELECT
  indexrelname as index_name,
  idx_scan as times_used,
  idx_tup_read as rows_read,
  idx_tup_fetch as rows_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND indexrelname LIKE 'idx_consent_history%'
ORDER BY idx_scan DESC;
```

---

## Alerting Queries

### Sudden spike in unsubscribes (alert if true)
```sql
SELECT
  COUNT(*) as unsubscribes_today,
  (
    SELECT AVG(daily_count)::int
    FROM (
      SELECT DATE(timestamp) as date, COUNT(*) as daily_count
      FROM consent_history
      WHERE action = 'unsubscribe'
      AND timestamp > NOW() - INTERVAL '30 days'
      GROUP BY date
    ) avg_calc
  ) as avg_daily_unsubscribes,
  CASE
    WHEN COUNT(*) > (
      SELECT AVG(daily_count) * 2
      FROM (
        SELECT DATE(timestamp) as date, COUNT(*) as daily_count
        FROM consent_history
        WHERE action = 'unsubscribe'
        AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY date
      ) avg_calc
    ) THEN '🚨 ALERT: Unsubscribe spike detected!'
    ELSE '✅ Normal unsubscribe rate'
  END as status
FROM consent_history
WHERE action = 'unsubscribe'
AND timestamp > CURRENT_DATE;
```

### Missing consent logs (potential bug)
```sql
-- Contacts unsubscribed but no consent_history record
SELECT
  c.id,
  c.email,
  c.subscribed,
  c.unsubscribed_at,
  (SELECT COUNT(*) FROM consent_history WHERE contact_id = c.id) as consent_records
FROM contacts c
WHERE c.subscribed = false
AND c.unsubscribed_at IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM consent_history
  WHERE contact_id = c.id
  AND action = 'unsubscribe'
)
LIMIT 10;
```

---

## Scheduled Monitoring (Cron)

### Daily summary email query
```sql
-- Run this daily and send results to admin
SELECT
  DATE(NOW()) as report_date,
  (SELECT COUNT(*) FROM contacts WHERE subscribed = true) as active_subscribers,
  (SELECT COUNT(*) FROM consent_history WHERE action = 'unsubscribe' AND timestamp > CURRENT_DATE) as unsubscribes_today,
  (SELECT COUNT(*) FROM consent_history WHERE action = 'resubscribe' AND timestamp > CURRENT_DATE) as resubscribes_today,
  (SELECT COUNT(*) FROM consent_history WHERE timestamp > CURRENT_DATE) as total_consent_events_today,
  (
    SELECT ROUND(AVG(daily_count), 2)
    FROM (
      SELECT DATE(timestamp) as date, COUNT(*) as daily_count
      FROM consent_history
      WHERE action = 'unsubscribe'
      AND timestamp > NOW() - INTERVAL '7 days'
      GROUP BY date
    ) weekly_avg
  ) as avg_unsubscribes_7day;
```

---

## Export for Analysis (CSV)

### Export to CSV
```bash
# Run from command line
psql $DATABASE_URL -c "
COPY (
  SELECT
    ch.id,
    c.email,
    ch.action,
    ch.source,
    ch.ip_address,
    ch.timestamp,
    ch.metadata
  FROM consent_history ch
  JOIN contacts c ON c.id = ch.contact_id
  WHERE ch.timestamp > NOW() - INTERVAL '90 days'
  ORDER BY ch.timestamp DESC
) TO STDOUT WITH CSV HEADER
" > consent_history_export.csv
```

---

## Common Troubleshooting

### Check if migration ran
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'consent_history'
) as migration_successful;
```

### Check recent errors (if any)
```sql
-- If you add error logging to metadata
SELECT
  ch.timestamp,
  c.email,
  ch.action,
  ch.metadata->>'error' as error_message
FROM consent_history ch
JOIN contacts c ON c.id = ch.contact_id
WHERE ch.metadata->>'error' IS NOT NULL
ORDER BY ch.timestamp DESC
LIMIT 20;
```

---

**Note**: Save these queries in your database tool (DBeaver, TablePlus, etc.) for quick access.

**Recommended Schedule**:
- Daily: Run "Daily summary" query
- Weekly: Check "Unsubscribe rate by week"
- Monthly: Review "Average days subscribed" and "Emails before unsubscribe"
- Immediately: If spike alert triggers
