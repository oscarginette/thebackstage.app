# OAuth URLs Configuration Update

**Date:** 2026-01-17
**Status:** Action Required

## 🎯 Objective

Ensure all OAuth redirect URIs are consistent and use `thebackstage.app` (without `www`) across all platforms and configurations.

---

## ✅ Completed Actions

### 1. SoundCloud Developer Console
- [x] Updated redirect URI to: `thebackstage.app` (without `www`)
- URL: https://soundcloud.com/you/apps

### 2. Code Updates
- [x] `domain/value-objects/EmailSignature.ts` - Changed `https://www.thebackstage.app` → `https://thebackstage.app`
- [x] `app/unsubscribe/page.tsx` - Changed `https://www.thebackstage.app` → `https://thebackstage.app`

---

## 🚨 Action Required: Update Environment Variables

### Local Environment (`.env.local`)

**Current values:**
```bash
SPOTIFY_REDIRECT_URI=https://geebeat.com/api/auth/spotify/callback  # ❌ WRONG DOMAIN
```

**Required values:**
```bash
SOUNDCLOUD_REDIRECT_URI=https://thebackstage.app/api/auth/soundcloud/callback
SPOTIFY_REDIRECT_URI=https://thebackstage.app/api/auth/spotify/callback
```

**Action:**
```bash
# Update .env.local
echo "SOUNDCLOUD_REDIRECT_URI=https://thebackstage.app/api/auth/soundcloud/callback" >> .env.local
sed -i '' 's|SPOTIFY_REDIRECT_URI=.*|SPOTIFY_REDIRECT_URI=https://thebackstage.app/api/auth/spotify/callback|' .env.local
```

### Production Environment (Vercel)

**Current values (encrypted, need verification):**
- `SOUNDCLOUD_REDIRECT_URI` - Production
- `SPOTIFY_REDIRECT_URI` - Production

**Required values:**
```
SOUNDCLOUD_REDIRECT_URI=https://thebackstage.app/api/auth/soundcloud/callback
SPOTIFY_REDIRECT_URI=https://thebackstage.app/api/auth/spotify/callback
```

**Action:**
```bash
# Update production environment variables
vercel env add SOUNDCLOUD_REDIRECT_URI production
# When prompted, enter: https://thebackstage.app/api/auth/soundcloud/callback

vercel env add SPOTIFY_REDIRECT_URI production
# When prompted, enter: https://thebackstage.app/api/auth/spotify/callback

# Redeploy to apply changes
vercel --prod
```

---

## 🔧 Action Required: Update Spotify Developer Console

### Spotify Dashboard
URL: https://developer.spotify.com/dashboard/applications

**Steps:**
1. Login to Spotify Developer Dashboard
2. Find your application (should match `SPOTIFY_CLIENT_ID=11a5b3c05a574c20bc0c248d86966d52`)
3. Navigate to: **Edit Settings** → **Redirect URIs**
4. Update redirect URI to: `https://thebackstage.app/api/auth/spotify/callback`
5. **Remove** any old URIs like `https://geebeat.com/api/auth/spotify/callback`
6. Click **Save**

---

## 📋 Verification Checklist

After completing the above actions, verify:

### Code
- [x] No `www.thebackstage.app` references in code (except docs)
- [x] All public URLs use `https://thebackstage.app`

### Environment Variables
- [ ] `.env.local` has correct `SOUNDCLOUD_REDIRECT_URI`
- [ ] `.env.local` has correct `SPOTIFY_REDIRECT_URI`
- [ ] Vercel production has correct `SOUNDCLOUD_REDIRECT_URI`
- [ ] Vercel production has correct `SPOTIFY_REDIRECT_URI`

### OAuth Providers
- [x] SoundCloud app uses `thebackstage.app` (no www)
- [ ] Spotify app uses `thebackstage.app` (no www)

### Testing
- [ ] SoundCloud OAuth flow works in production
- [ ] Spotify OAuth flow works in production
- [ ] Download gate SoundCloud follow requirement works
- [ ] Download gate Spotify connect requirement works

---

## 🐛 Troubleshooting

### If OAuth fails with "redirect_uri mismatch":

1. **Check browser console** for exact error message
2. **Verify** that the redirect URI in the OAuth provider dashboard **exactly matches** the environment variable
3. **Common issues**:
   - Trailing slash mismatch: `/callback` vs `/callback/`
   - Protocol mismatch: `http://` vs `https://`
   - Domain mismatch: `www.thebackstage.app` vs `thebackstage.app`

### If OAuth works in local but fails in production:

1. **Verify production environment variables**:
   ```bash
   vercel env ls production
   ```

2. **Pull production env to verify values**:
   ```bash
   vercel env pull .env.production
   cat .env.production | grep REDIRECT_URI
   ```

3. **Redeploy**:
   ```bash
   vercel --prod
   ```

---

## 📝 Notes

- **SoundCloud** requires exact domain match (no wildcards)
- **Spotify** requires exact URI match (including path)
- Both providers require `https://` in production
- Local development can use `http://localhost:3002` for testing

---

## 🔗 Related Files

- `app/api/auth/soundcloud/route.ts` - SoundCloud OAuth initiation
- `app/api/auth/soundcloud/callback/route.ts` - SoundCloud OAuth callback
- `app/api/auth/spotify/route.ts` - Spotify OAuth initiation
- `app/api/auth/spotify/callback/route.ts` - Spotify OAuth callback
- `lib/env.ts` - Environment variable validation

---

*This document will be deleted after all actions are completed and verified.*
