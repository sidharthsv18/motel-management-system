# Motel Management System - Complete Setup & Deployment Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Development Setup](#development-setup)
3. [Database Setup](#database-setup)
4. [Deployment Guide](#deployment-guide)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)

### Start the Application

```bash
# Clone/navigate to project
cd motel-management-system

# Install all dependencies (one time only)
npm run setup

# Start both frontend and backend
npm start
```

✅ **That's it!** The app will open on:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

**Test Credentials:**
```
Email: owner@motel.com
Password: password123
```

---

## 🛠️ Development Setup (Detailed)

### Step 1: Install Dependencies

```bash
# From project root
npm run setup

# OR manually:
npm install                    # Root dependencies
npm --prefix server install    # Backend dependencies
npm --prefix client install    # Frontend dependencies
```

### Step 2: Configure Environment Variables

#### Backend (.env in root)
```
DATABASE_URL=postgresql://username:password@localhost:5432/motel_db
JWT_SECRET=your_super_secret_jwt_key_12345
PORT=5000
NODE_ENV=development
```

#### Client (.env in client/ - optional)
```
VITE_API_URL=http://localhost:5000
```

### Step 3: Start Development Servers

**Option A: Start Both Together**
```bash
npm start
```

**Option B: Start Separately**
```bash
# Terminal 1 - Backend
npm run start:server

# Terminal 2 - Frontend
npm run start:client
```

### Step 4: Open in Browser
- Go to http://localhost:5173
- Login with test credentials (see Quick Start above)

---

## 🗄️ Database Setup

### With PostgreSQL Installed Locally

```bash
# 1. Create database
createdb motel_db

# 2. Run initialization script
psql motel_db < database/init.sql

# 3. Update .env with credentials
# DATABASE_URL=postgresql://your_username:your_password@localhost:5432/motel_db
```

### With Docker (Recommended)

```bash
# Create and start PostgreSQL container
docker run --name motel-db \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=motel_db \
  -p 5432:5432 \
  -d postgres:15

# Initialize tables
psql -h localhost -U postgres -d motel_db -f database/init.sql

# Update .env
# DATABASE_URL=postgresql://postgres:password123@localhost:5432/motel_db
```

### Current Status: Mock Data Mode
The app currently uses **in-memory mock data** (no database required).

To switch to database:
1. Set up PostgreSQL as above
2. Restart the server
3. The code will automatically query the database instead of using mock data

---

## 🌐 Deployment Guide (4 Steps)

### Phase 1: Prepare for Production

```bash
# Build frontend for production
npm --prefix client run build

# This creates client/dist/ folder with optimized files
```

### Phase 2: Choose Hosting Option

#### Option A: DigitalOcean App Platform (Easiest)
1. Push code to GitHub
2. Go to https://www.digitalocean.com/products/app-platform
3. Connect your GitHub repository
4. Select Node.js for backend, Static Site for frontend
5. Set environment variables in dashboard
6. Deploy

#### Option B: Heroku
```bash
# Install Heroku CLI
heroku login
heroku create your-motel-app
git push heroku main
```

#### Option C: AWS (EC2 + RDS)
1. Create EC2 instance (Ubuntu 20.04)
2. SSH into instance and install Node.js
3. Clone repository
4. Set up RDS PostgreSQL database
5. Update .env file
6. Start server with PM2 (process manager)

#### Option D: Self-Hosted VPS
1. Rent a VPS ($5-10/month from Linode, DigitalOcean, Vultr)
2. SSH into server
3. Install Node.js and PostgreSQL
4. Clone repo
5. Use Nginx as reverse proxy
6. Use SSL certificate (Let's Encrypt)

### Phase 3: Connect Your Domain

#### Update DNS Records
```
A Record: your-domain.com → your-server-ip
CNAME: www.your-domain.com → your-domain.com
```

#### Set Up SSL/HTTPS (Important!)
```bash
# With Certbot (Let's Encrypt - FREE)
sudo certbot certonly --standalone -d your-domain.com
```

### Phase 4: Deploy Backend & Frontend

```bash
# On your server:

# 1. Clone repository
git clone your-repo-url
cd motel-management-system

# 2. Install dependencies
npm run setup

# 3. Create .env with production values
DATABASE_URL=your-production-db-url
JWT_SECRET=your-production-secret

# 4. Install PM2 (keeps app running)
npm install -g pm2

# 5. Start backend with PM2
pm2 start server/index.js --name motel-api

# 6. Serve frontend
npm --prefix client run build
pm2 serve client/dist 5000 --spa

# 7. Save PM2 startup
pm2 startup
pm2 save
```

---

## 🔧 Troubleshooting

### Problem: "Port 5000 already in use"
```bash
# Kill process using port 5000
npx kill-port 5000

# Or manually
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Problem: "Cannot connect to database"
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run: `psql $DATABASE_URL`

### Problem: "CORS errors"
- Backend must have `cors()` middleware (it does)
- Frontend must call correct API URL
- Check VITE_API_URL environment variable

### Problem: "Login not working"
- Clear browser cache and localStorage
- Check browser console for errors (F12)
- Verify backend is running (http://localhost:5000)

### Problem: "Running slow in production"
- Build React for production: `npm --prefix client run build`
- Use database queries instead of loading all data
- Add caching headers
- Use CDN for static assets

---

## 📁 Project Structure

```
motel-management-system/
├── server/                    # Backend (Node.js/Express)
│   ├── index.js               # Main server file (all routes)
│   ├── package.json           # Server dependencies
│   └── middleware/            # Auth & other middleware
├── client/                    # Frontend (React/Vite)
│   ├── src/
│   │   ├── pages/             # Login, Dashboard, etc.
│   │   ├── components/        # Sidebar, Cards, etc.
│   │   ├── App.jsx            # Main routing
│   │   └── index.css          # Global styles
│   └── package.json           # Frontend dependencies
├── database/
│   └── init.sql               # Database schema
├── .env                       # Environment variables
├── package.json               # Root scripts
└── README.md                  # This file
```

---

## 🔐 Security Checklist Before Deploying

- [ ] Change JWT_SECRET to a long random string
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL certificate
- [ ] Set NODE_ENV=production
- [ ] Use environment variables for all secrets
- [ ] Enable CORS only for your domain
- [ ] Set up database backups
- [ ] Use strong login credentials in database
- [ ] Enable API rate limiting
- [ ] Monitor logs for suspicious activity

---

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Check browser console (F12) for errors
3. Check server terminal for error messages
4. Search error message on Google/Stack Overflow

---

**Last Updated:** March 25, 2026
