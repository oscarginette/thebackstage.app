# Admin System Testing Guide

**Version:** 1.0
**Last Updated:** 2025-12-30
**Purpose:** Comprehensive manual testing guide for admin system features

---

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Database Migration Testing](#database-migration-testing)
3. [API Endpoint Testing](#api-endpoint-testing)
4. [Component Testing](#component-testing)
5. [Integration Testing](#integration-testing)
6. [Security Testing](#security-testing)
7. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)
8. [Performance Testing](#performance-testing)
9. [Appendix: Quick Reference](#appendix-quick-reference)

---

## Pre-Testing Setup

### Prerequisites

Before starting tests, ensure you have:

- **Admin account** with credentials
- **Regular user account** for authorization testing
- **Database access** (for verification queries)
- **Browser DevTools** open (Network and Console tabs)
- **API testing tool** (optional: Postman, Insomnia, or cURL)

### Test Data Requirements

You'll need:
- At least 3 test users in the system
- At least 1 user with active subscription
- At least 1 user with free plan
- Valid test payment amounts (e.g., 29.00, 79.00, 199.00)

### Environment Setup Checklist

- [ ] Application running on `http://localhost:3000` (or your environment)
- [ ] Database accessible and migration applied
- [ ] Admin user created and credentials available
- [ ] Test users created (minimum 3)
- [ ] Browser console clear of errors
- [ ] Network tab recording enabled

---

## Database Migration Testing

### 1. Verify Migration Ran Successfully

#### SQL Verification Queries

```sql
-- Check if new columns exist in invoices table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'invoices'
  AND column_name IN ('payment_method', 'payment_reference', 'payment_notes', 'manually_created', 'created_by_user_id')
ORDER BY column_name;
```

**Expected Result:**
```
column_name         | data_type          | is_nullable | column_default
--------------------+--------------------+-------------+----------------
created_by_user_id  | integer            | YES         | NULL
manually_created    | boolean            | YES         | false
payment_method      | character varying  | YES         | NULL
payment_notes       | text               | YES         | NULL
payment_reference   | character varying  | YES         | NULL
```

#### Check Indexes Were Created

```sql
-- Verify indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'invoices'
  AND indexname LIKE 'idx_invoices_%'
ORDER BY indexname;
```

**Expected Result:**
```
indexname                          | indexdef
-----------------------------------+----------------------------------
idx_invoices_created_by_user       | CREATE INDEX idx_invoices_created_by_user ON invoices USING btree (created_by_user_id)
idx_invoices_manually_created      | CREATE INDEX idx_invoices_manually_created ON invoices USING btree (manually_created)
idx_invoices_payment_method        | CREATE INDEX idx_invoices_payment_method ON invoices USING btree (payment_method)
```

#### Verify VIEW Exists

```sql
-- Check payment_history_overview VIEW exists
SELECT viewname
FROM pg_views
WHERE viewname = 'payment_history_overview';
```

**Expected Result:**
```
viewname
-----------------------
payment_history_overview
```

#### Test VIEW Returns Data

```sql
-- Query the VIEW (should return data if you have invoices)
SELECT
  id,
  customer_email,
  amount_paid,
  currency,
  status,
  manually_created,
  created_by_admin_email
FROM payment_history_overview
LIMIT 5;
```

**Expected Result:**
- Returns rows with denormalized payment + user data
- `customer_email` should match user email
- `manually_created` should be TRUE or FALSE
- `created_by_admin_email` should be NULL (for Stripe payments) or an admin email (for manual payments)

### 2. Test Foreign Key Constraint

```sql
-- Try to insert invoice with invalid created_by_user_id (should fail)
INSERT INTO invoices (
  customer_id,
  amount_due,
  currency,
  status,
  manually_created,
  created_by_user_id
) VALUES (
  1,
  5000,
  'eur',
  'paid',
  true,
  99999 -- Invalid user ID
);
```

**Expected Result:**
- Error: `violates foreign key constraint "invoices_created_by_user_id_fkey"`

### Migration Test Checklist

- [ ] All 5 new columns exist in `invoices` table
- [ ] All 3 indexes created successfully
- [ ] `payment_history_overview` VIEW exists
- [ ] VIEW returns data correctly (if invoices exist)
- [ ] Foreign key constraint enforced on `created_by_user_id`
- [ ] Default value `false` set for `manually_created`
- [ ] Column comments added (check with `\d+ invoices` in psql)

---

## API Endpoint Testing

### 1. PUT /api/admin/users/[userId]/quota

**Purpose:** Update a user's monthly email quota limit

#### Test Case 1.1: Successful Quota Update

**Steps:**
1. Log in as admin
2. Navigate to Admin tab
3. Open browser DevTools → Network tab
4. Find a user ID (e.g., user ID 5)
5. Use cURL or the UI to update quota

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/admin/users/5/quota \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "newMonthlyLimit": 15000
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "userId": 5,
  "newMonthlyLimit": 15000
}
```

**Verification:**
- Check database: `SELECT id, email, monthly_quota FROM users WHERE id = 5;`
- Expected: `monthly_quota` should be `15000`

#### Test Case 1.2: Invalid User ID

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/users/99999/quota \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "newMonthlyLimit": 10000
  }'
```

**Expected Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

#### Test Case 1.3: Negative Quota Value

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/users/5/quota \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "newMonthlyLimit": -500
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "newMonthlyLimit must be a positive number"
}
```

#### Test Case 1.4: Non-Admin Access

**Steps:**
1. Log out admin
2. Log in as regular user
3. Try to update quota

**Expected Response (403 Forbidden):**
```json
{
  "error": "Admin access required."
}
```

#### Test Case 1.5: Missing newMonthlyLimit Field

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/users/5/quota \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "newMonthlyLimit must be a positive number"
}
```

### Quota Update Test Checklist

- [ ] Successful quota update (200)
- [ ] Invalid user ID returns 404
- [ ] Negative quota value returns 400
- [ ] Zero quota value returns 400
- [ ] Non-admin user returns 403
- [ ] Unauthenticated request returns 401
- [ ] Missing field returns 400
- [ ] String value (not number) returns 400
- [ ] Database updated correctly
- [ ] UI refreshes after update

---

### 2. POST /api/admin/users/[userId]/toggle

**Purpose:** Activate or deactivate a user account

#### Test Case 2.1: Deactivate User

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/users/5/toggle \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "active": false
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "userId": 5,
  "active": false
}
```

**Verification:**
- Database: `SELECT id, email, active FROM users WHERE id = 5;`
- Expected: `active` should be `false`
- **Important:** User should NOT be able to log in now

#### Test Case 2.2: Reactivate User

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/users/5/toggle \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "active": true
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "userId": 5,
  "active": true
}
```

**Verification:**
- Database: `SELECT id, email, active FROM users WHERE id = 5;`
- Expected: `active` should be `true`
- User should be able to log in now

#### Test Case 2.3: Admin Cannot Deactivate Themselves

**Steps:**
1. Get your admin user ID (e.g., ID 1)
2. Try to deactivate yourself

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/users/1/toggle \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "active": false
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Admins cannot deactivate themselves"
}
```

#### Test Case 2.4: Invalid Boolean Value

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/users/5/toggle \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "active": "yes"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "active must be a boolean value"
}
```

### Toggle Active Test Checklist

- [ ] Successfully deactivate user (200)
- [ ] Successfully reactivate user (200)
- [ ] Admin cannot deactivate themselves (400)
- [ ] Invalid user ID returns 404
- [ ] Non-boolean value returns 400
- [ ] Missing `active` field returns 400
- [ ] Non-admin user returns 403
- [ ] Deactivated user cannot log in
- [ ] Reactivated user can log in
- [ ] Database updated correctly

---

### 3. GET /api/admin/payments

**Purpose:** Fetch payment history with filters and pagination

#### Test Case 3.1: Fetch All Payments (Default)

**Request:**
```bash
curl -X GET http://localhost:3000/api/admin/payments \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inv_abc123",
      "customer_id": 5,
      "customer_email": "test@example.com",
      "customer_name": "Test User",
      "amount_due": 2900,
      "amount_paid": 2900,
      "currency": "eur",
      "status": "paid",
      "paid": true,
      "paid_at": "2025-12-29T10:30:00Z",
      "payment_method": "bank_transfer",
      "payment_reference": "TXN-12345",
      "payment_notes": "Manual payment received",
      "manually_created": true,
      "created_by_admin_email": "admin@example.com",
      "created_by_admin_name": "Admin User",
      "billing_reason": null,
      "subscription_id": null,
      "created": "2025-12-29T10:30:00Z",
      "description": "Pro plan - 1 month"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Test Case 3.2: Filter by Payment Method

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/payments?payment_method=bank_transfer" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200 OK):**
- Only payments with `payment_method: "bank_transfer"`

#### Test Case 3.3: Filter Manual Payments Only

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/payments?manually_created=true" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200 OK):**
- Only payments where `manually_created: true`

#### Test Case 3.4: Filter Stripe Payments Only

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/payments?manually_created=false" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200 OK):**
- Only payments where `manually_created: false` (Stripe payments)

#### Test Case 3.5: Filter by Customer ID

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/payments?customer_id=5" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200 OK):**
- Only payments for customer ID 5

#### Test Case 3.6: Pagination

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/payments?page=2&limit=10" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [ /* 10 payments */ ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Test Case 3.7: Filter by Date Range

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/payments?start_date=2025-12-01&end_date=2025-12-31" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200 OK):**
- Only payments created between Dec 1 and Dec 31, 2025

#### Test Case 3.8: Combined Filters

**Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/payments?payment_method=paypal&manually_created=true&page=1&limit=20" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200 OK):**
- Manual PayPal payments only
- First 20 results

### Payment History Test Checklist

- [ ] Fetch all payments (default)
- [ ] Filter by payment method (each type)
- [ ] Filter manual payments only
- [ ] Filter Stripe payments only
- [ ] Filter by customer ID
- [ ] Pagination works (page 1, page 2, etc.)
- [ ] Filter by date range
- [ ] Combined filters work correctly
- [ ] Non-admin returns 403
- [ ] Empty result set returns empty array (not error)
- [ ] Invalid date format handled gracefully
- [ ] Total count accurate

---

### 4. POST /api/admin/payments

**Purpose:** Create a manual payment

#### Test Case 4.1: Successful Manual Payment (Bank Transfer)

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 29.00,
    "currency": "eur",
    "payment_method": "bank_transfer",
    "payment_reference": "TXN-BANK-12345",
    "payment_notes": "Payment received via bank transfer on 2025-12-30",
    "description": "Pro plan - 1 month subscription",
    "paid_at": "2025-12-30T14:30:00Z"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "invoice": {
    "id": "inv_manual_abc123",
    "customer_id": 5,
    "amount_due": 2900,
    "amount_paid": 2900,
    "currency": "eur",
    "status": "paid",
    "paid": true,
    "paid_at": "2025-12-30T14:30:00Z",
    "payment_method": "bank_transfer",
    "payment_reference": "TXN-BANK-12345",
    "manually_created": true,
    "description": "Pro plan - 1 month subscription"
  }
}
```

**Verification:**
```sql
-- Check invoice was created
SELECT
  id,
  customer_id,
  amount_paid,
  payment_method,
  manually_created,
  created_by_user_id
FROM invoices
WHERE payment_reference = 'TXN-BANK-12345';
```

**Expected:**
- `manually_created` = `true`
- `created_by_user_id` = admin user ID
- `payment_method` = `bank_transfer`

#### Test Case 4.2: PayPal Payment

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 7,
    "amount": 79.00,
    "currency": "eur",
    "payment_method": "paypal",
    "payment_reference": "PAYPAL-TXN-67890",
    "description": "Business plan - 1 month"
  }'
```

**Expected Response (201 Created):**
- `payment_method` = `paypal`

#### Test Case 4.3: Cash Payment

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 8,
    "amount": 199.00,
    "currency": "eur",
    "payment_method": "cash",
    "payment_notes": "Cash payment received at office"
  }'
```

**Expected Response (201 Created):**
- `payment_method` = `cash`

#### Test Case 4.4: Crypto Payment

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 9,
    "amount": 29.00,
    "currency": "eur",
    "payment_method": "crypto",
    "payment_reference": "BTC-TXN-ABC123DEF456",
    "payment_notes": "0.0005 BTC received"
  }'
```

**Expected Response (201 Created):**
- `payment_method` = `crypto`

#### Test Case 4.5: Missing Required Fields

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 5
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: customer_id, amount, payment_method"
}
```

#### Test Case 4.6: Invalid Customer ID

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 99999,
    "amount": 29.00,
    "payment_method": "bank_transfer"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "User not found"
}
```

#### Test Case 4.7: Negative Amount

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": -50.00,
    "payment_method": "cash"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Amount must be a positive number"
}
```

#### Test Case 4.8: Zero Amount

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 0,
    "payment_method": "cash"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Amount must be a positive number"
}
```

#### Test Case 4.9: Very Large Amount

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 999999.99,
    "payment_method": "bank_transfer",
    "payment_notes": "Testing large amount"
  }'
```

**Expected Response (201 Created):**
- Should handle large amounts correctly
- Verify database stores 99999999 cents

#### Test Case 4.10: Currency Variations

**USD:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 35.00,
    "currency": "usd",
    "payment_method": "paypal"
  }'
```

**Expected Response (201 Created):**
- `currency` = `usd`

**GBP:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 25.00,
    "currency": "gbp",
    "payment_method": "bank_transfer"
  }'
```

**Expected Response (201 Created):**
- `currency` = `gbp`

### Manual Payment Test Checklist

- [ ] Bank transfer payment created (201)
- [ ] PayPal payment created (201)
- [ ] Cash payment created (201)
- [ ] Crypto payment created (201)
- [ ] Other payment method created (201)
- [ ] Missing required fields returns 400
- [ ] Invalid customer ID returns 400
- [ ] Negative amount returns 400
- [ ] Zero amount returns 400
- [ ] Very large amount handled correctly
- [ ] EUR currency works
- [ ] USD currency works
- [ ] GBP currency works
- [ ] Optional fields (notes, reference) work
- [ ] `paid_at` defaults to now if not provided
- [ ] Database record created with `manually_created = true`
- [ ] `created_by_user_id` set to admin user ID
- [ ] Non-admin returns 403
- [ ] Unauthenticated returns 401

---

## Component Testing

### 1. PaymentHistoryTable Component

**Location:** `/dashboard?tab=admin` (scroll to Payment History section)

#### Test Case: Table Loads Successfully

**Steps:**
1. Log in as admin
2. Navigate to Dashboard
3. Click "Admin" tab
4. Scroll to Payment History section

**Expected Result:**
- Table displays without errors
- Shows columns: Customer, Amount, Method, Status, Date, Reference
- Displays both Stripe and manual payments
- Loading spinner appears briefly before data loads

#### Test Case: Search Functionality

**Steps:**
1. In the search box, type a user email (e.g., "test@example.com")
2. Observe filtered results

**Expected Result:**
- Table filters to show only payments matching the email
- Filter is case-insensitive
- Empty results show "No payments found"

**Test with:**
- Email address
- Customer name
- Payment reference number
- Invoice ID

#### Test Case: Payment Method Filter

**Steps:**
1. Click "All Payment Methods" dropdown
2. Select "Bank Transfer"
3. Observe results

**Expected Result:**
- Only bank transfer payments shown
- Badge shows "BANK TRANSFER"
- Other payment methods hidden

**Test all methods:**
- Bank Transfer
- PayPal
- Cash
- Crypto
- Other

#### Test Case: Manual/Stripe Filter

**Steps:**
1. Click "All Sources" dropdown
2. Select "Manual Only"

**Expected Result:**
- Only manual payments shown (manually_created = true)
- Each payment shows admin email who created it

**Steps:**
1. Select "Stripe Only"

**Expected Result:**
- Only Stripe payments shown (manually_created = false)
- Badge shows "STRIPE"

#### Test Case: Pagination

**Steps:**
1. If more than 50 payments exist, pagination appears
2. Click "Next" button
3. Observe page changes

**Expected Result:**
- Shows "Page 2 of X"
- Displays next 50 results
- "Previous" button now enabled
- "Next" button disabled on last page

#### Test Case: Payment Method Badges

**Expected Badge Colors:**
- Bank Transfer: Blue badge
- PayPal: Purple badge
- Cash: Green badge
- Crypto: Orange badge
- Other: Gray badge
- Stripe: Indigo badge

#### Test Case: Status Badges

**Expected Badge Colors:**
- Paid: Green badge
- Open: Yellow badge
- Draft: Gray badge
- Void: Red badge
- Uncollectible: Red badge

#### Test Case: Date Formatting

**Expected Format:**
- German locale: "30. Dez. 2025, 14:30"
- Shows both `paid_at` (main) and `created` (secondary)

#### Test Case: Amount Formatting

**Expected Format:**
- EUR: "29,00 €"
- USD: "35,00 $" (or USD format)
- Uses German number formatting
- Amounts in cents converted correctly (2900 cents = €29.00)

### PaymentHistoryTable Checklist

- [ ] Table loads without errors
- [ ] Search by email works
- [ ] Search by name works
- [ ] Search by reference works
- [ ] Payment method filter works (all types)
- [ ] Manual/Stripe filter works
- [ ] Pagination works (next/previous)
- [ ] Badge colors correct (payment methods)
- [ ] Badge colors correct (status)
- [ ] Date formatting correct
- [ ] Amount formatting correct (EUR)
- [ ] Amount formatting correct (USD)
- [ ] Amount formatting correct (GBP)
- [ ] Admin email shown for manual payments
- [ ] Empty state shows correctly
- [ ] Loading state shows spinner

---

### 2. ManualPaymentForm Component

**Location:** `/dashboard?tab=admin` → Click "Add Manual Payment" button

#### Test Case: Form Opens Successfully

**Steps:**
1. Navigate to Admin tab
2. Scroll to Payment History
3. Click "Add Manual Payment" button

**Expected Result:**
- Modal opens
- Form displays with all fields
- Customer dropdown populated
- Default currency is EUR
- Default payment method is Bank Transfer
- Payment date pre-filled with current date/time

#### Test Case: Customer Selection

**Steps:**
1. Click "Customer" dropdown
2. Select a user

**Expected Result:**
- Dropdown shows all users (email + name)
- Selected user displays correctly

#### Test Case: Amount Validation

**Test 1: Valid amount**
- Enter: 29.00
- Expected: Accepted

**Test 2: Invalid amount (negative)**
- Enter: -50
- Click "Create Payment"
- Expected: Error toast "Please enter a valid amount"

**Test 3: Invalid amount (zero)**
- Enter: 0
- Click "Create Payment"
- Expected: Error toast "Please enter a valid amount"

**Test 4: Invalid amount (empty)**
- Leave empty
- Click "Create Payment"
- Expected: Error toast "Please enter a valid amount"

**Test 5: Decimal precision**
- Enter: 29.99
- Expected: Accepted (should store as 2999 cents)

#### Test Case: Payment Method Selection

**Steps:**
1. Click "Payment Method" dropdown
2. Test each option:
   - Bank Transfer
   - PayPal
   - Cash
   - Cryptocurrency
   - Other

**Expected Result:**
- All options selectable
- Selection saved correctly

#### Test Case: Optional Fields

**Test 1: Payment Reference**
- Enter: "TXN-12345"
- Expected: Saved correctly
- Max length: 255 characters

**Test 2: Payment Date**
- Select custom date/time
- Expected: Date saved correctly
- Format: datetime-local input

**Test 3: Description**
- Enter: "Pro plan - 1 month"
- Expected: Saved correctly
- Max length: 1000 characters

**Test 4: Internal Notes**
- Enter multi-line notes
- Expected: Textarea expands, saves correctly
- Max length: 5000 characters

#### Test Case: Form Submission

**Steps:**
1. Fill all required fields
2. Click "Create Payment"
3. Observe loading state
4. Wait for response

**Expected Result:**
- Button shows "Creating..." with disabled state
- Success toast appears
- Form closes after 1.5 seconds
- Payment history table refreshes
- New payment appears in table

#### Test Case: Form Cancellation

**Steps:**
1. Fill some fields
2. Click "Cancel"

**Expected Result:**
- Modal closes
- Form resets (all fields cleared)
- No API call made

#### Test Case: Form Reset After Success

**Steps:**
1. Create payment successfully
2. Reopen form

**Expected Result:**
- All fields reset to defaults
- No data from previous submission

#### Test Case: Error Handling

**Test 1: Network error**
- Disconnect internet
- Submit form
- Expected: Error toast with message

**Test 2: Server error (invalid customer)**
- Select customer, then delete them from DB
- Submit form
- Expected: Error toast "User not found"

**Test 3: Validation error**
- Submit with invalid data
- Expected: Specific error message in toast

### ManualPaymentForm Checklist

- [ ] Form opens correctly
- [ ] Customer dropdown populated
- [ ] Amount validation works (positive, zero, negative)
- [ ] Decimal amounts handled correctly
- [ ] All payment methods selectable
- [ ] Currency selector works (EUR, USD, GBP)
- [ ] Payment date picker works
- [ ] Optional fields save correctly
- [ ] Max length enforced (reference, description, notes)
- [ ] Form submission shows loading state
- [ ] Success toast appears
- [ ] Form closes after success
- [ ] Payment history refreshes
- [ ] Cancel button works
- [ ] Form resets after success
- [ ] Error handling works (network errors)
- [ ] Error handling works (validation errors)

---

### 3. UserManagementTable Component

**Location:** `/dashboard?tab=admin` → User Management section

#### Test Case: Table Loads

**Expected Result:**
- Shows all users
- Columns: Checkbox, User, Plan, Quota, Registered, Status
- User avatars with initials
- Plan badges colored correctly

#### Test Case: Search Users

**Steps:**
1. Type email in search box
2. Observe filtered results

**Expected Result:**
- Filters users by email or name
- Case-insensitive
- Empty state if no matches

#### Test Case: Select Users

**Steps:**
1. Click individual user checkboxes
2. Click "Select All" checkbox

**Expected Result:**
- Individual checkboxes toggle row selection
- Selected rows highlighted in blue
- "Select All" selects all visible (filtered) users
- Counter updates: "Activate (3)"

#### Test Case: Bulk Activation

**Steps:**
1. Select 2-3 users
2. Choose plan (e.g., "Pro")
3. Set duration (e.g., 1 month)
4. Click "Activate (N)" button
5. Confirm dialog

**Expected Result:**
- Confirmation dialog shows: "Activate PRO plan for 3 user(s) for 1 month(s)?"
- After confirm: Loading state
- Success toast: "Successfully activated 3 user(s)"
- Table refreshes
- Users now have Pro plan

#### Test Case: Plan Limits Display

**Steps:**
1. Select "Pro" plan

**Expected Result:**
- Blue info box shows: "PRO Plan: Up to 5,000 contacts, 10,000 emails/month"

**Test all plans:**
- Free: 100 contacts, 1,000 emails/month
- Pro: 5,000 contacts, 10,000 emails/month
- Business: 25,000 contacts, 50,000 emails/month
- Unlimited: 999,999,999 contacts and emails

#### Test Case: Duration Input

**Steps:**
1. Set duration to 0 or negative

**Expected Result:**
- Minimum value enforced (1)

**Steps:**
1. Set duration to 12

**Expected Result:**
- Maximum value enforced (12)

#### Test Case: User Status Badges

**Expected:**
- Active: Green badge "Active"
- Inactive: Red badge "Inactive"

#### Test Case: Plan Badges

**Expected Colors:**
- Free: Gray
- Pro: Green
- Business: Blue
- Unlimited: Purple

### UserManagementTable Checklist

- [ ] Table loads all users
- [ ] Search filters correctly
- [ ] Individual checkbox selection works
- [ ] Select All works (filtered users)
- [ ] Selected count accurate
- [ ] Plan selector works
- [ ] Duration input validates (min 1, max 12)
- [ ] Plan limits display correctly
- [ ] Bulk activation confirmation works
- [ ] Bulk activation API call succeeds
- [ ] Success toast appears
- [ ] Table refreshes after activation
- [ ] User plans updated in database
- [ ] Badge colors correct (status)
- [ ] Badge colors correct (plans)

---

## Integration Testing

### Full Admin Workflow Test

This test verifies the complete admin flow from login to payment creation.

#### Workflow 1: Create Manual Payment

**Steps:**
1. Log in as admin user
2. Navigate to Dashboard → Admin tab
3. Verify Payment History section exists
4. Click "Add Manual Payment" button
5. Select customer from dropdown
6. Enter amount: 29.00 EUR
7. Select payment method: Bank Transfer
8. Enter reference: TEST-TXN-001
9. Enter notes: "Test payment for QA"
10. Click "Create Payment"
11. Wait for success toast
12. Verify payment appears in table
13. Verify payment method badge shows "BANK TRANSFER"
14. Verify amount shows "29,00 €"

**Expected Result:**
- End-to-end flow completes without errors
- Payment visible in UI
- Payment exists in database

**Database Verification:**
```sql
SELECT
  id,
  customer_id,
  amount_paid,
  payment_method,
  payment_reference,
  manually_created,
  created_by_user_id
FROM invoices
WHERE payment_reference = 'TEST-TXN-001';
```

**Expected:**
- Record exists
- `manually_created = true`
- `created_by_user_id` = your admin user ID

#### Workflow 2: Update User Quota

**Steps:**
1. Stay logged in as admin
2. Navigate to Admin tab → User Management
3. Find test user in table
4. Note current quota (e.g., 1000/month)
5. Scroll to "Quota Management" section
6. Find same user in quota table
7. Click "Update Quota" button
8. Enter new limit: 15000
9. Click "Save"
10. Wait for success message
11. Verify quota updated in table (15,000/month)

**Expected Result:**
- Quota updates successfully
- UI reflects new value
- Database updated

**Database Verification:**
```sql
SELECT id, email, monthly_quota
FROM users
WHERE id = 5; -- Replace with test user ID
```

**Expected:**
- `monthly_quota = 15000`

#### Workflow 3: Deactivate and Reactivate User

**Steps:**
1. In User Management table, find test user
2. Click "Toggle Status" button (or switch)
3. Confirm deactivation
4. Verify status badge changes to "Inactive" (red)
5. Open incognito window
6. Try to log in as that user
7. Verify login fails
8. Close incognito window
9. Back in admin panel, click "Toggle Status" again
10. Confirm reactivation
11. Verify status badge changes to "Active" (green)
12. Open incognito window again
13. Log in as user
14. Verify login succeeds

**Expected Result:**
- Deactivation prevents login
- Reactivation restores login
- Status badge updates correctly

#### Workflow 4: Bulk User Activation

**Steps:**
1. In User Management table, search is empty
2. Select 3 users (checkboxes)
3. Choose "Pro" plan
4. Set duration: 1 month
5. Click "Activate (3)"
6. Confirm dialog
7. Wait for success toast
8. Verify all 3 users now show "PRO" badge (green)
9. Verify quota shows 10,000/month

**Expected Result:**
- All 3 users upgraded to Pro
- Database reflects changes

**Database Verification:**
```sql
SELECT id, email, subscription_plan, monthly_quota
FROM users
WHERE id IN (5, 7, 9); -- Replace with selected user IDs
```

**Expected:**
- All have `subscription_plan = 'pro'`
- All have `monthly_quota = 10000`

#### Workflow 5: Filter Payment History

**Steps:**
1. Navigate to Payment History
2. Create 3 manual payments (different methods):
   - Bank Transfer (€29)
   - PayPal (€79)
   - Cash (€199)
3. Wait for all to appear in table
4. Click "All Payment Methods" → "Bank Transfer"
5. Verify only bank transfer payment visible
6. Click "All Sources" → "Manual Only"
7. Verify all 3 payments visible (all manual)
8. Enter customer email in search box
9. Verify only that customer's payments visible
10. Clear search
11. Click "Stripe Only"
12. Verify manual payments disappear

**Expected Result:**
- All filters work correctly
- Combinations of filters work
- No errors in console

### Integration Test Checklist

- [ ] Full payment creation flow works
- [ ] Payment appears in database
- [ ] Quota update flow works
- [ ] Quota persists in database
- [ ] User deactivation prevents login
- [ ] User reactivation restores login
- [ ] Bulk activation works for multiple users
- [ ] All users updated in database
- [ ] Payment filters work correctly
- [ ] Search works across all fields
- [ ] No console errors during workflows
- [ ] No network errors during workflows

---

## Security Testing

### Authentication & Authorization Tests

#### Test Case: Unauthenticated Access

**Steps:**
1. Log out (or open incognito window)
2. Try to access API endpoints directly

**Test URLs:**
```bash
# Should all return 401 Unauthorized
curl http://localhost:3000/api/admin/users
curl http://localhost:3000/api/admin/payments
curl -X PUT http://localhost:3000/api/admin/users/5/quota
curl -X POST http://localhost:3000/api/admin/users/5/toggle
```

**Expected Result:**
- All return 401 Unauthorized
- Response: `{"error": "Unauthorized. Please log in."}`

#### Test Case: Non-Admin Access

**Steps:**
1. Log in as regular user (not admin)
2. Try to access admin endpoints

**Test URLs:**
```bash
# Get session token from browser DevTools → Application → Cookies
curl http://localhost:3000/api/admin/users \
  -H "Cookie: authjs.session-token=REGULAR_USER_TOKEN"
```

**Expected Result:**
- All return 403 Forbidden
- Response: `{"error": "Admin access required."}`

#### Test Case: Admin Tab Not Visible to Regular Users

**Steps:**
1. Log in as regular user
2. Navigate to Dashboard
3. Look for "Admin" tab

**Expected Result:**
- No "Admin" tab visible
- Only Overview, Growth, Engagement, Audience tabs shown

#### Test Case: Direct URL Access

**Steps:**
1. Log in as regular user
2. Manually navigate to: `http://localhost:3000/dashboard?tab=admin`

**Expected Result:**
- Admin tab still not visible
- User redirected or tab content empty

#### Test Case: SQL Injection Attempts

**Test 1: User ID parameter**
```bash
curl -X PUT "http://localhost:3000/api/admin/users/5' OR '1'='1/quota" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN" \
  -d '{"newMonthlyLimit": 10000}'
```

**Expected Result:**
- Returns 400 (invalid user ID)
- No SQL executed
- No data modified

**Test 2: Search field**
```bash
curl -X GET "http://localhost:3000/api/admin/payments?customer_id=5'; DROP TABLE invoices; --" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN"
```

**Expected Result:**
- Invalid input rejected
- No SQL executed
- Table not dropped

#### Test Case: XSS Attempts

**Steps:**
1. Create manual payment with malicious notes:

```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 10.00,
    "payment_method": "cash",
    "payment_notes": "<script>alert(\"XSS\")</script>"
  }'
```

2. Check payment history table
3. Hover over payment notes

**Expected Result:**
- Script tag rendered as text (not executed)
- React escapes HTML by default
- No alert dialog appears

#### Test Case: CSRF Protection

**Steps:**
1. Create HTML file with CSRF attempt:

```html
<!-- csrf-test.html -->
<form action="http://localhost:3000/api/admin/payments" method="POST">
  <input name="customer_id" value="5">
  <input name="amount" value="1000.00">
  <input name="payment_method" value="cash">
  <button type="submit">Submit</button>
</form>
<script>
  document.forms[0].submit();
</script>
```

2. Open file in browser while logged in as admin
3. Observe result

**Expected Result:**
- Request fails (CORS or CSRF protection)
- No payment created

### Security Test Checklist

- [ ] Unauthenticated requests return 401
- [ ] Non-admin requests return 403
- [ ] Admin tab not visible to regular users
- [ ] Direct URL access blocked for non-admins
- [ ] SQL injection attempts rejected
- [ ] XSS attempts escaped/sanitized
- [ ] CSRF protection in place
- [ ] No sensitive data in client-side code
- [ ] No API keys exposed in responses
- [ ] Session tokens httpOnly (check cookies)

---

## Edge Cases & Error Scenarios

### Data Validation Edge Cases

#### Test Case: Extreme Values

**Very Large User ID:**
```bash
curl -X PUT http://localhost:3000/api/admin/users/999999999/quota \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN" \
  -d '{"newMonthlyLimit": 10000}'
```

**Expected:** 404 Not Found

**Very Large Amount:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 99999999999,
    "payment_method": "bank_transfer"
  }'
```

**Expected:** Either accepted or validation error (depending on business rules)

**Very Large Quota:**
```bash
curl -X PUT http://localhost:3000/api/admin/users/5/quota \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN" \
  -d '{"newMonthlyLimit": 999999999}'
```

**Expected:** Accepted (or limit enforced if business rule exists)

#### Test Case: Special Characters

**Unicode in notes:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 10.00,
    "payment_method": "cash",
    "payment_notes": "Payment received 💰 from José María 中文"
  }'
```

**Expected:** Accepted, special characters stored correctly

**Emoji in reference:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 10.00,
    "payment_method": "cash",
    "payment_reference": "TXN-🎵-001"
  }'
```

**Expected:** Accepted or rejected based on validation rules

#### Test Case: Null vs Undefined vs Empty String

**Null values:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 10.00,
    "payment_method": "cash",
    "payment_reference": null,
    "payment_notes": null
  }'
```

**Expected:** Accepted (optional fields)

**Empty strings:**
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=ADMIN_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 10.00,
    "payment_method": "cash",
    "payment_reference": "",
    "payment_notes": ""
  }'
```

**Expected:** Accepted (treated as null/undefined)

#### Test Case: Concurrent Requests

**Steps:**
1. Open 2 browser tabs as admin
2. In both tabs, navigate to Admin panel
3. Tab 1: Click "Add Manual Payment"
4. Tab 2: Click "Add Manual Payment" simultaneously
5. Fill both forms with same customer, different amounts
6. Submit both at the same time (within 1 second)

**Expected Result:**
- Both payments created successfully
- No race condition errors
- Both appear in payment history

#### Test Case: Deleted User Referenced

**Steps:**
1. Create manual payment for user ID 100
2. Delete user ID 100 from database
3. View payment history

**Expected Result:**
- Payment still visible
- Customer email shows as null/empty
- No application errors
- Foreign key constraint allows NULL (ON DELETE SET NULL)

### Network & Performance Edge Cases

#### Test Case: Slow Network

**Steps:**
1. Open browser DevTools
2. Network tab → Throttling → "Slow 3G"
3. Create manual payment
4. Observe behavior

**Expected Result:**
- Loading spinner appears
- Button disabled during request
- Success/error handled correctly
- No timeout errors (within reasonable time)

#### Test Case: Network Disconnect During Request

**Steps:**
1. Start creating manual payment
2. Disconnect WiFi while form submitting
3. Observe error handling

**Expected Result:**
- Error toast appears
- Form not cleared
- User can retry

#### Test Case: Large Dataset Pagination

**Setup:**
1. Create 200+ manual payments (can script this)
2. Navigate to payment history

**Expected Result:**
- Pagination appears
- Each page loads reasonably fast (<2 seconds)
- Page transitions smooth
- No memory leaks

### Edge Case Checklist

- [ ] Very large user ID handled
- [ ] Very large amount handled
- [ ] Very large quota handled
- [ ] Unicode characters work
- [ ] Emoji characters handled
- [ ] Null values handled correctly
- [ ] Empty strings handled correctly
- [ ] Concurrent requests work
- [ ] Deleted user reference handled
- [ ] Slow network doesn't break UI
- [ ] Network disconnect handled gracefully
- [ ] Large dataset pagination works
- [ ] No memory leaks on repeated actions

---

## Performance Testing

### Response Time Benchmarks

#### Test: API Response Times

**Tool:** Browser DevTools → Network tab

**Endpoints to test:**

1. **GET /api/admin/users**
   - Expected: < 500ms
   - Measure: Time to fetch all users

2. **GET /api/admin/payments**
   - Expected: < 1000ms (with 50 results)
   - Measure: Time to fetch payment history

3. **PUT /api/admin/users/[userId]/quota**
   - Expected: < 300ms
   - Measure: Time to update quota

4. **POST /api/admin/users/[userId]/toggle**
   - Expected: < 300ms
   - Measure: Time to toggle status

5. **POST /api/admin/payments**
   - Expected: < 500ms
   - Measure: Time to create manual payment

**How to measure:**
1. Open Network tab
2. Execute action
3. Find API request
4. Check "Time" column

#### Test: Database Query Performance

**Test VIEW performance:**
```sql
-- Should complete in < 100ms for 1000 invoices
EXPLAIN ANALYZE
SELECT *
FROM payment_history_overview
LIMIT 50;
```

**Check index usage:**
```sql
-- Should use indexes, not sequential scan
EXPLAIN ANALYZE
SELECT *
FROM invoices
WHERE payment_method = 'bank_transfer'
  AND manually_created = true
LIMIT 50;
```

**Expected:**
- Index Scan (not Seq Scan)
- Execution time < 50ms

#### Test: UI Rendering Performance

**Test 1: Table with 50 payments**
1. Open payment history
2. Open browser DevTools → Performance
3. Start recording
4. Refresh table
5. Stop recording
6. Check "Scripting" and "Rendering" time

**Expected:**
- Total time < 1000ms
- No long tasks (>50ms)

**Test 2: Filter performance**
1. Enter search term
2. Measure re-render time

**Expected:**
- Instant filter (<100ms)
- Smooth typing (no lag)

### Load Testing (Manual)

#### Test: Rapid Requests

**Steps:**
1. Write simple bash script:

```bash
#!/bin/bash
for i in {1..20}; do
  curl -X POST http://localhost:3000/api/admin/payments \
    -H "Content-Type: application/json" \
    -H "Cookie: authjs.session-token=TOKEN" \
    -d "{
      \"customer_id\": 5,
      \"amount\": $i,
      \"payment_method\": \"cash\",
      \"payment_reference\": \"LOAD-TEST-$i\"
    }" &
done
wait
```

2. Run script
3. Observe results

**Expected:**
- All 20 requests succeed
- No database errors
- No duplicate payments
- All payments visible in UI

#### Test: Concurrent Admin Users

**Steps:**
1. Open 3 browser windows
2. Log in as admin in each
3. All 3 navigate to Admin panel
4. Simultaneously:
   - Window 1: Create payment
   - Window 2: Update quota
   - Window 3: Refresh payment history

**Expected Result:**
- All actions complete successfully
- No race conditions
- Data consistent across windows

### Performance Test Checklist

- [ ] All API endpoints < 1 second
- [ ] Database queries use indexes
- [ ] No sequential scans on large tables
- [ ] UI renders in < 1 second
- [ ] Filtering instant (<100ms)
- [ ] Pagination smooth
- [ ] 20 concurrent requests handled
- [ ] Multiple admin users work simultaneously
- [ ] No memory leaks after 50+ actions
- [ ] No N+1 query problems

---

## Appendix: Quick Reference

### Session Token Extraction

**Chrome/Firefox:**
1. Open DevTools (F12)
2. Application tab (Chrome) or Storage tab (Firefox)
3. Cookies → http://localhost:3000
4. Find `authjs.session-token`
5. Copy value

**Use in cURL:**
```bash
-H "Cookie: authjs.session-token=YOUR_TOKEN_HERE"
```

### Common Test Data

**Test Users:**
```
Admin: admin@example.com
User 1: test1@example.com
User 2: test2@example.com
```

**Test Amounts:**
```
Free: €0
Pro: €29.00
Business: €79.00
Unlimited: €199.00
```

**Payment Methods:**
- `bank_transfer`
- `paypal`
- `cash`
- `crypto`
- `other`

**Currencies:**
- `eur`
- `usd`
- `gbp`

### Database Quick Queries

**Check payment was created:**
```sql
SELECT * FROM invoices WHERE payment_reference = 'YOUR-REF' LIMIT 1;
```

**Check user quota:**
```sql
SELECT email, monthly_quota FROM users WHERE id = 5;
```

**Check user active status:**
```sql
SELECT email, active FROM users WHERE id = 5;
```

**Count manual payments:**
```sql
SELECT COUNT(*) FROM invoices WHERE manually_created = true;
```

**Get admin's created payments:**
```sql
SELECT COUNT(*) FROM invoices WHERE created_by_user_id = 1;
```

### Error Code Reference

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Successful GET |
| 201 | Created | Successful POST (payment created) |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Not admin |
| 404 | Not Found | User/resource doesn't exist |
| 500 | Server Error | Database error, unexpected error |

### Test Prioritization

**Critical (Must Pass):**
- [ ] Admin authentication/authorization
- [ ] Create manual payment (bank transfer)
- [ ] Payment appears in database
- [ ] Non-admin blocked from endpoints
- [ ] SQL injection prevented

**High Priority:**
- [ ] All payment methods work
- [ ] Quota update works
- [ ] User toggle works
- [ ] Payment filters work
- [ ] Search works

**Medium Priority:**
- [ ] Pagination works
- [ ] Bulk activation works
- [ ] All edge cases handled
- [ ] Performance acceptable

**Low Priority (Nice to Have):**
- [ ] Badge colors correct
- [ ] Date formatting correct
- [ ] Currency formatting correct

---

## Testing Sign-Off

**Tester Name:** _________________________
**Date:** _________________________
**Environment:** _________________________
**Database:** _________________________

**Overall Result:**
- [ ] All critical tests passed
- [ ] All high priority tests passed
- [ ] Known issues documented below

**Issues Found:**

| Issue # | Severity | Description | Status |
|---------|----------|-------------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Notes:**

---

**End of Testing Guide**

For questions or issues, contact the development team or refer to:
- Architecture docs: `/docs/architecture/`
- API documentation: `/docs/features/`
- Database schema: `/database-schema.sql`
