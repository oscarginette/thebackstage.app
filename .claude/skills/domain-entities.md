---
skill: domain-entities
description: Complete reference of all domain entities with fields, types, and methods. Auto-generated from source code.
---

# Domain Entities Reference

**Auto-generated**: 2025-12-30T18:05:23.608Z
**Source**: `domain/entities/*.ts`

> This documentation is automatically updated when any entity file is modified.
> Use this as the source of truth for entity structure, field names, and types.

---

## Table of Contents

- [ConsentHistory](#consenthistory)
- [Contact](#contact)
- [DownloadAnalytics](#downloadanalytics)
- [DownloadGate](#downloadgate)
- [DownloadSubmission](#downloadsubmission)
- [EmailCampaign](#emailcampaign)
- [EmailEvent](#emailevent)
- [EmailTemplate](#emailtemplate)
- [ImportedContact](#importedcontact)
- [ImportPreview](#importpreview)
- [Invoice](#invoice)
- [MusicTrack](#musictrack)
- [Price](#price)
- [PricingPlan](#pricingplan)
- [Product](#product)
- [QuotaTracking](#quotatracking)
- [Subscription](#subscription)
- [SubscriptionHistory](#subscriptionhistory)
- [Track](#track)
- [User](#user)
- [UserSettings](#usersettings)

---

## ConsentHistory

**Location**: `domain/entities/ConsentHistory.ts`

### Types

```typescript
export type ConsentMetadata = ConsentHistoryMetadata
```

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `number` |  |  |
| `contactId` | `number` |  |  |
| `action` | `ConsentAction` |  |  |
| `timestamp` | `Date` |  |  |
| `source` | `ConsentSource` |  |  |
| `ipAddress` | `string | null` |  |  |
| `userAgent` | `string | null` |  |  |
| `metadata` | `ConsentMetadata | null` |  |  |
| `createdAt` | `Date` |  |  |

### Factory Methods

#### `createUnsubscribe()`

```typescript
static createUnsubscribe( contactId: number, ipAddress: string | null, userAgent: string | null, reason?: string ): Omit<ConsentHistory, 'id' | 'createdAt' | 'isUnsubscribe' | 'isResubscribe' | 'getDescription'>
```

#### `createResubscribe()`

```typescript
static createResubscribe( contactId: number, ipAddress: string | null, userAgent: string | null ): Omit<ConsentHistory, 'id' | 'createdAt' | 'isUnsubscribe' | 'isResubscribe' | 'getDescription'>
```

#### `createBounce()`

```typescript
static createBounce( contactId: number, bounceType: 'hard' | 'soft', reason: string ): Omit<ConsentHistory, 'id' | 'createdAt' | 'isUnsubscribe' | 'isResubscribe' | 'getDescription'>
```

### Business Methods

#### `isUnsubscribe()`

```typescript
isUnsubscribe(): boolean
```

#### `isResubscribe()`

Check if this is an unsubscribe action / isUnsubscribe

```typescript
isResubscribe(): boolean
```

---

## Contact

**Location**: `domain/entities/Contact.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `number` |  |  |
| `email` | `Email` |  |  |
| `unsubscribeToken` | `string` |  |  |
| `subscribed` | `boolean` |  |  |
| `name` | `string | null` | ✓ |  |
| `createdAt` | `Date` | ✓ |  |

### Factory Methods

#### `create()`

```typescript
static create(props:
```

### Business Methods

#### `isSubscribed()`

```typescript
isSubscribed(): boolean
```

---

## DownloadAnalytics

**Location**: `domain/entities/DownloadAnalytics.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `number` |  |  |
| `gateId` | `string` |  |  |
| `eventType` | `EventType` |  |  |
| `sessionId` | `string | null` |  |  |
| `referrer` | `string | null` |  |  |
| `utmSource` | `string | null` |  |  |
| `utmMedium` | `string | null` |  |  |
| `utmCampaign` | `string | null` |  |  |
| `ipAddress` | `string | null` |  |  |
| `userAgent` | `string | null` |  |  |
| `country` | `string | null` |  |  |
| `createdAt` | `Date` |  |  |

### Factory Methods

#### `fromDatabase()`

```typescript
static fromDatabase(row: any): DownloadAnalytics
```

#### `createNew()`

```typescript
static createNew(input: CreateAnalyticsInput): DownloadAnalytics
```

### Business Methods

#### `hasUTMTracking()`

```typescript
hasUTMTracking(): boolean
```

---

## DownloadGate

**Location**: `domain/entities/DownloadGate.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `string` |  |  |
| `userId` | `number` |  |  |
| `slug` | `string` |  |  |
| `title` | `string` |  |  |
| `artistName` | `string | null` |  |  |
| `genre` | `string | null` |  |  |
| `description` | `string | null` |  |  |
| `artworkUrl` | `string | null` |  |  |
| `soundcloudTrackId` | `string | null` |  |  |
| `soundcloudTrackUrl` | `string | null` |  |  |
| `soundcloudUserId` | `string | null` |  |  |
| `fileUrl` | `string` |  |  |
| `fileSizeMb` | `number | null` |  |  |
| `fileType` | `string | null` |  |  |
| `requireEmail` | `boolean` |  |  |
| `requireSoundcloudRepost` | `boolean` |  |  |
| `requireSoundcloudFollow` | `boolean` |  |  |
| `requireSpotifyConnect` | `boolean` |  |  |
| `active` | `boolean` |  |  |
| `maxDownloads` | `number | null` |  |  |
| `expiresAt` | `Date | null` |  |  |
| `createdAt` | `Date` |  |  |
| `updatedAt` | `Date` |  |  |

### Factory Methods

#### `fromDatabase()`

```typescript
static fromDatabase(props: DownloadGateProps): DownloadGate
```

#### `create()`

```typescript
static create(props: Omit<DownloadGateProps, 'id' | 'createdAt' | 'updatedAt' | 'active'>): DownloadGate
```

### Business Methods

#### `isActive()`

```typescript
isActive(): boolean
```

---

## DownloadSubmission

**Location**: `domain/entities/DownloadSubmission.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `string` |  |  |
| `gateId` | `string` |  |  |
| `email` | `string` |  |  |
| `firstName` | `string | null` | ✓ |  |
| `soundcloudUserId` | `string | null` | ✓ |  |
| `soundcloudUsername` | `string | null` | ✓ |  |
| `soundcloudPermalink` | `string | null` | ✓ |  |
| `spotifyUserId` | `string | null` | ✓ |  |
| `spotifyDisplayName` | `string | null` | ✓ |  |
| `emailVerified` | `boolean` |  |  |
| `soundcloudRepostVerified` | `boolean` |  |  |
| `soundcloudRepostVerifiedAt` | `Date | null` | ✓ |  |
| `soundcloudFollowVerified` | `boolean` |  |  |
| `soundcloudFollowVerifiedAt` | `Date | null` | ✓ |  |
| `spotifyConnected` | `boolean` |  |  |
| `spotifyConnectedAt` | `Date | null` | ✓ |  |
| `downloadToken` | `string | null` | ✓ |  |
| `downloadTokenGeneratedAt` | `Date | null` | ✓ |  |
| `downloadTokenExpiresAt` | `Date | null` | ✓ |  |
| `downloadCompleted` | `boolean` |  |  |
| `downloadCompletedAt` | `Date | null` | ✓ |  |
| `consentMarketing` | `boolean` |  |  |
| `ipAddress` | `string | null` | ✓ |  |
| `userAgent` | `string | null` | ✓ |  |
| `createdAt` | `Date` |  |  |
| `updatedAt` | `Date` |  |  |

### Factory Methods

#### `fromDatabase()`

```typescript
static fromDatabase(props: DownloadSubmissionProps): DownloadSubmission
```

#### `create()`

```typescript
static create(props: Pick<DownloadSubmissionProps, 'gateId' | 'email' | 'firstName' | 'consentMarketing' | 'ipAddress' | 'userAgent'>): DownloadSubmission
```

---

## EmailCampaign

**Location**: `domain/entities/EmailCampaign.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `string` |  |  |
| `templateId` | `string | null` |  |  |
| `trackId` | `string | null` |  |  |
| `subject` | `string` |  |  |
| `htmlContent` | `string` |  |  |
| `status` | `'draft' | 'sent'` |  |  |
| `scheduledAt` | `Date | null` |  |  |
| `sentAt` | `Date | null` |  |  |
| `createdAt` | `Date` |  |  |
| `updatedAt` | `Date` |  |  |

### Factory Methods

#### `create()`

```typescript
static create(props:
```

#### `fromDatabase()`

```typescript
static fromDatabase(row: any): EmailCampaign
```

### Business Methods

#### `isDraft()`

```typescript
isDraft(): boolean
```

#### `isSent()`

Check if campaign is a draft / isDraft

```typescript
isSent(): boolean
```

#### `isScheduled()`

Check if campaign is a draft / isDraft

```typescript
isScheduled(): boolean
```

#### `hasTrack()`

Check if campaign is scheduled for future sending / isScheduled

```typescript
hasTrack(): boolean
```

#### `hasTemplate()`

Check if campaign is linked to a track / hasTrack

```typescript
hasTemplate(): boolean
```

#### `isCustomEmail()`

Check if campaign is based on a template / hasTemplate

```typescript
isCustomEmail(): boolean
```

#### `markAsSent()`

```typescript
markAsSent(): EmailCampaign
```

#### `update()`

```typescript
update(props:
```

#### `toJSON()`

```typescript
toJSON(): EmailCampaignProps
```

---

## EmailEvent

**Location**: `domain/entities/EmailEvent.ts`

### Types

```typescript
export type EmailEventType = 'sent' | 'delivered' | 'bounced' | 'opened' | 'clicked' | 'failed'
```

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `number` |  |  |
| `contactId` | `number` |  |  |
| `trackId` | `string` |  |  |
| `type` | `EmailEventType` |  |  |
| `resendEmailId` | `string | null` | ✓ |  |
| `error` | `string | null` | ✓ |  |
| `createdAt` | `Date` | ✓ |  |

### Factory Methods

#### `create()`

```typescript
static create(props:
```

### Business Methods

#### `isSuccess()`

```typescript
isSuccess(): boolean
```

#### `isFailed()`

```typescript
isFailed(): boolean
```

#### `isEngagement()`

```typescript
isEngagement(): boolean
```

---

## EmailTemplate

**Location**: `domain/entities/EmailTemplate.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `string` |  |  |
| `name` | `string` |  |  |
| `description` | `string | null` |  |  |
| `mjmlContent` | `object` |  |  |
| `htmlSnapshot` | `string` |  |  |
| `isDefault` | `boolean` |  |  |
| `version` | `number` |  |  |
| `createdAt` | `Date` |  |  |
| `updatedAt` | `Date` |  |  |
| `parentTemplateId` | `string | null` | ✓ |  |
| `deletedAt` | `Date | null` | ✓ |  |

### Factory Methods

#### `create()`

```typescript
static create(props:
```

#### `fromDatabase()`

```typescript
static fromDatabase(row: any): EmailTemplate
```

### Business Methods

#### `isLatestVersion()`

```typescript
isLatestVersion(): boolean
```

#### `isActive()`

Check if this template is the latest version / isLatestVersion

```typescript
isActive(): boolean
```

#### `canBeUsed()`

Check if template is active (not soft deleted) / isActive

```typescript
canBeUsed(): boolean
```

#### `createNewVersion()`

```typescript
createNewVersion(props:
```

#### `update()`

```typescript
update(props:
```

#### `delete()`

```typescript
delete(): EmailTemplate
```

#### `toJSON()`

```typescript
toJSON(): EmailTemplateProps
```

---

## ImportedContact

**Location**: `domain/entities/ImportedContact.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `email` | `string` |  |  |
| `name` | `string | null` |  |  |
| `subscribed` | `boolean` |  |  |
| `metadata` | `ContactMetadata` |  |  |
| `rowNumber` | `number` |  |  |

### Factory Methods

#### `create()`

```typescript
static create( email: string, name: string | null, subscribed: boolean, metadata: ContactMetadata, rowNumber: number ): ImportedContact
```

---

## ImportPreview

**Location**: `domain/entities/ImportPreview.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `filename` | `string` |  |  |
| `fileType` | `'csv' | 'json' | 'brevo'` |  |  |
| `totalRows` | `number` |  |  |
| `detectedColumns` | `DetectedColumn[]` |  |  |
| `sampleRows` | `any[]` |  |  |
| `rawData` | `any[] // Full parsed data (for execute step` |  |  |

### Factory Methods

#### `create()`

```typescript
static create( filename: string, fileType: 'csv' | 'json' | 'brevo', rawData: any[], detectedColumns: DetectedColumn[] ): ImportPreview
```

---

## Invoice

**Location**: `domain/entities/Invoice.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `string` |  |  |
| `object` | `string` |  |  |
| `customer_id` | `number` |  |  |
| `subscription_id` | `string | null` |  |  |
| `amount_due` | `number` |  |  |
| `amount_paid` | `number` |  |  |
| `amount_remaining` | `number` |  |  |
| `subtotal` | `number` |  |  |
| `total` | `number` |  |  |
| `tax` | `number` |  |  |
| `currency` | `string` |  |  |
| `status` | `'draft' | 'open' | 'paid' | 'void' | 'uncollectible'` |  |  |
| `billing_reason` | `string | null` |  |  |
| `created` | `Date` |  |  |
| `period_start` | `Date | null` |  |  |
| `period_end` | `Date | null` |  |  |
| `due_date` | `Date | null` |  |  |
| `paid` | `boolean` |  |  |
| `paid_at` | `Date | null` |  |  |
| `payment_intent_id` | `string | null` |  |  |
| `payment_method` | `PaymentMethod | null` |  |  |
| `payment_reference` | `string | null` |  |  |
| `payment_notes` | `string | null` |  |  |
| `manually_created` | `boolean` |  |  |
| `created_by_user_id` | `number | null` |  |  |
| `metadata` | `Record<string, any>` |  |  |
| `description` | `string | null` |  |  |
| `invoice_pdf` | `string | null` |  |  |
| `hosted_invoice_url` | `string | null` |  |  |
| `livemode` | `boolean` |  |  |

### Factory Methods

#### `fromDatabase()`

```typescript
static fromDatabase(row: any): Invoice
```

#### `createManual()`

```typescript
static createManual(params:
```

### Business Methods

#### `isPaid()`

```typescript
isPaid(): boolean
```

#### `isOverdue()`

Check if invoice is paid / isPaid

```typescript
isOverdue(): boolean
```

#### `isManualPayment()`

Get total in EUR (converted from cents) / getTotalInEur

```typescript
isManualPayment(): boolean
```

#### `toObject()`

Check if this is a manual payment / isManualPayment

```typescript
toObject(): InvoiceProps
```

#### `toPublic()`

Return invoice data as plain object / toObject

```typescript
toPublic(): Omit<InvoiceProps, 'livemode'>
```

---

## MusicTrack

**Location**: `domain/entities/MusicTrack.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `string` |  |  |
| `title` | `string` |  |  |
| `url` | `string` |  |  |
| `coverImage` | `string | null` |  |  |
| `publishedAt` | `Date` |  |  |
| `platform` | `'soundcloud' | 'spotify' | 'bandcamp'` |  |  |
| `artist` | `string` | ✓ |  |

### Factory Methods

#### `fromSoundCloudRSS()`

```typescript
static fromSoundCloudRSS(data: any): MusicTrack
```

#### `fromSpotify()`

```typescript
static fromSpotify(data:
```

### Business Methods

#### `isNewSince()`

```typescript
isNewSince(date: Date): boolean
```

---

## Price

**Location**: `domain/entities/Price.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `string` |  |  |
| `object` | `string` |  |  |
| `productId` | `string` |  |  |
| `active` | `boolean` |  |  |
| `currency` | `string` |  |  |
| `unitAmount` | `number` |  |  |

### Factory Methods

#### `create()`

```typescript
static create(params:
```

#### `createMonthly()`

```typescript
static createMonthly(params:
```

#### `createYearly()`

```typescript
static createYearly(params:
```

### Business Methods

#### `isRecurring()`

```typescript
isRecurring(): boolean
```

#### `isOneTime()`

```typescript
isOneTime(): boolean
```

#### `isMonthly()`

```typescript
isMonthly(): boolean
```

#### `isYearly()`

```typescript
isYearly(): boolean
```

#### `isFree()`

```typescript
isFree(): boolean
```

#### `toJSON()`

```typescript
toJSON(): Record<string, any>
```

---

## PricingPlan

**Location**: `domain/entities/PricingPlan.ts`

### Types

```typescript
export type PlanTier = 'free' | 'pro' | 'business' | 'unlimited'
```

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `number` |  |  |
| `planName` | `string` |  |  |
| `maxContacts` | `number` |  |  |
| `maxMonthlyEmails` | `number | null` |  |  |
| `priceMonthlyEur` | `number` |  |  |
| `features` | `string[]` |  |  |
| `active` | `boolean` |  |  |
| `createdAt` | `Date` |  |  |
| `updatedAt` | `Date` |  |  |

### Factory Methods

#### `fromDatabase()`

```typescript
static fromDatabase( id: number, planName: string, maxContacts: number, maxMonthlyEmails: number | null, priceMonthlyEur: number, features: string[] | any, // Handle JSONB active: boolean, createdAt: Date, updatedAt: Date ): PricingPlan
```

#### `validateTier()`

```typescript
static validateTier(tier: string):
```

#### `getPlanTierFromName()`

```typescript
static getPlanTierFromName(planName: string): PlanTier | null
```

#### `getPlanNameFromTier()`

```typescript
static getPlanNameFromTier(tier: PlanTier): string
```

### Business Methods

#### `isFree()`

```typescript
isFree(): boolean
```

#### `hasUnlimitedEmails()`

Check if this is the Free tier / isFree

```typescript
hasUnlimitedEmails(): boolean
```

#### `supportsContactCount()`

Check if this plan has unlimited emails / hasUnlimitedEmails

```typescript
supportsContactCount(contactCount: number): boolean
```

#### `supportsEmailVolume()`

Check if this plan supports a given number of contacts / supportsContactCount

```typescript
supportsEmailVolume(emailCount: number): boolean
```

#### `compareTier()`

```typescript
compareTier(otherPlan: PricingPlan): number
```

#### `isUpgradeTo()`

```typescript
isUpgradeTo(targetPlan: PricingPlan): boolean
```

#### `isDowngradeTo()`

Check if upgrading from current plan to target plan / isUpgradeTo

```typescript
isDowngradeTo(targetPlan: PricingPlan): boolean
```

#### `toJSON()`

Check if downgrading from current plan to target plan / isDowngradeTo

```typescript
toJSON():
```

---

## Product

**Location**: `domain/entities/Product.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `string` |  |  |
| `object` | `string` |  |  |
| `name` | `string` |  |  |
| `description` | `string | null` |  |  |
| `active` | `boolean` |  |  |
| `marketingFeatures` | `MarketingFeature[]` |  |  |
| `metadata` | `ProductMetadata` |  |  |
| `created` | `Date` |  |  |
| `updated` | `Date` |  |  |
| `livemode` | `boolean` |  |  |

### Factory Methods

#### `create()`

```typescript
static create(params:
```

### Business Methods

#### `isFree()`

```typescript
isFree(): boolean
```

#### `hasUnlimitedEmails()`

```typescript
hasUnlimitedEmails(): boolean
```

#### `compareTier()`

```typescript
compareTier(other: Product): number
```

#### `isUpgradeTo()`

```typescript
isUpgradeTo(other: Product): boolean
```

#### `isDowngradeTo()`

```typescript
isDowngradeTo(other: Product): boolean
```

#### `supportsContactCount()`

```typescript
supportsContactCount(count: number): boolean
```

#### `supportsEmailVolume()`

Check if product can support a given contact count / supportsContactCount

```typescript
supportsEmailVolume(volume: number): boolean
```

#### `toJSON()`

Check if product can support a given email volume / supportsEmailVolume

```typescript
toJSON(): Record<string, any>
```

---

## QuotaTracking

**Location**: `domain/entities/QuotaTracking.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `number` |  |  |
| `userId` | `number` |  |  |
| `emailsSentToday` | `number` |  |  |
| `lastResetDate` | `Date` |  |  |
| `monthlyLimit` | `number` |  |  |
| `createdAt` | `Date` |  |  |
| `updatedAt` | `Date` |  |  |

### Factory Methods

#### `create()`

```typescript
static create( id: number, userId: number, emailsSentToday: number, lastResetDate: Date, monthlyLimit: number, createdAt: Date, updatedAt: Date ): QuotaTracking
```

#### `createNew()`

```typescript
static createNew(userId: number, monthlyLimit: number): QuotaTracking
```

### Business Methods

#### `canSendEmail()`

```typescript
canSendEmail(): boolean
```

#### `needsReset()`

```typescript
needsReset(): boolean
```

---

## Subscription

**Location**: `domain/entities/Subscription.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `string` |  |  |
| `object` | `string` |  |  |
| `customerId` | `number` |  |  |
| `status` | `SubscriptionStatus` |  |  |
| `currentPeriodStart` | `Date` |  |  |
| `currentPeriodEnd` | `Date` |  |  |
| `billingCycleAnchor` | `Date` |  |  |
| `cancelAtPeriodEnd` | `boolean` |  |  |
| `cancelAt` | `Date | null` |  |  |
| `canceledAt` | `Date | null` |  |  |
| `endedAt` | `Date | null` |  |  |
| `trialStart` | `Date | null` |  |  |
| `trialEnd` | `Date | null` |  |  |
| `created` | `Date` |  |  |
| `startDate` | `Date` |  |  |
| `metadata` | `SubscriptionMetadata` |  |  |
| `collectionMethod` | `CollectionMethod` |  |  |
| `livemode` | `boolean` |  |  |

### Factory Methods

#### `create()`

```typescript
static create(params:
```

#### `createForMonths()`

```typescript
static createForMonths(params:
```

### Business Methods

#### `isActive()`

```typescript
isActive(): boolean
```

#### `isCanceled()`

```typescript
isCanceled(): boolean
```

#### `isTrialing()`

```typescript
isTrialing(): boolean
```

#### `isPastDue()`

```typescript
isPastDue(): boolean
```

#### `isIncomplete()`

```typescript
isIncomplete(): boolean
```

#### `willCancelAtPeriodEnd()`

```typescript
willCancelAtPeriodEnd(): boolean
```

#### `isExpiringSoon()`

```typescript
isExpiringSoon(): boolean
```

#### `hasExpired()`

Check if subscription is expiring soon (within 7 days) / isExpiringSoon

```typescript
hasExpired(): boolean
```

#### `isAnnual()`

```typescript
isAnnual(): boolean
```

#### `hasTrialPeriod()`

Check if this is an annual subscription / isAnnual

```typescript
hasTrialPeriod(): boolean
```

#### `isInTrial()`

```typescript
isInTrial(): boolean
```

#### `cancel()`

```typescript
cancel(canceledAt?: Date): Subscription
```

#### `scheduleCancellation()`

```typescript
scheduleCancellation(): Subscription
```

#### `toJSON()`

```typescript
toJSON(): Record<string, any>
```

---

## SubscriptionHistory

**Location**: `domain/entities/SubscriptionHistory.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `number` |  |  |
| `userId` | `number` |  |  |
| `changeType` | `SubscriptionChangeType` |  |  |
| `oldPlan` | `string | null` |  |  |
| `newPlan` | `string | null` |  |  |
| `oldQuota` | `QuotaData | null` |  |  |
| `newQuota` | `QuotaData | null` |  |  |
| `changedByUserId` | `number | null` |  |  |
| `changeReason` | `string | null` |  |  |
| `ipAddress` | `string | null` |  |  |
| `userAgent` | `string | null` |  |  |
| `createdAt` | `Date` |  |  |

### Factory Methods

#### `fromDatabase()`

```typescript
static fromDatabase( id: number, userId: number, changeType: SubscriptionChangeType, oldPlan: string | null, newPlan: string | null, oldQuota: QuotaData | null | any, // Handle JSONB newQuota: QuotaData | null | any, // Handle JSONB changedByUserId: number | null, changeReason: string | null, ipAddress: string | null, userAgent: string | null, createdAt: Date ): SubscriptionHistory
```

#### `createPlanUpgrade()`

```typescript
static createPlanUpgrade( userId: number, oldPlan: string, newPlan: string, ipAddress: string | null, userAgent: string | null, changeReason?: string ): Omit<SubscriptionHistory, 'id' | 'createdAt' | keyof SubscriptionHistory>
```

#### `createPlanDowngrade()`

```typescript
static createPlanDowngrade( userId: number, oldPlan: string, newPlan: string, ipAddress: string | null, userAgent: string | null, changeReason?: string ): Omit<SubscriptionHistory, 'id' | 'createdAt' | keyof SubscriptionHistory>
```

#### `createQuotaChange()`

```typescript
static createQuotaChange( userId: number, oldQuota: QuotaData, newQuota: QuotaData, changedByUserId: number | null, changeReason: string, ipAddress: string | null, userAgent: string | null ): Omit<SubscriptionHistory, 'id' | 'createdAt' | keyof SubscriptionHistory>
```

#### `createCancellation()`

```typescript
static createCancellation( userId: number, currentPlan: string, ipAddress: string | null, userAgent: string | null, changeReason?: string ): Omit<SubscriptionHistory, 'id' | 'createdAt' | keyof SubscriptionHistory>
```

### Business Methods

#### `isPlanChange()`

```typescript
isPlanChange(): boolean
```

#### `isQuotaChange()`

Check if this is a plan change (upgrade or downgrade) / isPlanChange

```typescript
isQuotaChange(): boolean
```

#### `isCancellation()`

Check if this is a quota change / isQuotaChange

```typescript
isCancellation(): boolean
```

#### `isReactivation()`

Check if this is a cancellation / isCancellation

```typescript
isReactivation(): boolean
```

#### `isSelfService()`

Check if this is a reactivation / isReactivation

```typescript
isSelfService(): boolean
```

#### `isAdminChange()`

```typescript
isAdminChange(): boolean
```

#### `toJSON()`

```typescript
toJSON():
```

---

## Track

**Location**: `domain/entities/Track.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `TrackId` |  |  |
| `title` | `string` |  |  |
| `url` | `Url` |  |  |
| `publishedAt` | `Date` |  |  |
| `coverImage` | `string | null` | ✓ |  |
| `createdAt` | `Date` | ✓ |  |

### Factory Methods

#### `create()`

```typescript
static create(props:
```

### Business Methods

#### `isPublished()`

```typescript
isPublished(): boolean
```

#### `hasCover()`

```typescript
hasCover(): boolean
```

---

## User

**Location**: `domain/entities/User.ts`

### Types

```typescript
export type UserRole = 'artist' | 'admin'
```

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `id` | `number` |  |  |
| `email` | `string` |  |  |
| `passwordHash` | `string` |  |  |
| `name` | `string` | ✓ |  |
| `role` | `UserRole` |  |  |
| `active` | `boolean` |  |  |
| `createdAt` | `Date` |  |  |
| `updatedAt` | `Date` |  |  |
| `subscriptionPlan` | `string` |  |  |
| `subscriptionStartedAt` | `Date` | ✓ |  |
| `subscriptionExpiresAt` | `Date` | ✓ |  |
| `maxMonthlyEmails` | `number` |  |  |
| `emailsSentThisMonth` | `number` |  |  |
| `quotaResetAt` | `Date` |  |  |

### Factory Methods

#### `fromDatabase()`

```typescript
static fromDatabase( id: number, email: string, passwordHash: string, role: UserRole, active: boolean, createdAt: Date, updatedAt: Date, subscriptionPlan: string, maxMonthlyEmails: number, emailsSentThisMonth: number, quotaResetAt: Date, name?: string, subscriptionStartedAt?: Date, subscriptionExpiresAt?: Date ): User
```

#### `createNew()`

```typescript
static async createNew(email: string, password: string, role: UserRole = 'artist'): Promise<User>
```

#### `validatePasswordStrength()`

```typescript
static validatePasswordStrength(password: string):
```

#### `validateEmail()`

```typescript
static validateEmail(email: string):
```

### Business Methods

#### `isAdmin()`

```typescript
isAdmin(): boolean
```

#### `verifyPassword()`

```typescript
async verifyPassword(password: string): Promise<boolean>
```

#### `toPublic()`

```typescript
toPublic():
```

---

## UserSettings

**Location**: `domain/entities/UserSettings.ts`

### Fields

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `userId` | `number` |  |  |
| `name` | `string | null` |  |  |
| `soundcloudId` | `string | null` |  |  |
| `soundcloudPermalink` | `string | null` |  |  |
| `spotifyId` | `string | null` |  |  |
| `updatedAt` | `Date` |  |  |

### Business Methods

#### `hasSoundCloudId()`

```typescript
hasSoundCloudId(): boolean
```

#### `hasSpotifyId()`

Check if user has valid SoundCloud ID configured / hasSoundCloudId

```typescript
hasSpotifyId(): boolean
```

#### `update()`

Check if user has valid Spotify ID configured / hasSpotifyId

```typescript
update(updates: Partial<
```

---

## Usage Guide

### When to Use This Skill

1. **Creating/Updating Repositories**: Verify field names and types
2. **Writing Migrations**: Ensure database schema matches entity structure
3. **Implementing Use Cases**: Reference factory methods and business logic
4. **Data Validation**: Check required vs optional fields
5. **Type Safety**: Use exact type definitions from entities

### Best Practices

- ✅ Always reference this documentation when working with entity fields
- ✅ Use factory methods instead of `new Entity()` directly
- ✅ Respect the Clean Architecture boundary (no external deps in entities)
- ✅ Validate data using entity validation methods
- ❌ Don't modify entity structure without updating related repositories
- ❌ Don't add external dependencies to entity files

### Related Documentation

- **Clean Architecture Guidelines**: `.claude/CLAUDE.md`
- **Repository Interfaces**: `domain/repositories/`
- **Use Cases**: `domain/services/`

---

*Last updated: 2025-12-30T18:05:23.608Z*
*Generated by: `scripts/update-entity-docs.ts`*
