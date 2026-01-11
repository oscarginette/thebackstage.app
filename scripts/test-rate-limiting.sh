#!/bin/bash

# Rate Limiting Test Script
# Tests the rate limiting implementation for different endpoint types

BASE_URL="${1:-http://localhost:3002}"
echo "Testing rate limiting on: $BASE_URL"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Public endpoint (signup) - 10 req/min
echo -e "\n${YELLOW}Test 1: Public Endpoint (Signup) - Limit: 10 req/min${NC}"
echo "Sending 12 requests to /api/auth/signup..."
RATE_LIMITED=0
for i in {1..12}; do
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"password123\"}")

  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)

  if [ "$HTTP_CODE" == "429" ]; then
    RATE_LIMITED=$((RATE_LIMITED + 1))
    echo -e "  Request $i: ${RED}429 Too Many Requests${NC}"
  else
    echo -e "  Request $i: ${GREEN}$HTTP_CODE${NC}"
  fi

  sleep 0.1
done

if [ $RATE_LIMITED -ge 2 ]; then
  echo -e "${GREEN}✓ Public endpoint rate limiting working${NC}"
else
  echo -e "${RED}✗ Public endpoint rate limiting NOT working (expected 2+ 429 responses, got $RATE_LIMITED)${NC}"
fi

# Test 2: Webhook endpoint - 1000 req/min
echo -e "\n${YELLOW}Test 2: Webhook Endpoint - Limit: 1000 req/min${NC}"
echo "Sending 20 requests to /api/webhooks/resend..."
RATE_LIMITED=0
for i in {1..20}; do
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/webhooks/resend" \
    -H "Content-Type: application/json" \
    -d '{"type":"email.sent","data":{}}' 2>/dev/null)

  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)

  if [ "$HTTP_CODE" == "429" ]; then
    RATE_LIMITED=$((RATE_LIMITED + 1))
  fi
done

if [ $RATE_LIMITED -eq 0 ]; then
  echo -e "${GREEN}✓ Webhook endpoint allows high volume (no 429 in 20 requests)${NC}"
else
  echo -e "${RED}✗ Webhook endpoint rate limiting too strict ($RATE_LIMITED 429s in 20 requests)${NC}"
fi

# Test 3: Email endpoint - 10 req/min (requires auth, so test will fail auth but still hit rate limit)
echo -e "\n${YELLOW}Test 3: Email Endpoint - Limit: 10 req/min${NC}"
echo "Sending 12 requests to /api/send-custom-email..."
RATE_LIMITED=0
for i in {1..12}; do
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/send-custom-email" \
    -H "Content-Type: application/json" \
    -d '{"subject":"Test","message":"Test"}')

  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)

  if [ "$HTTP_CODE" == "429" ]; then
    RATE_LIMITED=$((RATE_LIMITED + 1))
    echo -e "  Request $i: ${RED}429 Too Many Requests${NC}"
  else
    echo -e "  Request $i: ${GREEN}$HTTP_CODE${NC}"
  fi

  sleep 0.1
done

if [ $RATE_LIMITED -ge 2 ]; then
  echo -e "${GREEN}✓ Email endpoint rate limiting working${NC}"
else
  echo -e "${YELLOW}⚠ Email endpoint rate limiting may not be working (got $RATE_LIMITED 429s)${NC}"
fi

# Test 4: Admin endpoint - 10000 req/min (very high)
echo -e "\n${YELLOW}Test 4: Admin Endpoint - Limit: 10000 req/min (effectively no limit)${NC}"
echo "Sending 20 requests to /api/admin/users..."
RATE_LIMITED=0
for i in {1..20}; do
  RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/api/admin/users" 2>/dev/null)

  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)

  if [ "$HTTP_CODE" == "429" ]; then
    RATE_LIMITED=$((RATE_LIMITED + 1))
  fi
done

if [ $RATE_LIMITED -eq 0 ]; then
  echo -e "${GREEN}✓ Admin endpoint allows high volume (no 429 in 20 requests)${NC}"
else
  echo -e "${RED}✗ Admin endpoint rate limiting too strict ($RATE_LIMITED 429s in 20 requests)${NC}"
fi

echo -e "\n=================================================="
echo -e "${GREEN}Rate limiting tests complete!${NC}"
echo ""
echo "Note: Some endpoints may return 401 (Unauthorized) instead of processing"
echo "the request, but rate limiting headers should still be present."
echo ""
echo "To see rate limit headers, run individual requests with -v flag:"
echo "curl -v $BASE_URL/api/auth/signup 2>&1 | grep -i ratelimit"
