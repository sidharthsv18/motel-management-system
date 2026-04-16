# Quick Start - AWS Secrets Configuration

## 3 Steps to Complete Migration

### 1️⃣ Create Secret in AWS (2 min)
```bash
aws secretsmanager create-secret \
  --name motel-management-secrets \
  --region ap-south-1 \
  --secret-string '{"JWT_SECRET":"motel_secret_2026_secure_key","OWNER_EMAIL":"owner@elitegrand.com","OWNER_PASSWORD":"Elitegrand#1818","RECEPTION_EMAIL":"reception@elitegrand.com","RECEPTION_PASSWORD":"Frontdesk#5100"}'
```

**OR via AWS Console:**
- https://console.aws.amazon.com/secretsmanager/
- Region: ap-south-1
- Name: motel-management-secrets
- Paste JSON from above

### 2️⃣ Attach IAM Role to EC2 (2 min)
- https://console.aws.amazon.com/ec2/
- Select instance 3.110.24.107
- Security → Modify IAM role
- Create role with policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "secretsmanager:GetSecretValue",
    "Resource": "arn:aws:secretsmanager:ap-south-1:*:secret:motel-management-secrets-*"
  }]
}
```

### 3️⃣ Deploy Changes (3 min)
```bash
ssh -i motel-management-key.pem ubuntu@3.110.24.107
cd /home/ubuntu/motel-management-system

# Get latest code
git pull origin main

# Install dependencies
cd server && npm install && cd ..

# Restart service
pm2 restart motel-backend

# Check logs
pm2 logs motel-backend
```

**Expected output:**
```
✅ Secrets loaded from AWS Secrets Manager
📦 Users configured: owner@elitegrand.com, reception@elitegrand.com
```

---

## ✅ Verify Success

Test login: https://elitegrandhotel.site
- Email: owner@elitegrand.com
- Password: Elitegrand#1818

---

## Files Modified

| File | Change |
|------|--------|
| server/index.js | AWS Secrets Manager integration |
| server/package.json | +AWS SDK, -dotenv |
| AWS_SECRETS_SETUP.md | Complete setup guide |
| SECURITY.md | Updated documentation |
| MIGRATION_COMPLETE.md | Action checklist |

---

**Total Time**: ~7 minutes | **Difficulty**: Easy | **Status**: Ready to deploy
