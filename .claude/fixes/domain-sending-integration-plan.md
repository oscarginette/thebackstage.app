# Domain Sending Integration - Critical Fixes

## Problem Summary

Users can verify custom sending domains via `/settings/sending-domains`, but these verified domains are NOT actually used when sending emails. The email sending logic (`SendDraftUseCase`, `MailgunEmailProvider`) doesn't validate domain verification status, leading to:

1. Emails sent from unverified domains (likely to spam)
2. Mailgun API errors if domain not registered
3. No user notification of domain issues
4. Inconsistent "from" addresses

---

## Critical Fixes Required

### Fix 1: Validate Verified Domain Before Sending

**File**: `domain/services/SendDraftUseCase.ts`

**Current Code** (lines 310-320):
```typescript
const senderEmail = user.senderEmail
  ? `${user.senderName || user.name} <${user.senderEmail}>`
  : `${user.senderName || user.name} <noreply@${this.defaultDomain}>`;

await this.emailProvider.send({
  from: senderEmail, // ❌ No validation
  to: contact.email,
  // ...
});
```

**Required Change**:
```typescript
// 1. Extract domain from senderEmail
const domain = user.senderEmail
  ? extractDomainFromEmail(user.senderEmail)
  : this.defaultDomain;

// 2. Validate domain is verified (only if custom domain)
let effectiveSenderEmail = senderEmail;
if (user.senderEmail && domain !== this.defaultDomain) {
  const sendingDomain = await this.sendingDomainRepository.findByUserIdAndDomain(
    user.id,
    domain
  );

  if (!sendingDomain || sendingDomain.status !== 'verified') {
    console.warn(`[SendDraftUseCase] Domain ${domain} not verified for user ${user.id}, using default`);
    effectiveSenderEmail = `${user.senderName || user.name} <noreply@${this.defaultDomain}>`;
  }
}

// 3. Use validated email
await this.emailProvider.send({
  from: effectiveSenderEmail,
  // ...
});
```

**Dependencies**:
- Add `sendingDomainRepository: ISendingDomainRepository` to constructor
- Create `extractDomainFromEmail()` utility function
- Update DI container to inject repository

---

### Fix 2: Domain Validation in MailgunEmailProvider

**File**: `infrastructure/email/MailgunEmailProvider.ts`

**Current Code** (lines 105, 141):
```typescript
const fromDomain = this.extractDomainFromEmail(messageData.from);
const response = await this.mg.messages.create(fromDomain, messageData);
// ❌ No validation that domain exists in Mailgun
```

**Required Change**:
```typescript
const fromDomain = this.extractDomainFromEmail(messageData.from);

// Validate domain is registered in Mailgun
// Option A: Maintain in-memory cache of registered domains
// Option B: Try-catch and fallback to default domain
try {
  const response = await this.mg.messages.create(fromDomain, messageData);
  return { success: true, id: response.id };
} catch (error: any) {
  // If domain not found in Mailgun, retry with default
  if (error.status === 404 || error.message.includes('domain not found')) {
    console.warn(`[MailgunEmailProvider] Domain ${fromDomain} not found in Mailgun, using default: ${this.domain}`);
    const response = await this.mg.messages.create(this.domain, {
      ...messageData,
      from: messageData.from.replace(fromDomain, this.domain)
    });
    return { success: true, id: response.id };
  }
  throw error; // Re-throw other errors
}
```

**Alternative (Better)**:
- Add domain validation to `SendDraftUseCase` (Fix 1) to prevent reaching this point
- Keep this as last-resort fallback

---

### Fix 3: Campaign Preview Shows Sender Email

**File**: `components/dashboard/CampaignPreviewModal.tsx`

**Required Addition**:
```tsx
// Add sender email display in preview
<div className="border-b border-border pb-4 mb-4">
  <p className="text-sm text-muted-foreground">From:</p>
  <p className="font-medium">{campaign.senderEmail || `noreply@${DEFAULT_DOMAIN}`}</p>
  {!isVerifiedDomain(campaign.senderEmail) && (
    <p className="text-xs text-yellow-600 mt-1">
      ⚠️ Domain not verified - will send from default domain
    </p>
  )}
</div>
```

---

### Fix 4: Domain Selection in Campaign Creation

**File**: `components/dashboard/EmailEditorModal.tsx` (or new component)

**Required Addition**:
```tsx
// In campaign creation form
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">
    Sender Email
  </label>
  <select
    value={selectedDomain}
    onChange={(e) => setSelectedDomain(e.target.value)}
    className="w-full px-3 py-2 border rounded"
  >
    <option value="default">Default (noreply@thebackstage.app)</option>
    {verifiedDomains.map(domain => (
      <option key={domain.id} value={domain.domainName}>
        {user.senderEmail || `info@${domain.domainName}`}
      </option>
    ))}
  </select>
  {verifiedDomains.length === 0 && (
    <p className="text-sm text-muted-foreground mt-1">
      <Link href="/settings/sending-domains" className="text-primary hover:underline">
        Add a verified domain
      </Link> to send from your own email
    </p>
  )}
</div>
```

---

### Fix 5: Add Utility Function

**File**: `domain/utils/email-utils.ts` (new file)

```typescript
/**
 * Extract domain from email address
 * Supports formats:
 * - "info@geebeat.com" → "geebeat.com"
 * - "Artist Name <info@geebeat.com>" → "geebeat.com"
 */
export function extractDomainFromEmail(emailAddress: string): string {
  // Extract email from "Name <email@domain.com>" format
  const emailMatch = emailAddress.match(/<(.+?)>/);
  const email = emailMatch ? emailMatch[1] : emailAddress;

  // Extract domain from email@domain.com
  const domainMatch = email.match(/@(.+)$/);
  if (!domainMatch || !domainMatch[1]) {
    throw new Error(`Invalid email format: ${emailAddress}`);
  }

  return domainMatch[1].trim();
}
```

---

## Implementation Checklist

### Critical (Phase 1)
- [ ] Create `extractDomainFromEmail()` utility function
- [ ] Add `sendingDomainRepository` to `SendDraftUseCase` constructor
- [ ] Implement domain validation in `SendDraftUseCase.execute()`
- [ ] Update DI container to inject repository
- [ ] Add try-catch fallback in `MailgunEmailProvider.send()`
- [ ] Test: Send campaign with verified domain
- [ ] Test: Send campaign with unverified domain (should fallback)

### Important (Phase 2)
- [ ] Add sender email preview in `CampaignPreviewModal`
- [ ] Add domain selection dropdown in campaign creation
- [ ] Fetch verified domains in campaign creation page
- [ ] Show warning if no verified domains
- [ ] Test: Create campaign with domain selection

### Nice-to-Have (Phase 3)
- [ ] Cron job to re-verify domains periodically
- [ ] Email notification if domain verification fails
- [ ] Domain health dashboard
- [ ] Auto-retry domain verification with exponential backoff

---

## Testing Strategy

### Unit Tests
1. `extractDomainFromEmail()` with various formats
2. `SendDraftUseCase` with verified/unverified domains
3. `MailgunEmailProvider` fallback logic

### Integration Tests
1. End-to-end: Add domain → Verify → Send campaign → Check "from" address
2. Unverified domain: Send campaign → Verify fallback to default
3. Domain verification failure: Check error handling

### Manual Testing
1. Add `geebeat.com` domain
2. Verify via Mailgun
3. Set `info@geebeat.com` as sender email
4. Send test campaign
5. Verify email "from" header in Gmail

---

## Files to Modify

1. `domain/utils/email-utils.ts` (new)
2. `domain/services/SendDraftUseCase.ts`
3. `infrastructure/email/MailgunEmailProvider.ts`
4. `lib/di-container.ts`
5. `components/dashboard/CampaignPreviewModal.tsx`
6. `components/dashboard/EmailEditorModal.tsx` (or campaign creation)
7. `app/campaigns/create/page.tsx` (or wherever campaigns are created)

---

## Estimated Complexity

- **Fix 1 (SendDraftUseCase)**: Medium (2-3 hours)
- **Fix 2 (MailgunEmailProvider)**: Low (1 hour)
- **Fix 3 (Preview)**: Low (1 hour)
- **Fix 4 (Domain Selection)**: Medium (2-3 hours)
- **Fix 5 (Utility)**: Low (30 min)
- **Testing**: Medium (2-3 hours)

**Total**: 1-2 days for complete integration

---

## Priority Ranking

1. **P0 (Critical)**: Fix 1 + Fix 2 (domain validation before sending)
2. **P1 (High)**: Fix 3 (preview sender email)
3. **P2 (Medium)**: Fix 4 (domain selection UI)
4. **P3 (Low)**: Phase 3 features (monitoring, cron jobs)

---

*Generated: 2026-01-15*
*Issue: Verified domains not used in email sending*
*Impact: High (emails may go to spam or fail)*
