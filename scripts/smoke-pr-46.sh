#!/bin/bash

# Smoke Test for PR-46: Quiet Hours + On-Call Management
# Test all Quiet Hours, On-Call, Escalation, and Notification endpoints

set -e

echo "🧪 PR-46: Quiet Hours + On-Call Management - Smoke Test"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
API_BASE_URL="http://localhost:4000/v1"
USER_ID="test-user-46"
AUTH_HEADER="x-user-id: $USER_ID"
ORG_HEADER="x-organization-id: org_1"

echo -e "\n${BLUE}Testing Quiet Hours + On-Call System Endpoints...${NC}"

# Test 1: Get Quiet Hours Configurations
echo -e "\n--- Test 1: Get Quiet Hours Configurations ---"
QUIET_HOURS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/quiet-hours" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $QUIET_HOURS_RESPONSE"
if echo "$QUIET_HOURS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved quiet hours configurations"
else
  echo "❌ Failed to retrieve quiet hours configurations"
  exit 1
fi

# Test 2: Create Quiet Hours Configuration
echo -e "\n--- Test 2: Create Quiet Hours Configuration ---"
CREATE_QUIET_HOURS_RESPONSE=$(curl -s -X POST "$API_BASE_URL/quiet-hours" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -d '{
        "organizationId": "org_1",
        "serviceName": "test-service",
        "timezone": "UTC",
        "schedule": {
          "monday": [{"start": "22:00", "end": "06:00", "type": "quiet"}],
          "tuesday": [{"start": "22:00", "end": "06:00", "type": "quiet"}],
          "wednesday": [{"start": "22:00", "end": "06:00", "type": "quiet"}],
          "thursday": [{"start": "22:00", "end": "06:00", "type": "quiet"}],
          "friday": [{"start": "22:00", "end": "06:00", "type": "quiet"}],
          "saturday": [{"start": "00:00", "end": "23:59", "type": "quiet"}],
          "sunday": [{"start": "00:00", "end": "23:59", "type": "quiet"}]
        },
        "costOptimization": true
      }')
echo "Response: $CREATE_QUIET_HOURS_RESPONSE"
QUIET_HOURS_ID=$(echo "$CREATE_QUIET_HOURS_RESPONSE" | jq -r '.data.id')
if [ "$QUIET_HOURS_ID" != "null" ]; then
  echo "✅ Successfully created quiet hours configuration. ID: $QUIET_HOURS_ID"
else
  echo "❌ Failed to create quiet hours configuration"
  exit 1
fi

# Test 3: Get Quiet Hours Status
echo -e "\n--- Test 3: Get Quiet Hours Status ---"
QUIET_HOURS_STATUS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/quiet-hours/status" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $QUIET_HOURS_STATUS_RESPONSE"
if echo "$QUIET_HOURS_STATUS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved quiet hours status"
else
  echo "❌ Failed to retrieve quiet hours status"
  exit 1
fi

# Test 4: Create Quiet Hours Override
echo -e "\n--- Test 4: Create Quiet Hours Override ---"
CREATE_OVERRIDE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/quiet-hours/override" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -d '{
        "organizationId": "org_1",
        "serviceName": "test-service",
        "startTime": "2025-01-15T10:00:00Z",
        "endTime": "2025-01-15T12:00:00Z",
        "reason": "Emergency maintenance",
        "requestedBy": "test-user"
      }')
echo "Response: $CREATE_OVERRIDE_RESPONSE"
if echo "$CREATE_OVERRIDE_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully created quiet hours override"
else
  echo "❌ Failed to create quiet hours override"
  exit 1
fi

# Test 5: Get On-Call Schedules
echo -e "\n--- Test 5: Get On-Call Schedules ---"
ONCALL_SCHEDULES_RESPONSE=$(curl -s -X GET "$API_BASE_URL/oncall/schedules" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $ONCALL_SCHEDULES_RESPONSE"
if echo "$ONCALL_SCHEDULES_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved on-call schedules"
else
  echo "❌ Failed to retrieve on-call schedules"
  exit 1
fi

# Test 6: Create On-Call Schedule
echo -e "\n--- Test 6: Create On-Call Schedule ---"
CREATE_ONCALL_RESPONSE=$(curl -s -X POST "$API_BASE_URL/oncall/schedules" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -d '{
        "organizationId": "org_1",
        "teamName": "Test Team",
        "rotationType": "weekly",
        "schedule": {
          "participants": [
            {
              "userId": "user_1",
              "name": "John Doe",
              "email": "john@example.com",
              "phone": "+1234567890",
              "role": "primary",
              "skills": ["incident-response"],
              "availability": [
                {"dayOfWeek": 0, "startTime": "00:00", "endTime": "23:59", "timezone": "UTC"},
                {"dayOfWeek": 1, "startTime": "00:00", "endTime": "23:59", "timezone": "UTC"},
                {"dayOfWeek": 2, "startTime": "00:00", "endTime": "23:59", "timezone": "UTC"},
                {"dayOfWeek": 3, "startTime": "00:00", "endTime": "23:59", "timezone": "UTC"},
                {"dayOfWeek": 4, "startTime": "00:00", "endTime": "23:59", "timezone": "UTC"},
                {"dayOfWeek": 5, "startTime": "00:00", "endTime": "23:59", "timezone": "UTC"},
                {"dayOfWeek": 6, "startTime": "00:00", "endTime": "23:59", "timezone": "UTC"}
              ]
            }
          ],
          "rotationPattern": {
            "type": "sequential",
            "duration": 7,
            "startDate": "2025-01-01T00:00:00Z"
          },
          "handoffTime": "09:00",
          "handoffTimezone": "UTC",
          "overlapMinutes": 30
        }
      }')
echo "Response: $CREATE_ONCALL_RESPONSE"
ONCALL_SCHEDULE_ID=$(echo "$CREATE_ONCALL_RESPONSE" | jq -r '.data.id')
if [ "$ONCALL_SCHEDULE_ID" != "null" ]; then
  echo "✅ Successfully created on-call schedule. ID: $ONCALL_SCHEDULE_ID"
else
  echo "❌ Failed to create on-call schedule"
  exit 1
fi

# Test 7: Get Current On-Call
echo -e "\n--- Test 7: Get Current On-Call ---"
CURRENT_ONCALL_RESPONSE=$(curl -s -X GET "$API_BASE_URL/oncall/current?scheduleId=$ONCALL_SCHEDULE_ID" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $CURRENT_ONCALL_RESPONSE"
if echo "$CURRENT_ONCALL_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved current on-call"
else
  echo "❌ Failed to retrieve current on-call"
  exit 1
fi

# Test 8: Get On-Call History
echo -e "\n--- Test 8: Get On-Call History ---"
ONCALL_HISTORY_RESPONSE=$(curl -s -X GET "$API_BASE_URL/oncall/history?scheduleId=$ONCALL_SCHEDULE_ID" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $ONCALL_HISTORY_RESPONSE"
if echo "$ONCALL_HISTORY_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved on-call history"
else
  echo "❌ Failed to retrieve on-call history"
  exit 1
fi

# Test 9: Create On-Call Override
echo -e "\n--- Test 9: Create On-Call Override ---"
CREATE_ONCALL_OVERRIDE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/oncall/override" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -d '{
        "scheduleId": "'$ONCALL_SCHEDULE_ID'",
        "originalUserId": "user_1",
        "overrideUserId": "user_2",
        "startTime": "2025-01-15T10:00:00Z",
        "endTime": "2025-01-15T18:00:00Z",
        "reason": "Vacation coverage",
        "requestedBy": "test-user"
      }')
echo "Response: $CREATE_ONCALL_OVERRIDE_RESPONSE"
if echo "$CREATE_ONCALL_OVERRIDE_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully created on-call override"
else
  echo "❌ Failed to create on-call override"
  exit 1
fi

# Test 10: Get Escalation Rules
echo -e "\n--- Test 10: Get Escalation Rules ---"
ESCALATION_RULES_RESPONSE=$(curl -s -X GET "$API_BASE_URL/escalation/rules" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $ESCALATION_RULES_RESPONSE"
if echo "$ESCALATION_RULES_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved escalation rules"
  ESCALATION_RULE_ID=$(echo "$ESCALATION_RULES_RESPONSE" | jq -r '.data[0].id')
else
  echo "❌ Failed to retrieve escalation rules"
  exit 1
fi

# Test 11: Create Escalation Rule
echo -e "\n--- Test 11: Create Escalation Rule ---"
CREATE_ESCALATION_RULE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/escalation/rules" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -d '{
        "organizationId": "org_1",
        "ruleName": "Test Escalation Rule",
        "conditions": [
          {
            "type": "severity",
            "operator": "greater_than",
            "value": "high"
          }
        ],
        "actions": [
          {
            "type": "notify",
            "target": "user_1",
            "message": "High severity alert",
            "delay": 0
          }
        ],
        "timeouts": [
          {
            "level": 0,
            "timeoutMinutes": 5,
            "action": {
              "type": "notify",
              "target": "user_1",
              "message": "Level 0 escalation"
            }
          }
        ],
        "priority": 1
      }')
echo "Response: $CREATE_ESCALATION_RULE_RESPONSE"
if echo "$CREATE_ESCALATION_RULE_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully created escalation rule"
else
  echo "❌ Failed to create escalation rule"
  exit 1
fi

# Test 12: Trigger Escalation
echo -e "\n--- Test 12: Trigger Escalation ---"
TRIGGER_ESCALATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/escalation/trigger" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -d '{
        "alertId": "alert_123",
        "severity": "critical",
        "service": "test-service",
        "message": "Critical system failure",
        "metadata": {
          "service": "test-service",
          "environment": "production"
        }
      }')
echo "Response: $TRIGGER_ESCALATION_RESPONSE"
if echo "$TRIGGER_ESCALATION_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully triggered escalation"
  ESCALATION_EVENT_ID=$(echo "$TRIGGER_ESCALATION_RESPONSE" | jq -r '.data.id')
else
  echo "❌ Failed to trigger escalation"
  exit 1
fi

# Test 13: Get Escalation Status
echo -e "\n--- Test 13: Get Escalation Status ---"
ESCALATION_STATUS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/escalation/status" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $ESCALATION_STATUS_RESPONSE"
if echo "$ESCALATION_STATUS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved escalation status"
else
  echo "❌ Failed to retrieve escalation status"
  exit 1
fi

# Test 14: Acknowledge Escalation
if [ "$ESCALATION_EVENT_ID" != "null" ]; then
  echo -e "\n--- Test 14: Acknowledge Escalation ---"
  ACKNOWLEDGE_ESCALATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/escalation/$ESCALATION_EVENT_ID/acknowledge" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -H "$ORG_HEADER" \
    -d '{
          "userId": "user_1"
        }')
  echo "Response: $ACKNOWLEDGE_ESCALATION_RESPONSE"
  if echo "$ACKNOWLEDGE_ESCALATION_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Successfully acknowledged escalation"
  else
    echo "❌ Failed to acknowledge escalation"
    exit 1
  fi
fi

# Test 15: Get Notification Preferences
echo -e "\n--- Test 15: Get Notification Preferences ---"
NOTIFICATION_PREFERENCES_RESPONSE=$(curl -s -X GET "$API_BASE_URL/notifications/preferences" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $NOTIFICATION_PREFERENCES_RESPONSE"
if echo "$NOTIFICATION_PREFERENCES_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved notification preferences"
else
  echo "❌ Failed to retrieve notification preferences"
  exit 1
fi

# Test 16: Update Notification Preferences
echo -e "\n--- Test 16: Update Notification Preferences ---"
UPDATE_PREFERENCES_RESPONSE=$(curl -s -X PUT "$API_BASE_URL/notifications/preferences" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -d '{
        "channels": [
          {
            "type": "email",
            "enabled": true,
            "address": "test@example.com",
            "priority": "medium",
            "filters": []
          },
          {
            "type": "sms",
            "enabled": true,
            "address": "+1234567890",
            "priority": "high",
            "filters": [
              {
                "type": "severity",
                "operator": "greater_than",
                "value": "medium"
              }
            ]
          }
        ]
      }')
echo "Response: $UPDATE_PREFERENCES_RESPONSE"
if echo "$UPDATE_PREFERENCES_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully updated notification preferences"
else
  echo "❌ Failed to update notification preferences"
  exit 1
fi

# Test 17: Send Notification
echo -e "\n--- Test 17: Send Notification ---"
SEND_NOTIFICATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/notifications/send" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -d '{
        "userId": "user_1",
        "type": "alert",
        "severity": "high",
        "title": "Test Alert",
        "message": "This is a test notification for smoke testing",
        "channels": ["email", "sms"],
        "metadata": {
          "service": "test-service",
          "environment": "testing"
        }
      }')
echo "Response: $SEND_NOTIFICATION_RESPONSE"
NOTIFICATION_ID=$(echo "$SEND_NOTIFICATION_RESPONSE" | jq -r '.data.id')
if [ "$NOTIFICATION_ID" != "null" ]; then
  echo "✅ Successfully sent notification. ID: $NOTIFICATION_ID"
else
  echo "❌ Failed to send notification"
  exit 1
fi

# Test 18: Get Notification History
echo -e "\n--- Test 18: Get Notification History ---"
NOTIFICATION_HISTORY_RESPONSE=$(curl -s -X GET "$API_BASE_URL/notifications/history" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $NOTIFICATION_HISTORY_RESPONSE"
if echo "$NOTIFICATION_HISTORY_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved notification history"
else
  echo "❌ Failed to retrieve notification history"
  exit 1
fi

# Test 19: Get Notification Analytics
echo -e "\n--- Test 19: Get Notification Analytics ---"
NOTIFICATION_ANALYTICS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/notifications/analytics" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $NOTIFICATION_ANALYTICS_RESPONSE"
if echo "$NOTIFICATION_ANALYTICS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved notification analytics"
else
  echo "❌ Failed to retrieve notification analytics"
  exit 1
fi

# Test 20: Mark Notification as Read
if [ "$NOTIFICATION_ID" != "null" ]; then
  echo -e "\n--- Test 20: Mark Notification as Read ---"
  MARK_READ_RESPONSE=$(curl -s -X POST "$API_BASE_URL/notifications/$NOTIFICATION_ID/read" -H "$AUTH_HEADER" -H "$ORG_HEADER")
  echo "Response: $MARK_READ_RESPONSE"
  if echo "$MARK_READ_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ Successfully marked notification as read"
  else
    echo "❌ Failed to mark notification as read"
    exit 1
  fi
fi

# Test 21: Send Digest Notification
echo -e "\n--- Test 21: Send Digest Notification ---"
SEND_DIGEST_RESPONSE=$(curl -s -X POST "$API_BASE_URL/notifications/digest" -H "$AUTH_HEADER" -H "$ORG_HEADER")
echo "Response: $SEND_DIGEST_RESPONSE"
if echo "$SEND_DIGEST_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully sent digest notification"
else
  echo "❌ Failed to send digest notification"
  exit 1
fi

echo -e "\n================================================"
echo "🎉 All PR-46 Quiet Hours + On-Call Smoke Tests Completed!"
echo "================================================"
echo -e "${GREEN}✅ Quiet Hours + On-Call System is fully operational${NC}"
echo -e "${BLUE}🔇 Quiet Hours Management: Working${NC}"
echo -e "${BLUE}📞 On-Call Scheduling: Working${NC}"
echo -e "${BLUE}🚨 Escalation Management: Working${NC}"
echo -e "${BLUE}📱 Notification Intelligence: Working${NC}"
echo -e "${BLUE}🔧 Integration & Analytics: Working${NC}"
echo -e "\n${GREEN}RESULTADO: PASS${NC}"
