# On-Call Runbook & Simulated Incident Postmortem

## Alert: craon-app-high-5xx (Critical)
1. **What It Means:** ALB recorded >5 HTTP 5xx errors from craon-app-backend-svc within 60 seconds.
2. **How to Check:** Run `aws ecs describe-services --cluster craon-app-cluster --services craon-app-backend-svc` and inspect `/ecs/craon-app-backend` JSON logs in CloudWatch Logs Insights filtering `status >= 500`.
3. **How to Fix:** Roll back immediately: `aws ecs update-service --cluster craon-app-cluster --service craon-app-backend-svc --task-definition craon-app-backend:<LAST_GOOD_REV>`.
4. **When to Escalate:** Escalate to Backend Tech Lead / DB Owner if rollback does not resolve 5xx errors within 5 minutes.

## Simulated Incident Postmortem: v2 API Regression
- **Date:** 22 Nov 2026 | **Severity:** SEV-2
- **Impact:** GET /api/items returned HTTP 500 for 6 minutes; /health stayed 200 OK.
- **Timeline (IST):** 19:40 Deployed v2 -> 19:41 High-5xx alarm fired & notified SNS -> 19:43 Found v2 error in JSON logs -> 19:44 Rolled back to rev 1 -> 19:46 Recovered.
- **Root Cause:** Release v2 broke GET /api/items while shallow /health checks continued passing.
- **Follow-Up Actions:** (1) Add integration smoke tests in CI before merge; (2) Enable ECS deployment_circuit_breaker with auto-rollback.