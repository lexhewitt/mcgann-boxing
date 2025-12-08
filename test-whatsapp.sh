#!/bin/bash
# Quick WhatsApp Integration Test Script

echo "🧪 Testing WhatsApp Meta Cloud API Integration"
echo "=============================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please create it with your Meta credentials."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Test 1: Check required environment variables
echo "Test 1: Checking environment variables..."
MISSING_VARS=0

[ -z "$META_APP_ID" ] && echo "  ❌ META_APP_ID missing" && MISSING_VARS=1
[ -z "$META_APP_SECRET" ] && echo "  ❌ META_APP_SECRET missing" && MISSING_VARS=1
[ -z "$META_ACCESS_TOKEN" ] && echo "  ❌ META_ACCESS_TOKEN missing" && MISSING_VARS=1
[ -z "$WHATSAPP_PHONE_NUMBER_ID" ] && echo "  ❌ WHATSAPP_PHONE_NUMBER_ID missing" && MISSING_VARS=1
[ -z "$META_WEBHOOK_VERIFY_TOKEN" ] && echo "  ❌ META_WEBHOOK_VERIFY_TOKEN missing" && MISSING_VARS=1

if [ $MISSING_VARS -eq 0 ]; then
    echo "  ✅ All required environment variables are set"
else
    echo "  ❌ Some environment variables are missing"
    exit 1
fi

echo ""

# Test 2: Check if server is running
echo "Test 2: Checking if server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1 || curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "  ✅ Server is running"
    SERVER_URL="http://localhost:3000"
    [ -z "$(curl -s http://localhost:3000)" ] && SERVER_URL="http://localhost:8080"
else
    echo "  ⚠️  Server not running. Start with: npm run dev"
    echo "  ⚠️  Or test webhook verification only (requires ngrok)"
    SERVER_URL=""
fi

echo ""

# Test 3: Webhook verification (if server running)
if [ ! -z "$SERVER_URL" ]; then
    echo "Test 3: Testing webhook verification..."
    CHALLENGE="test-challenge-123"
    RESPONSE=$(curl -s "${SERVER_URL}/server-api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=${META_WEBHOOK_VERIFY_TOKEN}&hub.challenge=${CHALLENGE}")
    
    if [ "$RESPONSE" = "$CHALLENGE" ]; then
        echo "  ✅ Webhook verification works"
    else
        echo "  ❌ Webhook verification failed"
        echo "     Expected: $CHALLENGE"
        echo "     Got: $RESPONSE"
    fi
    echo ""
fi

# Test 4: Test Meta API connection
echo "Test 4: Testing Meta API connection..."
API_RESPONSE=$(curl -s -X GET "https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}?access_token=${META_ACCESS_TOKEN}")

if echo "$API_RESPONSE" | grep -q "id"; then
    echo "  ✅ Meta API connection successful"
    echo "     Phone Number ID: $(echo $API_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)"
else
    echo "  ❌ Meta API connection failed"
    echo "     Response: $API_RESPONSE"
fi

echo ""
echo "=============================================="
echo "✅ Basic tests complete!"
echo ""
echo "Next steps:"
echo "1. Start server: npm run dev"
echo "2. Start ngrok: ngrok http 3000"
echo "3. Configure webhook in Meta dashboard with ngrok URL"
echo "4. Send test WhatsApp message"
echo ""
echo "See WHATSAPP_TESTING_GUIDE.md for detailed testing instructions"
