# Craon DevOps Take-Home Assignment

Containerized full-stack Task Tracker (Node.js/Express API, Nginx frontend, MongoDB) provisioned on AWS ECS Fargate via Terraform, automated with GitHub Actions OIDC, and monitored via CloudWatch.

## Run Locally (One Command)
```bash
docker compose up --build -d
```
- Frontend: http://localhost:8080
- Health: http://localhost:8000/health
- Metrics: http://localhost:8000/metrics

## Deploy Infrastructure
```bash
cd terraform && terraform init && terraform fmt -check && terraform validate && terraform plan -out=tfplan
```

## Scope Decisions (What I Chose Not to Do)
- Used Default VPC public subnets for Fargate tasks to avoid ~$65/month in NAT Gateway charges while restricting container ingress strictly to the ALB Security Group.
- Omitted custom domain/ACM HTTPS setup to stay within the 24h time box; ALB listener is ready for port 443.