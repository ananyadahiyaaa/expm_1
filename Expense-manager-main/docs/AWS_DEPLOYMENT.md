# AWS Deployment Guide — Cloud-Based Expense Tracker

This document describes how to deploy the Expense Tracker on AWS so that:

- **Frontend** is served from **S3 + CloudFront** or **Amplify**
- **Backend API** runs on **EC2**
- **Database** is **RDS (PostgreSQL)**
- **Logs** go to **CloudWatch**
- **Security** uses **IAM roles** (no hardcoded keys in production)

---

## 1. High-Level Architecture

```
Internet
   │
   ├── CloudFront (optional) or Amplify
   │      └── S3 / Amplify Hosting → Frontend (Next.js static export or SSR)
   │
   └── EC2 (Backend API)
          ├── Express app (Node.js)
          ├── IAM Role → CloudWatch Logs, (optional) RDS auth
          └── Security Group: 80/443 from ALB or CloudFront; 22 from your IP
   │
   └── RDS (PostgreSQL)
          └── Security Group: 5432 only from EC2
```

---

## 2. RDS (PostgreSQL)

1. **Create RDS instance**
   - Engine: PostgreSQL 15 (or 14).
   - Template: Dev/Test or Production as needed.
   - Instance class: e.g. `db.t3.micro` (dev), larger for prod.
   - Storage: 20 GB+.
   - **Master username** and **password**: store in a secrets manager or env; never commit.

2. **Security Group**
   - Inbound: **PostgreSQL (5432)** from the EC2 security group only (or VPC CIDR where EC2 lives).

3. **Database**
   - Create a DB name, e.g. `expense_tracker`, or use the default and create it after first connect.

4. **Connection string**
   - Format:  
     `postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/DATABASE_NAME`
   - Use this as `DATABASE_URL` on EC2 (see below).

5. **Run schema**
   - From a machine that can reach RDS (e.g. EC2 or your laptop with VPN/bastion), run:
     ```bash
     cd backend
     DATABASE_URL="postgresql://..." npm run db:migrate
     ```
   - This runs `backend/src/db/schema.sql` (creates `users`, `expenses`, `monthly_budgets`).

---

## 3. EC2 (Backend API)

1. **Launch EC2**
   - AMI: Amazon Linux 2 or Ubuntu 22.04.
   - Instance type: e.g. `t3.micro` (dev), `t3.small` or larger for prod.
   - Security group:
     - Inbound: **22** from your IP (SSH); **80** and **443** from 0.0.0.0/0 (or from ALB/CloudFront only if you use a load balancer).

2. **IAM Role for EC2**
   - Create a role with policies:
     - **CloudWatchLogsFullAccess** (or a custom policy that allows `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` for your log group).
   - Attach this role to the EC2 instance.
   - Do **not** put AWS Access Key / Secret in the app; use the instance role.

3. **Install Node.js 18+**
   - Amazon Linux 2:
     ```bash
     sudo yum install -y nodejs
     # Or use nvm for exact version:
     # curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
     # nvm install 18
     ```
   - Ubuntu:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```

4. **Deploy backend code**
   - Clone repo or copy `backend/` to the instance (e.g. `/var/app/expense-tracker-api`).

5. **Environment file**
   - Create `/var/app/expense-tracker-api/.env` (or use a secrets manager and inject env):
     ```env
     NODE_ENV=production
     PORT=4000
     JWT_SECRET=<strong-random-secret>
     JWT_EXPIRES_IN=7d
     DATABASE_URL=postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/expense_tracker
     CLOUDWATCH_LOG_GROUP=/expense-tracker/api
     AWS_REGION=us-east-1
     ```
   - Leave `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` **unset** so the app uses the EC2 IAM role.

6. **Build and run**
   ```bash
   cd /var/app/expense-tracker-api
   npm ci
   npm run build
   npm run start
   ```
   - Use a process manager (e.g. **PM2**):
     ```bash
     sudo npm install -g pm2
     pm2 start dist/index.js --name expense-api
     pm2 save && pm2 startup
     ```

7. **Reverse proxy (recommended)**
   - Install Nginx (or use ALB). Example Nginx config for API:
     ```nginx
     server {
       listen 80;
       server_name api.yourdomain.com;
       location / {
         proxy_pass http://127.0.0.1:4000;
         proxy_http_version 1.1;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header X-Forwarded-Proto $scheme;
       }
     }
     ```
   - Use Let’s Encrypt (certbot) for HTTPS if no ALB/CloudFront in front.

---

## 4. CloudWatch Logs

1. **Log group**
   - In CloudWatch → Log groups, create a group, e.g. `/expense-tracker/api`.
   - Set retention (e.g. 30 days) if desired.

2. **Backend configuration**
   - The app’s logger (in `backend/src/utils/logger.ts`) sends logs to CloudWatch when:
     - `NODE_ENV=production`, and
     - AWS credentials are available (e.g. via EC2 IAM role).
   - Log group is read from env: `CLOUDWATCH_LOG_GROUP=/expense-tracker/api`.

3. **What gets logged**
   - Every API request: method, path, status, duration (request count and latency can be derived).
   - Errors and warnings (stack traces in development; in production, log level can be adjusted).

4. **Metrics (optional)**
   - You can create CloudWatch metrics from log insights or use a custom metrics library to publish request count, 4xx/5xx counts, etc., to CloudWatch Metrics.

---

## 5. Frontend (S3 + CloudFront or Amplify)

### Option A: Next.js static export + S3 + CloudFront

1. **Build for static export**
   - In `frontend/next.config.js`, add:
     ```js
     output: 'export',
     ```
   - Set `NEXT_PUBLIC_API_URL` to your API URL (e.g. `https://api.yourdomain.com`).
   - Run: `npm run build`. Output is in `frontend/out/`.

2. **S3 bucket**
   - Create a bucket; enable static website hosting (optional if using only CloudFront).
   - Upload `out/*` to the bucket (e.g. prefix `frontend/` or root).

3. **CloudFront**
   - Create distribution; origin = S3 bucket (or website endpoint).
   - Default root object: `index.html`.
   - Custom domain (optional): add CNAME and ACM certificate for HTTPS.

### Option B: Amplify Hosting

1. Connect repo (GitHub/GitLab/etc.).
2. Build settings:
   - App: Next.js (frontend).
   - Build command: `npm run build`; output directory: `.next` (or as per Amplify Next.js support).
3. Env: set `NEXT_PUBLIC_API_URL` to your backend URL.
4. Deploy; Amplify provides a URL and optional custom domain.

---

## 6. CORS and Security

- **Backend (Express)**  
  - In production, restrict CORS `origin` to your frontend URL(s), e.g. `https://yourdomain.com`, `https://www.yourdomain.com`, or the Amplify URL.

- **Secrets**
  - `JWT_SECRET` and `DATABASE_URL`: use env vars or AWS Secrets Manager; never commit.

- **IAM**
  - Prefer EC2 instance role over long-lived access keys. If you must use keys, rotate them and restrict to minimal permissions (e.g. CloudWatch Logs only).

---

## 7. Checklist Before Go-Live

- [ ] RDS is in a private subnet; only EC2 (or app tier) can reach it.
- [ ] EC2 has an IAM role; no AWS keys in `.env`.
- [ ] `JWT_SECRET` is strong and unique.
- [ ] `DATABASE_URL` uses SSL if required by your security policy (e.g. `?sslmode=require` for RDS).
- [ ] CORS allows only your frontend origin.
- [ ] CloudWatch log group exists and retention is set.
- [ ] Frontend `NEXT_PUBLIC_API_URL` points to the public API URL (HTTPS).
- [ ] HTTPS is enabled (CloudFront, Amplify, or Nginx + certbot).

---

## 8. Summary

| Component   | Service        | Purpose                          |
|------------|----------------|-----------------------------------|
| Frontend   | S3 + CloudFront or Amplify | Host Next.js app; serve over HTTPS |
| Backend API| EC2            | Run Node.js Express; JWT auth; REST |
| Database   | RDS PostgreSQL | Users, expenses, budgets          |
| Logs       | CloudWatch Logs| API request/error logging        |
| Security   | IAM            | EC2 role for CloudWatch (and optional RDS) |

This gives you a production-ready, observable deployment that matches the intended cloud architecture and keeps the system ready for future extensions (alerts, AI insights, export, mobile).
