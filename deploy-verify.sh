#!/bin/bash

# SIMPLE DEPLOYMENT VERIFICATION & RESTART SCRIPT

echo "=========================================="
echo "Motel Management System - Deploy Check"
echo "=========================================="
echo ""

# Stop existing processes
echo "[1] Cleaning up old processes..."
pm2 delete all 2>/dev/null || true
sleep 2

# Ensure we're in the right directory
cd /home/ubuntu/motel-management-system || exit 1

# Pull latest code
echo "[2] Pulling latest code..."
git pull origin main

# Install dependencies if needed
echo "[3] Installing dependencies..."
npm run setup > /dev/null 2>&1 || npm install

# Build frontend
echo "[4] Building React frontend..."
npm --prefix client run build > /dev/null 2>&1

# Start backend
echo "[5] Starting Node.js backend..."
pm2 start server/index.js --name backend --interpreter node > /dev/null 2>&1

# Start frontend
echo "[6] Starting React frontend..."
pm2 start "npm --prefix client run preview -- --port 4173 --host 0.0.0.0" --name frontend > /dev/null 2>&1

# Enable auto-startup
pm2 startup > /dev/null 2>&1 || true
pm2 save > /dev/null 2>&1 || true

# Wait for services to start
sleep 3

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT STATUS"
echo "=========================================="
pm2 status

echo ""
echo "=========================================="
echo "🌐 ACCESS YOUR APPLICATION"
echo "=========================================="
echo ""
echo "Website: http://3.110.24.107"
echo ""
echo "Credentials:"
echo "  Owner: owner@elitegrand.com / Elitegrand#1818"
echo "  Receptionist: reception@elitegrand.com / Frontdesk#5100"
echo ""
echo "=========================================="

# Test backend
echo ""
echo "Testing backend API..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@elitegrand.com","password":"Elitegrand#1818"}')

if echo "$RESPONSE" | grep -q "token"; then
  echo "✅ Backend login endpoint is working!"
  echo "Response: $RESPONSE"
else
  echo "⚠ Backend response: $RESPONSE"
fi

echo ""
echo "=========================================="
