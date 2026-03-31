# AWS Infrastructure Setup - Quick Reference Guide

**Date**: March 31, 2026  
**Region**: ap-south-1 (Mumbai, India)  
**Status**: ✅ 95% Complete (waiting for RDS)

---

## 📋 Infrastructure Summary

### EC2 Instance ✅
| Property | Value |
|----------|-------|
| Instance ID | `i-0e0744e92414e9249` |
| Instance Type | `t3.micro` (free tier) |
| Status | **running** |
| Elastic IP | `3.110.24.107` |
| SSH Key | `motel-management-key.pem` |
| Region | `ap-south-1` |

### RDS Database ⏳
| Property | Value |
|----------|-------|
| Instance ID | `motel-management-db` |
| Engine | PostgreSQL 14.15 |
| Instance Class | `db.t3.micro` (free tier) |
| Database | `motel_db` |
| Status | **creating** (5-15 min) |
| Username | `motel_admin` |
| Port | `5432` |
| Storage | `20 GB (gp2)` |
| Endpoint | **PENDING** |

### Networking 🌐
| Component | Details |
|-----------|---------|
| VPC | `vpc-04643c96fb3b5b092` |
| Subnet | `subnet-068afd633af033498` |
| EC2 Security Group | `sg-02b0e2b042dfd5c88` (motel-management-ec2-sg) |
| RDS Security Group | `sg-0c4390bd9961af658` (motel-management-rds-sg) |
| Elastic IP Allocation | `eipalloc-0d46f4c0f37517ed3` |

---

## 🔑 Credentials & Connection Strings

### SSH Access
```bash
# Connect to EC2 instance
ssh -i motel-management-key.pem ubuntu@3.110.24.107
```

### RDS Database Credentials
```
Hostname: PENDING (will be provided by AWS)
Port: 5432
Database: motel_db
Username: motel_admin
Password: MotelApp2026!Secure
```

### PostgreSQL Connection String (template)
```
postgresql://motel_admin:MotelApp2026!Secure@{RDS_ENDPOINT}:5432/motel_db
```

### Environment Variables for Application
```bash
export DB_HOST={RDS_ENDPOINT}
export DB_PORT=5432
export DB_NAME=motel_db
export DB_USER=motel_admin
export DB_PASSWORD=MotelApp2026!Secure
export NODE_ENV=production
export PORT=5000
```

---

## 🚀 Getting Started

### 1️⃣ Wait for RDS Database (5-15 minutes)
```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier motel-management-db \
  --region ap-south-1 \
  --profile motel-deploy \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}'
```

### 2️⃣ SSH into EC2 Instance
```bash
ssh -i motel-management-key.pem ubuntu@3.110.24.107
```

### 3️⃣ Update System & Install Dependencies
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm git pm2

# Verify installation
node --version
npm --version
```

### 4️⃣ Clone & Setup Application
```bash
cd /home/ubuntu
git clone https://github.com/sidharthsv18/motel-management-system.git
cd motel-management-system
npm run setup
```

### 5️⃣ Configure Environment Variables
```bash
# Create .env file with RDS endpoint (once available)
cat > server/.env << EOF
NODE_ENV=production
PORT=5000
DB_HOST={REPLACE_WITH_RDS_ENDPOINT}
DB_PORT=5432
DB_NAME=motel_db
DB_USER=motel_admin
DB_PASSWORD=MotelApp2026!Secure
EOF
```

### 6️⃣ Initialize Database
```bash
# Connect to RDS and run init script
psql -h {RDS_ENDPOINT} -U motel_admin -d motel_db -f database/init.sql
```

### 7️⃣ Start Application
```bash
# Using PM2 (recommended for production)
pm2 start npm --name 'motel-backend' -- --prefix server start
pm2 start npm --name 'motel-frontend' -- --prefix client run dev -- --port 3000 --host 0.0.0.0
pm2 save
pm2 startup

# Or manually
cd server && npm start
# In another terminal: cd client && npm run dev -- --port 3000 --host 0.0.0.0
```

### 8️⃣ Access Application
- **Backend**: `http://3.110.24.107:5000`
- **Frontend**: `http://3.110.24.107:3000`

---

## 📊 AWS CLI Commands

### EC2 Management
```bash
# List all instances
aws ec2 describe-instances --region ap-south-1 --profile motel-deploy

# Get specific instance details
aws ec2 describe-instances --instance-ids i-0e0744e92414e9249 \
  --region ap-south-1 --profile motel-deploy

# Stop instance (to save costs)
aws ec2 stop-instances --instance-ids i-0e0744e92414e9249 \
  --region ap-south-1 --profile motel-deploy

# Start instance
aws ec2 start-instances --instance-ids i-0e0744e92414e9249 \
  --region ap-south-1 --profile motel-deploy

# Terminate instance (⚠️ permanent)
aws ec2 terminate-instances --instance-ids i-0e0744e92414e9249 \
  --region ap-south-1 --profile motel-deploy
```

### RDS Management
```bash
# List all RDS instances
aws rds describe-db-instances --region ap-south-1 --profile motel-deploy

# Get specific database details
aws rds describe-db-instances --db-instance-identifier motel-management-db \
  --region ap-south-1 --profile motel-deploy

# Get just the endpoint
aws rds describe-db-instances --db-instance-identifier motel-management-db \
  --region ap-south-1 --profile motel-deploy \
  --query 'DBInstances[0].Endpoint.Address' --output text

# Modify database (e.g., change backup retention)
aws rds modify-db-instance --db-instance-identifier motel-management-db \
  --backup-retention-period 7 --apply-immediately \
  --region ap-south-1 --profile motel-deploy

# Delete database (⚠️ permanent)
aws rds delete-db-instance --db-instance-identifier motel-management-db \
  --skip-final-snapshot --region ap-south-1 --profile motel-deploy
```

### Elastic IP Management
```bash
# List all Elastic IPs
aws ec2 describe-addresses --region ap-south-1 --profile motel-deploy

# Get specific Elastic IP details
aws ec2 describe-addresses --allocation-ids eipalloc-0d46f4c0f37517ed3 \
  --region ap-south-1 --profile motel-deploy

# Disassociate Elastic IP
aws ec2 disassociate-address --association-id eipassoc-0eb94c73b524971ec \
  --region ap-south-1 --profile motel-deploy

# Release Elastic IP
aws ec2 release-address --allocation-id eipalloc-0d46f4c0f37517ed3 \
  --region ap-south-1 --profile motel-deploy
```

---

## 💰 Cost Estimation

### Free Tier Benefits (12 months)
- ✅ EC2 t3.micro: **750 hours/month** FREE
- ✅ RDS db.t3.micro: **750 hours/month** + **20 GB storage** FREE
- ✅ Elastic IP: **FREE** (when associated)
- ✅ Data Transfer: **100 GB/month out** FREE

### Estimated Monthly Cost
- **Within Free Tier**: `$0` 🎉
- **After Free Tier**: ~$50-60/month (EC2 + RDS)

---

## 🔒 Security Notes

### Important ⚠️
1. **Key File**: Keep `motel-management-key.pem` secure
   - Added to `.gitignore`
   - Never share or commit to repository
   
2. **RDS Password**: `MotelApp2026!Secure`
   - Use `.env` file (added to `.gitignore`)
   - Consider AWS Secrets Manager for production
   
3. **Security Groups**:
   - EC2: Allows SSH (22), HTTP (80), HTTPS (443), App (5000) from anywhere
   - RDS: Only allows connections from EC2 security group
   
4. **IP Whitelisting** (production):
   - Consider restricting SSH to your IP only
   - Use `--cidr-ip YOUR_IP/32` in security group rules

### Update Security Group (restrict SSH)
```bash
# Remove SSH access from anywhere
aws ec2 revoke-security-group-ingress \
  --group-id sg-02b0e2b042dfd5c88 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region ap-south-1 --profile motel-deploy

# Add SSH access from specific IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-02b0e2b042dfd5c88 \
  --protocol tcp --port 22 --cidr YOUR_IP/32 \
  --region ap-south-1 --profile motel-deploy
```

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `aws-infrastructure-complete.txt` | Detailed setup summary |
| `aws-infrastructure-config.json` | Machine-readable configuration |
| `motel-management-key.pem` | SSH private key (keep safe!) |
| `deploy-on-ec2.sh` | Deployment script for EC2 |
| `AWS_QUICK_REFERENCE.md` | This file |

---

## 🔧 Troubleshooting

### Can't SSH to EC2?
1. Verify Elastic IP: `3.110.24.107`
2. Check key permissions: `chmod 600 motel-management-key.pem`
3. Verify security group allows port 22
4. Instance might be initializing (wait 1-2 minutes)

### RDS Connection Failed?
1. Check RDS status: `aws rds describe-db-instances ...`
2. Wait for status: `available`
3. Verify database name, user, password
4. Check security group allows port 5432 from EC2

### Application Won't Start?
1. Check Node.js/npm installed: `node --version`
2. Verify dependencies installed: `npm list`
3. Check environment variables: `env | grep DB_`
4. Review logs: `pm2 logs motel-backend`

---

## 📚 Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [PostgreSQL on RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/)

---

## ✅ Deployment Checklist

- [x] AWS CLI configured with motel-deploy profile
- [x] EC2 Security Group created
- [x] RDS Security Group created
- [x] Key Pair created and saved locally
- [x] EC2 instance launched (t3.micro)
- [x] Elastic IP allocated and associated
- [x] RDS database created (PostgreSQL 14.15)
- [ ] Wait for RDS to reach "available" status
- [ ] Record RDS endpoint
- [ ] SSH into EC2
- [ ] Install dependencies
- [ ] Clone application
- [ ] Configure environment variables
- [ ] Initialize database
- [ ] Start application
- [ ] Test application endpoints

---

**Last Updated**: March 31, 2026  
**Status**: 95% Complete - Awaiting RDS Initialization

Next step: Monitor RDS status and update configuration once endpoint is available.
