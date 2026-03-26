# ⚡ HOSTINGER VPS - QUICK REFERENCE CARD

**Print or bookmark this!**

---

## After You Buy Hostinger VPS:

### 1️⃣ YOU RECEIVE (via email):
```
VPS IP: ___________________
Root Password: ___________________
SSH Port: 22
```

### 2️⃣ SSH LOGIN (PowerShell on Windows):
```
ssh root@YOUR_IP
# Paste password when asked
```

### 3️⃣ RUN THESE COMMANDS IN ORDER:

```bash
# Update system
apt update && apt upgrade -y
apt install -y curl wget git nano

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql

# Create deploy user (safer than root)
adduser deploy
usermod -aG sudo deploy
su - deploy

# Clone your code
cd ~
git clone https://github.com/YOUR_USERNAME/motel-management-system.git
cd motel-management-system

# Install dependencies
npm run setup

# Build frontend
npm --prefix client run build

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://motel_user:STRONG_PASSWORD@localhost:5432/motel_db
JWT_SECRET=xkL9j@kL2p9mN5qR7sT1vW3xY5z7A9bC1dE3fG5hI7jK
NODE_ENV=production
PORT=5000
EOF

# Setup database
sudo -u postgres psql << 'SQL'
CREATE DATABASE motel_db;
CREATE USER motel_user WITH PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE motel_db TO motel_user;
\q
SQL

# Initialize tables
psql -U motel_user -h localhost -d motel_db < database/init.sql

# Install PM2
sudo npm install -g pm2
pm2 start server/index.js --name motel-api
pm2 serve client/dist 3000 --spa --name motel-web
pm2 startup
pm2 save

# Install & configure Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/motel
# (Paste config from HOSTINGER_NEXT_STEPS.md Step 12)

sudo ln -s /etc/nginx/sites-available/motel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourmotel.com -d www.yourmotel.com

# Done! Your app is live on https://yourmotel.com 🎉
```

---

## IMPORTANT PASSWORDS TO CHANGE:

Replace these in commands above:
- `STRONG_PASSWORD` → Your database password (12+ characters)
- `JWT_SECRET` → Run: `openssl rand -base64 32`
- `YOUR_USERNAME` → Your GitHub username

---

## VERIFY EVERYTHING WORKS:

```bash
# Check services running
pm2 list
# Should show: motel-api (online), motel-web (online)

# Test backend
curl http://localhost:5000
# Should show: {"message":"Motel Management API Running ✅"}

# Access your site
# Open browser: https://yourmotel.com
# Login: owner@motel.com / password123
```

---

## AFTER DNS UPDATES (24 hours):

1. Update domain DNS to point to VPS IP
2. Wait for DNS propagation
3. Visit https://yourmotel.com

---

## EMERGENCY COMMANDS:

```bash
# Restart backend
pm2 restart motel-api

# View logs
pm2 logs motel-api

# SSH into server
ssh deploy@YOUR_VPS_IP

# Reboot server
sudo reboot
```

---

## COSTS:
- Hostinger VPS: **$6.50/month**
- Domain name: **$10-15/year** (your existing domain)
- **TOTAL: $6.50/month = $78/year** 💰

---

## 📚 FULL GUIDE:
See: `HOSTINGER_NEXT_STEPS.md` in project folder

---

**Any questions?** Check troubleshooting section in HOSTINGER_NEXT_STEPS.md
