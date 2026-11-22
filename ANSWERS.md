# Technical Answers & Architecture Decisions

## Part 1: App & Linux
- **Architecture:** Nginx frontend (:8080) proxying /api/* to Node/Express backend (:8000) backed by MongoDB (:27017 / Atlas M0).
- **Env Vars:** PORT, MONGO_URI (Secrets Manager), APP_VERSION.
- **Unreachable DB:** App stays alive with 3s timeout; /health returns status: degraded while /api/items returns HTTP 503.
- **Fixes:** (1) Bound server to 0.0.0.0 for ALB health checks; (2) Added structured JSON logs with request_id.
- **Linux Commands:** Port 8000: `ss -tulpn | grep :8000` | Disk: `df -h` | Live logs: `tail -f /var/log/syslog` | Perms: `ls -la <file>`

## Part 2: Docker Choices
- Non-root users (appuser & nginx-unprivileged) for security; separate package.json layer for dependency caching.

## Part 3: AWS, ECS & Networking
- **Path:** Browser -> ALB (:80, alb-sg) -> /api/* to Backend TG (:8000, ecs-sg) & /* to Frontend TG (:8080, ecs-sg) -> MongoDB Atlas (TLS 27017).
- **Security Groups:** alb-sg allows 80 from 0.0.0.0/0; ecs-sg allows 8000 & 8080 strictly from alb-sg; outbound all for ECR/Secrets/Atlas.
- **DB & Trade-off:** Secrets Manager injects MONGO_URI via Execution Role. Used Default VPC public subnets to save ~$65/mo NAT Gateway cost.
- **Debugging:** 502 -> check TG health & 0.0.0.0 bind; 504 -> check ecs-sg & DB timeout; Image pull -> check Execution Role & ECR endpoint.
- **Rollback (<5m):** `aws ecs update-service --cluster craon-app-cluster --service craon-app-backend-svc --task-definition craon-app-backend:<PREV_REV>`
- **Cost & Teardown:** ~$46.90/mo (ALB $18, Fargate $27, Logs/Secrets $1.90, Atlas M0 $0). Teardown: `terraform destroy -auto-approve`

## Part 5: Monitoring & SRE
- **Alarms:** 5xx > 5/min (catches crashes), p95 > 0.5s for 2m (tail latency), Unhealthy targets >= 1 (capacity drop).
- **SLI/SLO:** 99.9% availability over 30 days = 43.2 mins monthly error budget. When nearly spent, freeze feature deploys and focus on reliability.