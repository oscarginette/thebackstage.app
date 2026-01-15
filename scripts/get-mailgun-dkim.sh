#!/bin/bash

# Get DKIM record from Mailgun API
# Requires: MAILGUN_API_KEY environment variable

if [ -z "$MAILGUN_API_KEY" ]; then
  echo "❌ Error: MAILGUN_API_KEY not set"
  echo ""
  echo "Set it with:"
  echo "  export MAILGUN_API_KEY='your-api-key'"
  exit 1
fi

DOMAIN="geebeat.com"
API_URL="https://api.mailgun.net/v4/domains/$DOMAIN"

echo "🔍 Fetching DNS records for $DOMAIN from Mailgun..."
echo ""

# Fetch domain info
curl -s --user "api:$MAILGUN_API_KEY" "$API_URL" | jq -r '
  .sending_dns_records[] |
  select(.record_type == "TXT" and (.name | contains("_domainkey"))) |
  "Type: \(.record_type)\nHostname: \(.name)\nValue: \(.value)\n"
'

echo ""
echo "📋 Copy the DKIM record above and use it in the next step."
