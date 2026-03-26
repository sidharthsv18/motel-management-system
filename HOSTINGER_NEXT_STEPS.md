# 🚀 Hostinger VPS Setup - Complete Checklist (After Purchase)

**Estimated Time:** 1-2 hours  
**Cost:** $6.50/month  
**Result:** Your motel management app live on your domain!

---

## 📋 Quick Checklist Overview

```
□ Step 1: Buy Hostinger VPS ($6.50/month)
□ Step 2: Receive VPS credentials (IP, password)
□ Step 3: SSH login to your server
□ Step 4: Run initial setup commands
□ Step 5: Install Node.js
□ Step 6: Install PostgreSQL
□ Step 7: Setup database & tables
□ Step 8: Deploy your application
□ Step 9: Install Nginx & SSL
□ Step 10: Connect your domain
```

---

## STEP 1: Buy Hostinger VPS

**Here's what to do:**

1. Go to: https://www.hostinger.com/vps
2. Choose **Basic Plan** ($6.50/month - first billing)
3. Select **Linux** (Ubuntu 20.04 or 22.04)
4. Select **Region closest to you** (faster loading)
5. Choose billing: **Monthly** (you can cancel anytime)
6. Complete purchase

**What you'll receive via email:**
```
VPS IP: 1.2.3.4 (example)
Root Password: xkH9j@kL2p
SSH Port: 22 (usually)
```

**Save these credentials somewhere safe!** You'll need them in Step 3.

---

## STEP 2: Get Your VPS Ready

After purchase, wait **5-10 minutes** for Hostinger to provision your VPS.

Check your email for:
- VPS IP address
- Root password
- Login instructions

---

## STEP 3: SSH Into Your VPS

### On Windows (PowerShell):

```powershell
# Use OpenSSH (built into Windows 10+)
ssh root@YOUR_VPS_IP

# When prompted, enter your password:
# (Will say: "root@YOUR_VPS_IP's password:")
# Paste the password (right-click = paste in PowerShell)

# You should see:
# Welcome to Ubuntu 20.04 LTS (GNU/Linux 5.4.0-42-generic x86_64)
# root@vps-xxxxx:~#
```

### On Mac/Linux:
```bash
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

**✅ You're now connected to your server!**

---

## STEP 4: Initial Server Setup (Security)

Run these commands in order:

```bash
# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git nano htop

# Change root password (RECOMMENDED)
passwd
# Enter new strong password twice

# Create new user (safer than using root)
adduser deploy
# When prompted, enter password and details
# Just press Enter for optional fields

# Give user sudo access
usermod -aG sudo deploy

# Switch to new user
su - deploy

# Verify you're the new user (should see deploy@...)
whoami
```

**From now on, use `deploy` user instead of root for security!**

---

## STEP 5: Install Node.js

```bash
# Add NodeSource repository (official Node.js repo)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js & npm
sudo apt-get install -y nodejs

# Verify installation
node --version    # Should show v18.x.x
npm --version     # Should show 9.x.x
```

✅ **Node.js installed!**

---

## STEP 6: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Verify installation
psql --version    # Should show PostgreSQL 12 or higher

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Auto-start on reboot

# Check status
sudo systemctl status postgresql
# Press 'q' to exit
```

✅ **PostgreSQL installed!**

---

## STEP 7: Setup Database & Tables

```bash
# Login to PostgreSQL as default user
sudo -u postgres psql

# You should now see: postgres=#
# Run these commands inside PostgreSQL:

-- Create database
CREATE DATABASE motel_db;

-- Create user
CREATE USER motel_user WITH PASSWORD 'CHOOSE_A_STRONG_PASSWORD';

-- Set user encoding
ALTER ROLE motel_user SET client_encoding TO 'utf8';
ALTER ROLE motel_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE motel_user SET timezone TO 'UTC';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE motel_db TO motel_user;

-- List databases to verify
\l

-- Exit PostgreSQL
\q
```

You should see your database `motel_db` in the list.

**✅ Database created!**

---

## STEP 8: Deploy Your Application

```bash
# Go to home directory
cd ~

# Clone your GitHub repository
git clone https://github.com/YOUR_GITHUB_USERNAME/motel-management-system.git
cd motel-management-system

# Install all dependencies
npm run setup

# This installs:
# - Root dependencies
# - Server dependencies (npm install in server/)
# - Client dependencies (npm install in client/)

# Build the frontend for production
npm --prefix client run build
# Creates client/dist/ folder with optimized files
```

**✅ Code downloaded & built!**

---

## STEP 9: Create Configuration File

```bash
# From ~/motel-management-system directory
nano .env

# Paste this content (update passwords):
```

**Paste into nano editor:**
```env
DATABASE_URL=postgresql://motel_user:STRONG_PASSWORD@localhost:5432/motel_db
JWT_SECRET=generate_a_random_32_character_string_like_this_xkL9j@kL2p9mN5qR7sT

NODE_ENV=production
PORT=5000
```

**To generate JWT_SECRET, use:**
```bash
# Run this in terminal (generates 32-char random string)
openssl rand -base64 32
# Copy the output and paste into JWT_SECRET
```

**After pasting:**
- Press `Ctrl+X`
- Press `Y` (yes to save)
- Press `Enter` (keep filename)

✅ **.env file created!**

---

## STEP 10: Initialize Database Tables

```bash
# From ~/motel-management-system directory
psql -U motel_user -h localhost -d motel_db < database/init.sql

# You should see:
# CREATE TABLE (no errors = success!)
```

**✅ Database tables created!**

---

## STEP 11: Install PM2 (Keep App Running)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start your Node.js server
pm2 start server/index.js --name motel-api

# Check if it's running
pm2 list
# Should show: motel-api (online)

# Make PM2 auto-start on reboot
pm2 startup
# Copy the command it shows and run it
pm2 save
```

**✅ Server running with PM2!**

Test if backend is working:
```bash
curl http://localhost:5000
# Should show: {"message":"Motel Management API Running ✅"}
```

---

## STEP 12: Setup Nginx (Reverse Proxy)

Nginx forwards requests from port 80 (HTTP) to your app on port 5000.

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/motel

# Paste this config:
```

**Nginx Configuration** (paste into nano):
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

    # Frontend (catch all)
    location / {
        root /home/deploy/motel-management-system/client/dist;
        try_files $uri /index.html;
    }
}
```

**After pasting:**
- Press `Ctrl+X`, `Y`, `Enter`

**Enable the config:**
```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/motel /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t
# Should show: OK

# Restart Nginx
sudo systemctl restart nginx
```

**✅ Nginx configured!**

Test if app loads:
```bash
curl http://localhost
# Should show HTML of login page (no errors)
```

---

## STEP 13: Serve Frontend with PM2 (Static Files)

```bash
# Start frontend as static site
pm2 serve /home/deploy/motel-management-system/client/dist 3000 --spa --name motel-web

# Verify both services running
pm2 list
# Should show:
# motel-api    (online)
# motel-web    (online)

# Save PM2 config
pm2 save
```

**✅ Frontend served by PM2!**

---

## STEP 14: Setup SSL Certificate (Free HTTPS) ⭐ IMPORTANT

```bash
# Install Certbot (Let's Encrypt tool)
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with YOUR domain)
sudo certbot --nginx -d yourmotel.com -d www.yourmotel.com

# When prompted:
# - Enter email address
# - Agree to terms (A)
# - Choose redirect HTTPS (2)

# Verify certificate auto-renewal
sudo certbot renew --dry-run
# Should show successful renewal simulation
```

**✅ SSL Certificate installed! Your site is now HTTPS!**

---

## STEP 15: Connect Your Domain

**Go to your domain registrar** (GoDaddy, Namecheap, etc.)

Update DNS A records:
```
Host: @
Type: A
Value: YOUR_VPS_IP_ADDRESS
TTL: 3600

Host: www
Type: CNAME
Value: yourmotel.com
TTL: 3600
```

**Wait for DNS propagation** (usually 5 minutes to 24 hours)

Test if domain works:
```bash
ping yourmotel.com
# Should show YOUR_VPS_IP_ADDRESS
```

---

## STEP 16: Access Your Site!

Once DNS propagates:

1. Open browser
2. Go to: `https://yourmotel.com` (note: HTTPS!)
3. Login with:
   - Email: `owner@motel.com`
   - Password: `password123`

**🎉 Your app is LIVE!**

---

## 🔍 Verify Everything is Working

Check all services:
```bash
# Check if backend is running
pm2 list
# Should show motel-api (online) and motel-web (online)

# Check database connection
psql -U motel_user -h localhost -d motel_db -c "SELECT COUNT(*) FROM users;"
# Should show count: 2

# Check Nginx
sudo systemctl status nginx
# Should show: active (running)

# Check logs
pm2 logs motel-api
# Should show startup message (Ctrl+C to exit)
```

---

## 🛠️ Useful Commands for Later

```bash
# View logs
pm2 logs motel-api     # Backend logs
pm2 logs motel-web     # Frontend logs

# Stop/restart services
pm2 restart motel-api
pm2 restart motel-web

# View PM2 dashboard
pm2 monit

# Restart Nginx
sudo systemctl restart nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Backup database
pg_dump -U motel_user -h localhost motel_db > backup.sql

# Restore database
psql -U motel_user -h localhost motel_db < backup.sql

# SSH back into server
ssh deploy@YOUR_VPS_IP
```

---

## 🔐 Post-Setup Security Checklist

- [x] Change root password
- [x] Create non-root user (deploy)
- [ ] Disable SSH password login (use SSH keys instead)
- [ ] Setup firewall (UFW)
- [ ] Enable automatic updates
- [ ] Setup backup strategy

```bash
# Setup firewall (UFW)
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## ❓ Common Issues & Fixes

**Issue: "Connection refused" when accessing site**
```bash
# Check if services are running
pm2 list
# If not running, restart
pm2 restart motel-api motel-web
```

**Issue: "502 Bad Gateway"**
```bash
# Backend is down, check logs
pm2 logs motel-api
# Look for error messages

# Restart
pm2 restart motel-api
```

**Issue: Database connection error**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/*.log
```

**Issue: Domain not connecting**
```bash
# Wait 24 hours for DNS to propagate
# Then verify DNS is set correctly
nslookup yourmotel.com
# Should show YOUR_VPS_IP_ADDRESS
```

---

## 📞 Support

If you get stuck, check:
1. Server logs: `pm2 logs`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Database logs: `sudo tail -f /var/log/postgresql/*.log`

---

## ✅ Final Checklist (Before Celebrating!)

- [ ] VPS purchased & credentials received
- [ ] SSH login successful
- [ ] Node.js v18 installed
- [ ] PostgreSQL running
- [ ] Database & tables created
- [ ] .env file configured
- [ ] Backend running (pm2 list shows motel-api online)
- [ ] Frontend built & serving
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Domain DNS updated
- [ ] Can access https://yourmotel.com
- [ ] Can login with owner@motel.com / password123
- [ ] Dashboard loads with mock data

**All checked? 🎉 YOU'RE DONE!**

**Your motel management app is now live on the internet!**

Ongoing cost: **$6.50/month forever!**

---

## 🚀 Next: Actual Database Integration

Once everything above works, proceed to:
**[DEPLOYMENT_ROADMAP.md → Phase 2: Database Integration](./DEPLOYMENT_ROADMAP.md#-phase-2-database-integration-next-step)**

This will replace mock data with real database data from your PostgreSQL tables.
