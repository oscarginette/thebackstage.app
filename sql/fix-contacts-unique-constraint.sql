-- =====================================================
-- FIX: Contacts Unique Constraint for Multi-Tenancy
-- Problem: ON CONFLICT (user_id, email) fails because
--          only email has UNIQUE constraint, not (user_id, email)
-- Date: 2025-12-30
-- =====================================================

-- Step 1: Drop the old UNIQUE constraint on email only
-- (Find the constraint name first)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the unique constraint on email column
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'contacts'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (SELECT attnum FROM pg_attribute
                     WHERE attrelid = 'contacts'::regclass
                     AND attname = 'email');

  -- Drop it if found
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE contacts DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped old constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No single-column email constraint found (might already be fixed)';
  END IF;
END $$;

-- Step 2: Add composite UNIQUE constraint on (user_id, email)
-- This allows different users to have the same email in their lists
-- but prevents duplicates within one user's contacts
ALTER TABLE contacts
  ADD CONSTRAINT unique_user_email
  UNIQUE (user_id, email);

-- Step 3: Verify the constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'contacts'::regclass
      AND conname = 'unique_user_email'
  ) THEN
    RAISE NOTICE 'SUCCESS: Constraint unique_user_email created';
  ELSE
    RAISE EXCEPTION 'FAILED: Constraint unique_user_email not found';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify the constraint:
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'contacts'::regclass;

-- Expected output:
-- unique_user_email | u | UNIQUE (user_id, email)
-- =====================================================
