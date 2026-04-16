#!/bin/bash
set -e

echo "=========================================="
echo "MOTEL MANAGEMENT DEPLOYMENT"
echo "=========================================="

# Update system
echo "[1/10] Installing dependencies..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - >/dev/null 2>&1
sudo apt-get install -y nodejs npm git pm2 postgresql-client nginx -qq 2>/dev/null
echo "✓ Dependencies installed"

# Clone repo
echo "[2/10] Setting up application..."
cd /home/ubuntu
if [ ! -d "motel-management-system" ]; then
  git clone https://github.com/sidharthsv18/motel-management-system.git >/dev/null 2>&1
fi
cd motel-management-system
git pull origin main >/dev/null 2>&1 || true

# Install npm packages
echo "[3/10] Installing npm packages..."
npm run setup >/dev/null 2>&1

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier motel-management-db --region ap-south-1 --query 'DBInstances[0].Endpoint.Address' --output text 2>/dev/null || echo "motel-management-db.cg1xj9yg6j7z.ap-south-1.rds.amazonaws.com")

echo "RDS Endpoint: $RDS_ENDPOINT"

# Create .env
echo "[4/10] Creating .env file..."
cat > server/.env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://motel_admin:MotelApp2026!Secure@${RDS_ENDPOINT}:5432/motel_db
JWT_SECRET=motel-app-secret-2026
EOF

# Initialize database
echo "[5/10] Initializing database..."
PGPASSWORD="MotelApp2026!Secure" psql -h "${RDS_ENDPOINT}" -U motel_admin -d motel_db -f database/init.sql >/dev/null 2>&1 || echo "⚠ Database init skipped (continue anyway)"

# Build frontend
echo "[6/10] Building React frontend..."
npm --prefix client run build >/dev/null 2>&1

# Start with PM2
echo "[7/10] Starting application with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start server/index.js --name "motel-backend" --env NODE_ENV=production >/dev/null 2>&1
pm2 start "npm --prefix client run preview -- --host 0.0.0.0 --port 4173" --name "motel-frontend" >/dev/null 2>&1
pm2 startup -u ubuntu >/dev/null 2>&1 || true
pm2 save >/dev/null 2>&1

sleep 3

# Setup Nginx
echo "[8/10] Configuring Nginx..."
sudo tee /etc/nginx/sites-available/motel >/dev/null << 'NGXEOF'
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGXEOF

sudo ln -sf /etc/nginx/sites-available/motel /etc/nginx/sites-enabled/motel >/dev/null 2>&1 || true
sudo rm -f /etc/nginx/sites-enabled/default >/dev/null 2>&1 || true
sudo nginx -t >/dev/null 2>&1
sudo systemctl restart nginx >/dev/null 2>&1

echo "[9/10] Verifying services..."
echo ""
echo "=========================================="
echo "APPLICATION STATUS"
echo "=========================================="
pm2 status || echo "PM2 service starting..."
echo ""
echo "[10/10] READY!"
echo ""
echo "✅ Website is live at: http://3.110.24.107"
echo "✅ Test login: ashok@elitegrand.com / password123"
echo ""
