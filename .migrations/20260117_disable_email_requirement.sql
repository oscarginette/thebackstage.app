/**
 * Migration: Disable Email Verification Requirement
 * Date: 2026-01-17
 *
 * Problem:
 * - Gates have require_email = true by default
 * - Email verification flow is NOT implemented (no magic link)
 * - This blocks ALL downloads even when other verifications are complete
 *
 * Solution:
 * - Set require_email = false for all existing gates
 * - Change default to false for new gates
 *
 * Future Work:
 * - Implement magic link email verification flow
 * - Re-enable require_email once verification is working
 */

-- 1. Disable email requirement for existing gates
UPDATE download_gates
SET require_email = false
WHERE require_email = true;

-- 2. Change default for new gates
ALTER TABLE download_gates
ALTER COLUMN require_email SET DEFAULT false;

-- Verification query (should return 0 rows with require_email = true):
-- SELECT id, slug, require_email FROM download_gates WHERE require_email = true;
