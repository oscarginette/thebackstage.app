# Admin System Testing - Quick Checklist

**Version:** 1.0
**Date:** 2025-12-30
**Reference:** See ADMIN_TESTING_GUIDE.md for detailed test procedures

---

## Pre-Flight Checklist

- [ ] Application running locally
- [ ] Database migration applied (`migration-manual-payments.sql`)
- [ ] Admin account ready
- [ ] Test user accounts created (minimum 3)
- [ ] Browser DevTools open (Network + Console tabs)

---

## Database Migration Tests

- [ ] 5 new columns exist in `invoices` table
- [ ] 3 indexes created successfully
- [ ] `payment_history_overview` VIEW exists
- [ ] VIEW returns data correctly
- [ ] Foreign key constraint works

---

## API Endpoint Tests

### PUT /api/admin/users/[userId]/quota

- [ ] Successful quota update (200)
- [ ] Invalid user ID returns 404
- [ ] Negative value returns 400
- [ ] Non-admin returns 403
- [ ] Missing field returns 400

### POST /api/admin/users/[userId]/toggle

- [ ] Deactivate user (200)
- [ ] Reactivate user (200)
- [ ] Admin cannot deactivate self (400)
- [ ] Invalid boolean returns 400
- [ ] Deactivated user cannot log in

### GET /api/admin/payments

- [ ] Fetch all payments (200)
- [ ] Filter by payment method works
- [ ] Filter manual/Stripe works
- [ ] Filter by customer ID works
- [ ] Pagination works
- [ ] Date range filter works
- [ ] Combined filters work

### POST /api/admin/payments

- [ ] Bank transfer payment created (201)
- [ ] PayPal payment created (201)
- [ ] Cash payment created (201)
- [ ] Crypto payment created (201)
- [ ] Missing fields returns 400
- [ ] Invalid customer returns 400
- [ ] Negative amount returns 400
- [ ] Zero amount returns 400
- [ ] EUR/USD/GBP currencies work

---

## Component Tests

### PaymentHistoryTable

- [ ] Table loads without errors
- [ ] Search by email works
- [ ] Payment method filter works
- [ ] Manual/Stripe filter works
- [ ] Pagination works
- [ ] Badge colors correct
- [ ] Date formatting correct
- [ ] Amount formatting correct

### ManualPaymentForm

- [ ] Form opens correctly
- [ ] Customer dropdown populated
- [ ] Amount validation works
- [ ] All payment methods selectable
- [ ] Currency selector works
- [ ] Form submission succeeds
- [ ] Success toast appears
- [ ] Form closes and resets
- [ ] Error handling works

### UserManagementTable

- [ ] Table loads all users
- [ ] Search filters correctly
- [ ] Checkbox selection works
- [ ] Bulk activation works
- [ ] Plan limits display correctly
- [ ] Badge colors correct

---

## Integration Tests

- [ ] Full payment creation flow
- [ ] Quota update flow
- [ ] User deactivation/reactivation flow
- [ ] Bulk user activation flow
- [ ] Payment filtering workflow

---

## Security Tests

- [ ] Unauthenticated requests return 401
- [ ] Non-admin requests return 403
- [ ] Admin tab hidden for regular users
- [ ] SQL injection attempts blocked
- [ ] XSS attempts escaped
- [ ] CSRF protection in place

---

## Edge Cases

- [ ] Very large values handled
- [ ] Unicode/emoji characters work
- [ ] Null values handled
- [ ] Concurrent requests work
- [ ] Deleted user reference handled
- [ ] Network disconnect handled
- [ ] Large dataset pagination works

---

## Performance Tests

- [ ] All API endpoints < 1 second
- [ ] Database queries use indexes
- [ ] UI renders in < 1 second
- [ ] 20 concurrent requests handled
- [ ] Multiple admin users work simultaneously

---

## Critical Path (Must Pass Before Production)

1. [ ] Admin login works
2. [ ] Non-admin blocked from all endpoints
3. [ ] Manual payment creation works (all methods)
4. [ ] Payments stored in database correctly
5. [ ] Payment history displays correctly
6. [ ] Quota update works and persists
7. [ ] User toggle works and prevents login
8. [ ] No SQL injection vulnerabilities
9. [ ] No XSS vulnerabilities
10. [ ] Session authentication secure

---

## Quick Test Commands

### Get Session Token
```bash
# Chrome DevTools → Application → Cookies → authjs.session-token
```

### Test Create Payment
```bash
curl -X POST http://localhost:3000/api/admin/payments \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_TOKEN" \
  -d '{
    "customer_id": 5,
    "amount": 29.00,
    "currency": "eur",
    "payment_method": "bank_transfer",
    "payment_reference": "TEST-001"
  }'
```

### Test Update Quota
```bash
curl -X PUT http://localhost:3000/api/admin/users/5/quota \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_TOKEN" \
  -d '{"newMonthlyLimit": 15000}'
```

### Test Toggle User
```bash
curl -X POST http://localhost:3000/api/admin/users/5/toggle \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_TOKEN" \
  -d '{"active": false}'
```

### Verify Database
```sql
-- Check payment created
SELECT * FROM invoices WHERE payment_reference = 'TEST-001';

-- Check quota updated
SELECT email, monthly_quota FROM users WHERE id = 5;

-- Check user status
SELECT email, active FROM users WHERE id = 5;
```

---

## Sign-Off

**Tester:** _________________________
**Date:** _________________________
**Result:** [ ] PASS [ ] FAIL

**Blockers:**

---

**For detailed test procedures, see ADMIN_TESTING_GUIDE.md**
