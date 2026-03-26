# 🚀 Motel Management System - Complete Deployment Roadmap

## 📋 Overview

This document provides a step-by-step plan to:
1. ✅ **Code Cleanup** (COMPLETED)
2. 🔄 **Database Integration** (NEXT)
3. 🌐 **Deployment to Your Domain** (FINAL)

---

## ✅ Phase 1: Code Cleanup (COMPLETED)

### What Was Done:
- ✅ Deleted unused route files (`server/routes/` folder)
- ✅ Deleted unused middleware folder
- ✅ Deleted debug log files
- ✅ Created comprehensive `.gitignore`
- ✅ Updated `package.json` with better scripts
- ✅ Created `SETUP.md` with detailed instructions
- ✅ Updated `README.md` with quick start guide

### How to Start Now:
```bash
npm run setup    # Install dependencies once
npm start        # Start backend + frontend together
```

### Project is Now:
- 🧹 **Clean** - No unused files or folders
- 📚 **Well-documented** - See README.md and SETUP.md
- 🚀 **Easy to start** - Single command: `npm start`
- 🔧 **Easy to maintain** - All code in server/index.js, clear structure

---

## 🔄 Phase 2: Database Integration (NEXT STEP)

### Current Status:
- Currently using **in-memory mock data**
- Mock data resets on server restart
- Perfect for testing, but not production-ready

### Step 1: Install PostgreSQL

#### Option A: Local Installation
```bash
# Windows - Download installer from: https://www.postgresql.org/download/windows/
# Follow the installation wizard
# Default port: 5432
# Default user: postgres
```

#### Option B: Docker (Recommended - No installation needed)
```bash
# Install Docker from: https://www.docker.com/products/docker-desktop
# Then run:
docker run --name motel-postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=motel_db \
  -p 5432:5432 \
  -d postgres:15

# Or with docker-compose.yml:
# version: '3'
# services:
#   postgres:
#     image: postgres:15
#     environment:
#       POSTGRES_DB: motel_db
#       POSTGRES_PASSWORD: password123
#     ports:
#       - "5432:5432"
```

### Step 2: Create Database & Tables

```bash
# 1. Connect to PostgreSQL
psql -U postgres

# 2. Create database
CREATE DATABASE motel_db;

# 3. Connect to new database
\c motel_db

# 4. Run initialization script
\i database/init.sql

# 5. Verify tables created
\dt
```

### Step 3: Update .env File

```env
# .env (in project root)
DATABASE_URL=postgresql://postgres:password123@localhost:5432/motel_db
JWT_SECRET=your_super_secret_key_change_this
PORT=5000
NODE_ENV=development
```

### Step 4: Server Will Automatically Switch to Database

The server code works with both mock data and database:
- If `DATABASE_URL` in .env → uses PostgreSQL
- If `DATABASE_URL` missing → uses mock data

Just restart: `npm start`

### Database Schema (Already Created by init.sql):

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'owner' or 'receptionist'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'available', -- 'available' or 'occupied'
  price_per_night DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  room_id INTEGER REFERENCES rooms(id),
  guests INTEGER,
  price DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  expense_type VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  paid_to VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  total_amount DECIMAL(10, 2),
  paid_amount DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action VARCHAR(50),
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  user_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Testing Database Connection:

```bash
# After restarting server, check if it's using database:
# 1. Look for log message in console
# 2. Create a booking in the UI
# 3. Restart the server
# 4. If booking is still there → Database is working! ✅
```

---

## 🌐 Phase 3: Deployment to Your Domain

### Prerequisites Before Deploying:
- ✅ Cleaned up code (DONE)
- ✅ Database working (After Phase 2)
- ✅ Own a domain name (e.g., yourmotel.com)

### Option A: Easiest - DigitalOcean App Platform ⭐ RECOMMENDED

**Cost:** $5-12/month for app + $15/month for managed database = **$20-27/month total**
**Database:** Managed PostgreSQL included (no setup needed!)
**Free Credits:** $200 available for new accounts (= 2-3 months free!)

**Steps:**

1. **Create GitHub Account & Push Code**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/motel-management-system.git
   git push -u origin main
   ```

2. **Sign Up for DigitalOcean (Get $200 Free Credits!)**
   - Go to: https://www.digitalocean.com
   - Click "Get started for free"
   - **Apply for FREE $200 credits:** https://www.digitalocean.com/try/free-credits
   - New accounts get **$200 credits for 12 months** (= covers everything for 2+ months!)
   - No credit card needed with credits
   - Must apply within 30 days of account creation

3. **Create PostgreSQL Database**
   DigitalOcean handles everything - click button, database is ready!
   - Go to Databases → Create Database
   - Service: **PostgreSQL** version 15
   - Plan: **Basic** ($15/month, covered by free credits)
   - Database name: `motel_db`
   - Region: Pick closest to you (e.g., US East, Europe, Asia)
   - Click **Create**
   - Wait 2-3 minutes
   - **COPY the connection string** (saves all connection details)

4. **Initialize Database Tables**
   - In DigitalOcean Dashboard, open your database
   - Click "Connection Details" → copy connection string
   - Run this command from your computer:
   ```bash
   psql "YOUR_CONNECTION_STRING_HERE" < database/init.sql
   ```
   - Tables created automatically ✅

5. **Create App in App Platform**
   - Go to **App Platform** → **Create App**
   - Connect your GitHub repository
   - DigitalOcean auto-detects it's a monorepo

6. **Configure Backend Service (Node.js)**
   - Service name: `api`
   - Source: `server` directory
   - Runtime: **Node.js**
   - Build command: Leave default
   - Run command: `node server/index.js`
   - Set Port: `5000`
   - Environment Variables:
     ```
     DATABASE_URL=postgresql://doadmin:xxxxx@db-xxx-xxx.a.db.ondigitalocean.com:25060/motel_db?sslmode=require
     JWT_SECRET=generate_random_strong_key_32_characters_minimum
     NODE_ENV=production
     ```
     (Copy DATABASE_URL from your database connection details)

7. **Configure Frontend Service (React)**
   - Service name: `web`
   - Source: `client` directory
   - Runtime: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment Variables:
     ```
     VITE_API_URL=https://your-backend-url.ondigitalocean.app
     ```
     (You'll get backend URL after first deploy)

8. **Connect Your Domain**
   - In App Settings → **Domains**
   - Add: `yourmotel.com` and `www.yourmotel.com`
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add DNS A record pointing to DigitalOcean IP
   - (DigitalOcean shows exact DNS values)
   - Wait 24 hours for DNS to update

9. **SSL/HTTPS - Automatic!**
   - DigitalOcean auto-enables Let's Encrypt SSL
   - Your site is automatically **HTTPS** secured ✅

10. **Deploy**
    - Click **Deploy** button
    - Wait 5-10 minutes
    - **Your app is live!** 🎉
    - Visit: `https://yourmotel.com`

**Why DigitalOcean App Platform is best:**
- ✅ **Managed database** (no SQL setup needed)
- ✅ **$200 free credits** (= 2+ months free!)
- ✅ **Auto SSL** (no certificate pain)
- ✅ **One-click deploy** from GitHub
- ✅ **No server management** (DigitalOcean handles updates)
- ✅ **2x cheaper** than Heroku ($20/mo vs $50/mo)
- ✅ **Better than AWS** for beginners (simpler, faster to deploy)

**Cost Timeline with $200 Free Credits:**
```
Month 1-2: FREE (using $200 credits)
Month 3 onwards: $20-27/month (if you keep using it)
- App + database = ~$27/month = $324/year
```

### Option B: Best Value - Hostinger VPS ($6.50/month) ⭐ CHEAPEST

**Cost:** $6.50/month (3-4x cheaper than other options!)
**Specs:** 1 vCPU, 4 GB RAM, 50 GB SSD, 4 TB bandwidth
**Database:** You install PostgreSQL (no extra cost)
**Best for:** Budget-conscious, want full control

**Why Hostinger VPS is Great:**
- ✅ **Cheapest:** $6.50/month ($78/year)
- ✅ **Most RAM:** 4 GB (vs 1 GB for similar price elsewhere)
- ✅ **Plenty of storage:** 50 GB (last 5+ years of data)
- ✅ **Root access:** You control everything
- ✅ **No vendor lock-in:** Use code anywhere
- ❌ Manual setup: 1-2 hours (you manage everything)
- ❌ You maintain updates & security patches

**Setup Steps:**

```bash
# 1. Buy VPS at https://www.hostinger.com/vps
# Cost: $6.50/month

# 2. SSH into your server
ssh root@your-vps-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 4. Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# 5. Clone your code
git clone https://github.com/your-username/motel-management-system.git
cd motel-management-system

# 6. Install dependencies
npm run setup

# 7. Setup database
sudo -u postgres psql
CREATE DATABASE motel_db;
CREATE USER motel_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE motel_db TO motel_user;
\q

# 8. Initialize tables
psql -U motel_user -d motel_db < database/init.sql

# 9. Create .env
echo "DATABASE_URL=postgresql://motel_user:strong_password@localhost:5432/motel_db" > .env
echo "JWT_SECRET=your_super_secret_key" >> .env
echo "NODE_ENV=production" >> .env

# 10. Install PM2 (keeps app running)
npm install -g pm2

# 11. Start app
pm2 start server/index.js --name motel-api
pm2 serve client/dist 3000 --spa --name motel-web
pm2 startup
pm2 save

# 12. Install Nginx (reverse proxy)
apt-get install -y nginx

# 13. Setup SSL certificate (FREE with Let's Encrypt)
apt-get install certbot python3-certbot-nginx
certbot --nginx -d yourmotel.com

# Done! App is live 🎉
```

**See [HOSTINGER_VPS_ANALYSIS.md](./HOSTINGER_VPS_ANALYSIS.md) for complete guide with Nginx config and backup strategy.**

---

### Option B2: Self-Hosted VPS (Linode, Vultr, etc.)

```bash
# 1. Create VPS with Ubuntu 20.04 LTS
# 2. SSH into server
ssh root@your_server_ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 5. Clone your repository
git clone https://github.com/your-username/motel-management-system.git
cd motel-management-system

# 6. Install dependencies
npm run setup

# 7. Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE motel_db;
CREATE USER motel_user WITH PASSWORD 'strong_password';
ALTER ROLE motel_user SET client_encoding TO 'utf8';
ALTER ROLE motel_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE motel_db TO motel_user;
\q

# 8. Run database initialization
psql -U motel_user -d motel_db -f database/init.sql

# 9. Create .env file
nano .env
# Add:
# DATABASE_URL=postgresql://motel_user:strong_password@localhost:5432/motel_db
# JWT_SECRET=your_super_secret_key
# NODE_ENV=production
# Press Ctrl+X then Y to save

# 10. Install PM2 (process manager)
sudo npm install -g pm2

# 11. Start backend
pm2 start server/index.js --name "motel-api"

# 12. Build and serve frontend
npm --prefix client run build
pm2 serve client/dist 3000 --spa --name "motel-web"

# 13. Set PM2 to auto-start
pm2 startup
pm2 save

# 14. Install and configure Nginx (reverse proxy)
sudo apt-get install nginx

# 15. Configure Nginx
sudo nano /etc/nginx/sites-available/default
# Replace content with:
```

**Nginx Configuration:**
```nginx
upstream api {
    server 127.0.0.1:5000;
}

upstream web {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourmotel.com www.yourmotel.com;

    # API requests
    location /api {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://web;
    }
}
```

```bash
# 16. Test Nginx
sudo nginx -t

# 17. Restart Nginx
sudo systemctl restart nginx

# 18. Setup SSL Certificate (FREE with Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourmotel.com -d www.yourmotel.com

# 19. Update DNS
# Point yourdomain.com A record to your_server_ip

# Done! Your app is live 🎉
```

### Option C: Heroku (Easiest for Beginners)

**Cost:** $7/month (after free tier)

```bash
# 1. Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Create app
heroku create your-motel-app

# 4. Set environment variables
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set JWT_SECRET="your_secret_key"

# 5. Provision PostgreSQL add-on
heroku addons:create heroku-postgresql:hobby-dev

# 6. Push code
git push heroku main

# 7. Migrate database
heroku run "psql < database/init.sql"

# 8. Connect domain
heroku domains:add yourmotel.com
# Update DNS as instructed

# Done!
```

### Option D: AWS (Most Powerful but Complex)

**Cost:** FREE for 12 months with $200 new account credits (after credits: $50-100+/month)
**Database:** AWS RDS PostgreSQL (fully managed)
**Good for:** If you want to scale later or need advanced features

**AWS New Account Benefits:**
- ✅ **$200 free credits** for 12 months (not 6 months, but for 12!)
- ✅ **Free tier** for EC2, RDS, and other services for 12 months
- ✅ Can run app completely FREE for first 12 months with credits
- ⚠️ Complex setup (more manual configuration than DigitalOcean)

**When to choose AWS:**
- You expect high traffic (3000+ visitors/month)
- You need advanced features (auto-scaling, CDN, etc.)
- You want vendor lock-in protection
- You have AWS experience

**Basic AWS Setup (Simplified):**

```bash
# 1. Create AWS Account: https://aws.amazon.com/
# 2. Apply for new account credits ($200)
# 3. Go to EC2 Dashboard

# 4. Create EC2 Instance (Linux)
# - Choose: Ubuntu 20.04 LTS
# - Instance type: t2.micro (FREE tier)
# - Create security group (allow ports 80, 443, 5000)

# 5. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 6. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 7. Create RDS PostgreSQL Database
# - In AWS Console → RDS → Create Database
# - Engine: PostgreSQL 15
# - Instance: db.t3.micro (FREE tier eligible)
# - Database name: motel_db
# - Username: postgres
# - Password: strong_password
# - Storage: 20 GB (FREE tier)

# 8. Get RDS database endpoint & create tables
psql -h your-rds-endpoint.amazonaws.com -U postgres -d motel_db < database/init.sql

# 9. Deploy app to EC2 (similar to VPS instructions)
```

**AWS vs DigitalOcean Comparison:**

| Feature | DigitalOcean | AWS |
|---------|------------|-----|
| **Setup Time** | 20 minutes | 1-2 hours |
| **Learning Curve** | Easy | Steep |
| **Free Tier** | $200 credits only | $200 credits + 12-month free tier |
| **Monthly Cost** | $20-27 | $50-100+ |
| **Easy to Use** | ✅ Yes, beginner-friendly | ❌ Complex for beginners |
| **Scaling Support** | Good | ✅ Excellent |
| **Best For** | Small-medium business | Large/enterprise apps |

**Recommendation:** If you're new to deployment, **start with DigitalOcean**. You can migrate to AWS later if needed.

---

## 🔐 Security Checklist Before Going Live

- [ ] Change JWT_SECRET to random 32+ character string
- [ ] Set strong database password
- [ ] Enable HTTPS/SSL certificate (free with Let's Encrypt)
- [ ] Set NODE_ENV=production
- [ ] Hide .env file (not in git)
- [ ] Setup database backups daily
- [ ] Use strong login credentials in users table
- [ ] Enable firewall on VPS
- [ ] Only expose ports 80 (HTTP) and 443 (HTTPS)
- [ ] Setup monitoring/alerting
- [ ] Test CORS settings are correct
- [ ] Disable debug logging in production

---

## 📊 Comparison of Deployment Options

| Option | Cost | Database | Setup Time | Difficulty | Best For |
|--------|------|----------|-----------|-----------|----------|
| **Hostinger VPS** | **$6.50/mo** | Self-host | 1-2 hrs | ⭐⭐ Medium | **CHEAPEST** - Best value |
| **DigitalOcean App** | $20-27/mo | Included | 20 min | ⭐ Easy | **EASIEST** - Click & deploy |
| **Self-Hosted VPS** | $5-6/mo | Self-host | 2 hrs | ⭐⭐⭐ Hard | Full control, tight budget |
| **Heroku** | $7-25/mo | +$9+/mo | 15 min | ⭐⭐ Medium | Simple, quick deploys |
| **AWS** | $50+/mo | Included | 1-2 hrs | ⭐⭐⭐⭐ Hard | Large scale, free tier |

**🏆 Best Overall:** Hostinger VPS
- Cheapest price: $6.50/month
- Plenty of resources: 4 GB RAM, 50 GB storage
- Only 1-2 hours to set up
- Save $13/month vs DigitalOcean = $156/year savings!

**💡 Quick Decision Guide:**
- **Want easiest/fastest?** → DigitalOcean App Platform (20 min setup)
- **Want cheapest?** → **Hostinger VPS** (save $156/year!)
- **Want no server management?** → DigitalOcean App ($200 free credits)
- **Want full control?** → **Hostinger VPS** (root access)
- **Expected massive growth?** → AWS (scalability)

---

## 🚀 Quick Reference - Commands Cheat Sheet

```bash
# Development
npm start                    # Start both frontend & backend

# Database
psql -U postgres            # Connect to PostgreSQL
\dt                         # List all tables
SELECT * FROM users;        # Check users

# Monitoring
pm2 list                    # See running processes
pm2 logs                    # View logs
pm2 stop all                # Stop all processes
pm2 restart all             # Restart all processes

# Git (for deployment)
git add .                   # Stage changes
git commit -m "message"     # Commit changes
git push origin main        # Push to GitHub
git push heroku main        # Deploy to Heroku

# SSL Certificate
sudo certbot renew          # Auto-renew SSL (run monthly)
```

---

## 📞 Next Steps

1. **Today:** Finish testing the clean application (`npm start`)
2. **Tomorrow:** Set up PostgreSQL and connect database (Phase 2)
3. **Later This Week:** Deploy to your domain (Phase 3)

The entire process should take 2-4 hours total!

---

**Ready to go live?** 🚀
