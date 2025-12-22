# Claude Code Skills - Backstage

Custom skills for managing the email marketing platform.

## Available Skills

### 🔒 gdpr-compliance-helper
Expert GDPR/CCPA compliance automation for email marketing.

**Capabilities**:
- Data export (GDPR Article 15 - Right of Access)
- Contact deletion/anonymization (GDPR Article 17 - Right to Erasure)
- Consent tracking and audit trails
- Double opt-in implementation
- Compliance checks and monitoring

**Scripts**:
```bash
# Export all data for a contact
tsx .claude/skills/gdpr-compliance-helper/scripts/export-contact-data.ts user@example.com

# Delete/anonymize a contact (GDPR compliant)
tsx .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts user@example.com
```

**Invoke Skill**:
```
/skill gdpr-compliance-helper
```

---

### 🔍 webhook-debugger
Testing, debugging, and monitoring specialist for Resend and Hypedit webhooks.

**Capabilities**:
- Local webhook testing with ngrok
- Event simulation and replay
- Signature verification testing
- Webhook logging and monitoring
- Error scenario testing
- Real-time health monitoring

**Scripts**:
```bash
# Replay individual webhook event
tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend opened

# Test complete email journey (sent → delivered → opened → clicked)
tsx .claude/skills/webhook-debugger/scripts/test-all-events.ts
```

**Invoke Skill**:
```
/skill webhook-debugger
```

---

### 📊 database-ops (existing)
Safe database access patterns, Prisma queries, and data analysis for Trackstack.

---

## Quick Start

### Test Webhook Integration
```bash
# 1. Start local dev server
npm run dev

# 2. Simulate webhook event
tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend sent

# 3. Check if event was recorded
psql $DATABASE_URL -c "SELECT * FROM email_events ORDER BY timestamp DESC LIMIT 5;"
```

### Export User Data (GDPR)
```bash
# Export all data for GDPR request
tsx .claude/skills/gdpr-compliance-helper/scripts/export-contact-data.ts john@example.com

# Result: exports/gdpr-export-john_example_com-1234567890.json
```

### Delete User Data (GDPR)
```bash
# Anonymize contact (with confirmation prompt)
tsx .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts john@example.com

# Or skip confirmation
tsx .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts john@example.com --confirm
```

## Skill Development

### Creating a New Skill

1. Create skill directory:
```bash
mkdir -p .claude/skills/my-skill/scripts
```

2. Create `skill.md`:
```markdown
# My Skill

Description of what this skill does.

## Capabilities
- Feature 1
- Feature 2

## Usage
How to use this skill...
```

3. Add helper scripts in `scripts/` directory

4. Test the skill:
```bash
# Invoke via slash command
/skill my-skill
```

## Best Practices

1. **Always test locally first** - Use replay scripts before testing with live webhooks
2. **Confirm before deletion** - GDPR deletion scripts require confirmation
3. **Log everything** - Use webhook_logs and consent_history tables
4. **Validate signatures** - Implement webhook signature verification
5. **Monitor health** - Check `/api/webhooks/monitor` regularly

## Environment Variables

```env
# Required for webhook debugging
BASE_URL=http://localhost:3002

# Required for GDPR operations
GDPR_DATA_RETENTION_YEARS=7
GDPR_RESPONSE_DAYS=30

# Required for webhook security
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Troubleshooting

### Webhook not receiving events locally
1. Check if dev server is running (`npm run dev`)
2. Use ngrok to expose localhost: `ngrok http 3002`
3. Update webhook URL in Resend dashboard to ngrok URL
4. Test with replay script first

### GDPR export fails
1. Verify database connection (check `POSTGRES_URL`)
2. Ensure contact exists in database
3. Check `exports/` directory permissions

### Contact deletion not working
1. Check if contact exists first
2. Verify you confirmed the prompt (or use `--confirm` flag)
3. Check database constraints (foreign keys)

## Additional Resources

- [Resend Webhooks Documentation](https://resend.com/docs/webhooks)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [Ngrok Documentation](https://ngrok.com/docs)
