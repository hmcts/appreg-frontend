#!/bin/bash

# Script to test connectivity to the application
# Usage: ./scripts/test-connectivity.sh <BASE_URL>

set +e  # Don't exit on error - we want to report results

BASE_URL=$1

if [ -z "$BASE_URL" ]; then
    echo "Error: Base URL not specified"
    echo "Usage: $0 <BASE_URL>"
    exit 1
fi

echo "Testing connectivity: ${BASE_URL}"

# Extract domain from URL
DOMAIN=$(echo "$BASE_URL" | sed -e 's|^https\?://||' -e 's|/.*||')

# DNS Resolution
nslookup "$DOMAIN" > /dev/null 2>&1 && echo "✓ DNS resolution successful" || echo "⚠ DNS lookup failed"

# SSL Certificate check
echo | openssl s_client -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1 && echo "✓ SSL certificate valid" || echo "⚠ SSL check failed"

# Health endpoint check
HEALTH_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE_URL}/health")
echo "Health endpoint: HTTP ${HEALTH_CODE}"

# Root URL check
ROOT_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE_URL}/")
echo "Root URL: HTTP ${ROOT_CODE}"

# Evaluate results
if [ "$HEALTH_CODE" = "200" ] || [ "$ROOT_CODE" = "200" ] || [ "$ROOT_CODE" = "401" ]; then
    echo "✓ Connectivity test passed"
    exit 0
else
    echo "✗ Connectivity test failed"
    exit 1
fi
