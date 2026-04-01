#!/bin/bash

# Simple test script
echo "=========================================="
echo "APPLICATION DIAGNOSTICS"
echo "=========================================="
echo ""

echo "[TEST 1] Check if Node.js backend is running"
if pgrep -f "node.*server/index.js" > /dev/null; then
  echo "✅ Backend process found"
else
  echo "❌ Backend process NOT found"
  echo "Starting backend..."
  cd /home/ubuntu/motel-management-system
  pm2 start server/index.js --name backend --interpreter node
  sleep 2
fi

echo ""
echo "[TEST 2] Check if port 5000 is listening"
netstat -tlnp 2>/dev/null | grep 5000 || ss -tlnp 2>/dev/null | grep 5000 || echo "⚠️ Port 5000 not visible"

echo ""
echo "[TEST 3] Test login endpoint"
echo "Sending POST to http://localhost:5000/api/auth/login"
curl -v -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@motel.com","password":"password123"}' \
  2>&1

echo ""
echo ""
echo "[TEST 4] Check Nginx configuration"
sudo nginx -t 2>&1

echo ""
echo "[TEST 5] Check Nginx logs"
echo "Last 10 lines of error log:"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No error log"

echo ""
echo "[TEST 6] PM2 Status"
pm2 status

echo ""
echo "=========================================="
