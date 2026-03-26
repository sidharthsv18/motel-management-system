# 🚀 AWS Free Tier Setup - Complete Deployment Guide

**Estimated Time:** 2-3 hours  
**Cost:** $0 for 12 months (Free Tier!)  
**Region:** Mumbai (India) for your receptionist  
**Result:** Your motel app live on your domain with HTTPS!

---

## 📋 AWS Services You Need vs Don't Need

### ✅ NEEDED (Part of Free Tier):
```
1. EC2 t2.micro instance   → Your backend server (FREE)
2. RDS PostgreSQL          → Your database (FREE)
3. Security Groups         → Firewall rules (FREE)
4. Elastic IP              → Fixed IP address (FREE)
5. SSL Certificate         → HTTPS (FREE with Let's Encrypt)
```

### ❌ NOT NEEDED (Skip these):
```
❌ VPC                     → Default VPC is fine (comes with account)
❌ NAT Gateway            → Only needed for private subnets
❌ Load Balancer          → Only needed for scaling (you're small)
❌ Auto Scaling           → Only needed for variable traffic
❌ Cloudfront CDN         → Only needed for global fast delivery
❌ AWS Certificate Manager→ Use free Let's Encrypt instead
```

**Simple answer:** Just create EC2 + RDS, configure Security Groups, get Elastic IP, done! 🎯

---

## 🎯 Quick Overview of Steps

```
Step 1: Create AWS Account (Free Tier)        → 10 min
Step 2: Create EC2 t2.micro instance         → 10 min
Step 3: Create RDS PostgreSQL database        → 15 min
Step 4: Configure Security Groups (Firewall) → 10 min
Step 5: Get Elastic IP (Fixed Address)        → 5 min
Step 6: SSH Into Your EC2 Instance            → 2 min
Step 7: Install Node.js & PostgreSQL CLI      → 15 min
Step 8: Deploy Your Application               → 20 min
Step 9: Install Nginx & SSL Certificate       → 15 min
Step 10: Connect Your Domain                  → 10 min
Step 11: Test Everything                      → 10 min
```

**TOTAL TIME: 2-3 hours for everything!**

---

## STEP 1: Create AWS Account (Free Tier)

### **Go to AWS:**
1. Visit: https://aws.amazon.com/
2. Click "Create AWS Account"
3. Follow signup process:
   - Email address
   - Password
   - Account name
   - Contact information
   - **Payment method** (for monitoring, won't be charged)

### **Verify Email:**
- AWS sends verification email
- Click verification link
- Account created!

### **Enable Free Tier Benefits:**
1. Go to AWS Console
2. Check you're in **Free Tier Eligible** account
3. You should see green "Free Tier" badge
4. Receive **$200 free credits** (automatic for new accounts)

✅ **AWS Account Ready!**

---

## STEP 2: Create EC2 Instance (Your Server)

### **Go to EC2 Dashboard:**
1. AWS Console → Search "EC2"
2. Click "EC2 Dashboard"
3. Left sidebar → Click "Instances"
4. Click "Launch Instances"

### **Configure Instance:**

**Step 2a: Choose Instance Type**
- Name: `motel-app`
- OS image: **Ubuntu 22.04 LTS**
- Instance type: **t2.micro** ← Make sure this shows "Free tier eligible"

**Step 2b: Key Pair (for SSH login)**
```
Key pair name: motel-app-key
Key pair type: RSA
File format: .pem (for Mac/Linux) or .ppk (for Windows)

⚠️ IMPORTANT: Save this file! You need it to login to server!
```

**Step 2c: Network Settings**
```
Auto-assign public IP: Enable ✅
Allow SSH: Yes ✅
Allow HTTP: Yes ✅
Allow HTTPS: Yes ✅
```

**Step 2d: Storage**
```
Size: 30 GB ✅
Type: gp2/gp3 (free tier eligible)
```

**Step 2e: Advanced - Tag the instance**
```
Key: Name
Value: motel-app
```

### **Review & Launch**
- Review all settings
- Click "Launch Instance"
- Wait 30-60 seconds for instance to start

✅ **EC2 Instance Created!**

**Save this info:**
```
Instance ID: i-xxxxxxxxxxxxx
Public IP: 1.2.3.4 (changes on reboot!)
```

---

## STEP 3: Create RDS PostgreSQL Database

### **Go to RDS Dashboard:**
1. AWS Console → Search "RDS"
2. Click "RDS Dashboard"
3. Left sidebar → "Databases"
4. Click "Create Database"

### **Configure Database:**

**Step 3a: Engine Selection**
```
Engine type: PostgreSQL
Version: 15.4 (latest free tier eligible)
Templates: Free tier
```

**Step 3b: Settings**
```
DB instance identifier: motel-postgres
Master username: postgres
Master password: STRONG_PASSWORD_HERE (min 8 chars)
Confirm password: Same password
```

**Step 3c: Instance Configuration**
```
Instance class: db.t3.micro ✅ (Free tier)
Storage: General Purpose (gp2)
Allocated storage: 20 GB (expandable to 30 GB free)
Enable storage autoscaling: Enable ✅
```

**Step 3d: Connectivity**
```
VPC: default (comes with account)
DB subnet group: default
Public accessibility: Yes ✅ (so you can connect from EC2)
VPC security group: default
Availability zone: ap-south-1a (Mumbai)
Database port: 5432 (default)
```

**Step 3e: Database Options**
```
DB name: motel_db
Backup retention: 7 days (free)
Enable automatic minor version upgrades: Yes
Enable Enhanced Monitoring: No (to avoid charges)
```

### **Review & Create**
- Click "Create Database"
- Wait 5-10 minutes for database to be ready

✅ **RDS Database Created!**

**Save this info:**
```
DB endpoint: motel-postgres.xxxxx.ap-south-1.rds.amazonaws.com
Database name: motel_db
Master username: postgres
Master password: STRONG_PASSWORD_HERE
```

---

## STEP 4: Configure Security Groups (Firewall)

Security Groups control what traffic can reach your servers.

### **For EC2 (What can connect to your web server):**

1. EC2 Dashboard → Instances
2. Click on your `motel-app` instance
3. Go to "Security" tab
4. Click security group name
5. Click "Edit inbound rules"
6. Add these rules:

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| SSH | TCP | 22 | Your IP | SSH login |
| HTTP | TCP | 80 | 0.0.0.0/0 | Website |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Website (secure) |

**To find your IP:**
```
Go to: https://whatismyipaddress.com
Copy your public IPv4
```

### **For RDS (What can connect to database):**

1. RDS Dashboard → Databases
2. Click your `motel-postgres` database
3. Go to "Connectivity & security"
4. Click security group
5. Click "Edit inbound rules"
6. Add rule:

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| PostgreSQL | TCP | 5432 | EC2 security group | EC2 → Database |

**Source:** Select EC2 instance security group (allows EC2 to talk to RDS)

✅ **Security Groups Configured!**

---

## STEP 5: Get Elastic IP (Fixed Address)

By default, EC2 public IP changes on reboot. Get a fixed IP:

### **Allocate Elastic IP:**
1. EC2 Dashboard → Left sidebar → "Elastic IPs"
2. Click "Allocate Elastic IP address"
3. Region: ap-south-1 (Mumbai)
4. Click "Allocate"

### **Associate with EC2:**
1. Select the new Elastic IP
2. Click "Associate Elastic IP address"
3. Select your `motel-app` instance
4. Select network interface
5. Click "Associate"

✅ **Elastic IP assigned!**

**This is your fixed IP:**
```
Elastic IP: 1.2.3.4 (this won't change on reboot)
```

---

## STEP 6: SSH Into Your EC2 Instance

### **On Windows PowerShell:**

```powershell
# First, set permissions on key pair (one time)
icacls "C:\path\to\motel-app-key.pem" /inheritance:r
icacls "C:\path\to\motel-app-key.pem" /grant:r "$env:username`:F"

# SSH into instance
ssh -i "C:\path\to\motel-app-key.pem" ubuntu@YOUR_ELASTIC_IP

# You should see: ubuntu@ip-10-0-1-xxx:~$
```

### **On Mac/Linux:**

```bash
# Set permissions (one time)
chmod 400 ~/motel-app-key.pem

# SSH into instance
ssh -i ~/motel-app-key.pem ubuntu@YOUR_ELASTIC_IP
```

✅ **SSH Connected!**

---

## STEP 7: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git nano

# Install Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js
node --version    # Should show v18.x.x

# Install PostgreSQL client (to connect to RDS)
sudo apt install -y postgresql-client

# Create application user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy

# Switch to deploy user
sudo su - deploy

# Verify you're deploy user (should show deploy@...)
whoami
```

✅ **Server Basics Installed!**

---

## STEP 8: Deploy Your Application

```bash
# From deploy user home directory
cd ~

# Clone your GitHub repository
git clone https://github.com/YOUR_GITHUB_USERNAME/motel-management-system.git
cd motel-management-system

# Install dependencies
npm run setup

# Build frontend for production
npm --prefix client run build

# Create .env file with RDS connection
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@motel-postgres.xxxxx.ap-south-1.rds.amazonaws.com:5432/motel_db
JWT_SECRET=your_random_secret_key_min_32_chars
NODE_ENV=production
PORT=5000
EOF
```

### **Initialize Database:**

```bash
# Connect to RDS and initialize tables
psql -h motel-postgres.xxxxx.ap-south-1.rds.amazonaws.com -U postgres -d motel_db < database/init.sql

# When prompted for password, enter STRONG_PASSWORD

# Verify tables created
psql -h motel-postgres.xxxxx.ap-south-1.rds.amazonaws.com -U postgres -d motel_db -c "\dt"
# Should show: users, rooms, bookings, expenses, payments, audit_logs
```

✅ **Application Deployed!**

---

## STEP 9: Install PM2 & Nginx

### **Install PM2 (process manager):**

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start your backend server
pm2 start server/index.js --name motel-api

# Verify running
pm2 list
# Should show: motel-api (online)

# Make PM2 auto-start on reboot
pm2 startup
pm2 save
```

### **Install & Configure Nginx:**

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/motel

# Paste this config:
```

**Nginx Config** (paste into editor):
```nginx
upstream motel_api {
    server 127.0.0.1:5000;
}

upstream motel_web {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name _;

    # API endpoints
    location /api {
        proxy_pass http://motel_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (static files)
    location / {
        root /home/deploy/motel-management-system/client/dist;
        try_files $uri /index.html;
    }
}
```

**Save and enable:**
```bash
# Press Ctrl+X, Y, Enter to save

# Enable the site
sudo ln -s /etc/nginx/sites-available/motel /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t
# Should show: OK

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### **Serve Frontend with PM2:**

```bash
# Serve frontend static files
pm2 serve /home/deploy/motel-management-system/client/dist 3000 --spa --name motel-web

# Verify both services
pm2 list
# Should show: motel-api (online), motel-web (online)

# Save PM2 config
pm2 save
```

✅ **Nginx & PM2 Configured!**

---

## STEP 10: Install SSL Certificate (FREE HTTPS)

### **Install Certbot:**

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with YOUR domain)
sudo certbot --nginx -d yourmotel.com -d www.yourmotel.com

# When prompted:
# - Enter email address
# - Agree to terms (A)
# - Enable HTTPS redirect (2)

# Verify auto-renewal
sudo certbot renew --dry-run
# Should show successful renewal simulation
```

✅ **SSL Certificate Installed! Site is now HTTPS!**

---

## STEP 11: Connect Your Domain

### **Update DNS Records:**

Go to your domain registrar (GoDaddy, Namecheap, etc.):

```
Type: A Record
Name: @
Value: YOUR_ELASTIC_IP (e.g., 1.2.3.4)
TTL: 3600

Type: A Record
Name: www
Value: YOUR_ELASTIC_IP
TTL: 3600
```

### **Wait for Propagation:**
- Usually 5 minutes to 24 hours
- Test with: `nslookup yourmotel.com`
- Should show your Elastic IP

✅ **Domain Connected!**

---

## STEP 12: Test Everything

```bash
# Check services running
pm2 list
# Should show both services online

# Test backend
curl http://localhost:5000
# Should show: {"message":"Motel Management API Running ✅"}

# Test database connection  
psql -h motel-postgres.xxxxx.ap-south-1.rds.amazonaws.com -U postgres -d motel_db -c "SELECT COUNT(*) FROM users;"
# Should show: 2 (your two test users)

# Check Nginx
sudo systemctl status nginx
# Should show: active (running)

# View logs if issues
pm2 logs motel-api
# Ctrl+C to exit
```

### **Access Your Site:**

1. Open browser
2. Go to: `https://yourmotel.com`
3. Login with:
   - Email: `owner@motel.com`
   - Password: `password123`
4. Dashboard should load with mock data ✅

---

## 🔐 Security Setup - One Time

```bash
# Setup firewall
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Change SSH port (optional, more secure)
sudo nano /etc/ssh/sshd_config
# Find: #Port 22
# Change to: Port 2222
# Save (Ctrl+X, Y, Enter)
# Then: sudo systemctl restart ssh
```

---

## 📊 AWS Free Tier Monitoring

### **Watch Your Usage:**

1. AWS Console → Billing Dashboard
2. Check "Free Tier" tab
3. Monitor:
   - EC2 hours used (max 750)
   - RDS hours used (max 750)
   - Data transfer (max 1 GB outbound)

### **Set Billing Alert (Recommended):**

1. Billing Dashboard → Billing Alerts
2. Create alert → When charges exceed $0.50
3. AWS emails you if any charge incoming
4. Prevents surprise bills

---

## ✅ Final Checklist

- [ ] AWS account created with Free Tier
- [ ] EC2 t2.micro instance running
- [ ] RDS PostgreSQL database running
- [ ] Security groups configured
- [ ] Elastic IP allocated & associated
- [ ] SSH login working
- [ ] Node.js v18 installed
- [ ] Application deployed
- [ ] Database tables initialized
- [ ] PM2 services running (motel-api + motel-web)
- [ ] Nginx configured & running
- [ ] SSL certificate installed
- [ ] Domain DNS updated
- [ ] Can access https://yourmotel.com
- [ ] Can login with owner@motel.com / password123
- [ ] Dashboard loads with mock data
- [ ] Billing alerts configured

**All checked? 🎉 YOU'RE DONE!**

---

## 💾 Useful AWS Commands

```bash
# SSH into your instance (from your computer)
ssh -i ~/motel-app-key.pem ubuntu@YOUR_ELASTIC_IP

# View logs
pm2 logs motel-api
pm2 logs motel-web

# Restart services
pm2 restart motel-api
pm2 restart motel-web

# Backup database
pg_dump -h motel-postgres.xxxxx.ap-south-1.rds.amazonaws.com \
  -U postgres motel_db > backup.sql

# Restore database
psql -h motel-postgres.xxxxx.ap-south-1.rds.amazonaws.com \
  -U postgres motel_db < backup.sql

# View EC2 details
aws ec2 describe-instances --region ap-south-1
```

---

## ⚠️ Important AWS Free Tier Rules

```
✅ DO:
- Use only t2.micro for EC2
- Use only db.t3.micro for RDS
- Keep within 750 hrs/month
- Delete unused resources
- Monitor billing alerts

❌ DON'T:
- Run multiple EC2 instances
- Use expensive instance types
- Transfer data across regions
- Run unused services
- Forget billing monitoring
```

---

## 🎯 Cost Breakdown (12 Months)

```
EC2 t2.micro:      FREE (750 hrs/month)
RDS db.t3.micro:   FREE (750 hrs/month)
Data transfer:     FREE (1 GB/month)
Elastic IP:        FREE
SSL certificate:   FREE (Let's Encrypt)
─────────────────────────────────────────
Month 1-12 TOTAL:  $0
Year 1 TOTAL:      $0 (+ $200 credits as buffer)
```

**After 12 months:**
- EC2 t2.micro: ~$8/month
- RDS PostgreSQL: ~$20/month
- TOTAL: ~$30-40/month

---

## 📚 Next: Database Integration

Once everything above works, proceed to:
**[DEPLOYMENT_ROADMAP.md → Phase 2: Database Integration](./DEPLOYMENT_ROADMAP.md#-phase-2-database-integration-next-step)**

This replaces mock data with real database queries.

---

## 🆘 Troubleshooting

**Problem: Can't SSH in**
- Check security group allows port 22 from your IP
- Verify key pair file permissions: `chmod 400 key.pem`

**Problem: "502 Bad Gateway"**
- Check pm2 services: `pm2 list` (restart if down)
- Check logs: `pm2 logs motel-api`

**Problem: Database connection fails**
- Verify RDS security group allows EC2
- Check .env DATABASE_URL is correct
- Verify RDS is running (check AWS console)

**Problem: Domain not connecting**
- Wait 24 hours for DNS propagation
- Verify DNS A records point to Elastic IP
- Check: `nslookup yourmotel.com`

---

**Your app is now LIVE on AWS Free Tier! 🎉**

Cost: **$0/month for 12 months!**
