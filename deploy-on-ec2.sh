#!/bin/bash
# AWS Infrastructure - Post-Setup Deployment Script
# Execute this script on the EC2 instance to complete deployment

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Motel Management System${NC}"
echo -e "${YELLOW}AWS Deployment Script${NC}"
echo -e "${YELLOW}================================${NC}\n"

# Step 1: Verify RDS is ready
echo -e "${YELLOW}Step 1: Checking RDS Database Status...${NC}"
echo "Run this command to check RDS status:"
echo "aws rds describe-db-instances --db-instance-identifier motel-management-db --region ap-south-1 --profile motel-deploy --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}'"
echo ""
echo -e "${YELLOW}Expected: Status should be 'available' and Endpoint should show a value${NC}"
echo -e "${YELLOW}If RDS is still 'creating', wait 5-10 more minutes and try again${NC}\n"

# Step 2: System update
echo -e "${YELLOW}Step 2: Updating Ubuntu System ${NC}"
sudo apt update
sudo apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}\n"

# Step 3: Install Node.js
echo -e "${YELLOW}Step 3: Installing Node.js 18.x${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm git curl wget
node --version
npm --version
echo -e "${GREEN}✓ Node.js installed${NC}\n"

# Step 4: Install PM2
echo -e "${YELLOW}Step 4: Installing PM2 (Process Manager)${NC}"
sudo npm install -g pm2
pm2 --version
echo -e "${GREEN}✓ PM2 installed${NC}\n"

# Step 5: Clone repository
echo -e "${YELLOW}Step 5: Cloning Application Repository${NC}"
cd /home/ubuntu
git clone https://github.com/sidharthsv18/motel-management-system.git
cd motel-management-system
echo -e "${GREEN}✓ Repository cloned${NC}\n"

# Step 6: Install dependencies
echo -e "${YELLOW}Step 6: Installing Node.js Dependencies${NC}"
npm run setup
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 7: Configure environment
echo -e "${YELLOW}Step 7: Configuring Environment Variables${NC}"
echo "=== IMPORTANT ==="
echo "Before proceeding, you need the RDS endpoint!"
echo ""
echo "Get your RDS endpoint by running this on your LOCAL machine:"
echo "aws rds describe-db-instances --db-instance-identifier motel-management-db --region ap-south-1 --profile motel-deploy --query 'DBInstances[0].Endpoint.Address' --output text"
echo ""
echo "Then create .env file with:"
echo "================================"
cat > /tmp/.env.template << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=5000
BACKEND_URL=http://localhost:5000

# Database Configuration (RDS)
DB_HOST={RDS_ENDPOINT}
DB_PORT=5432
DB_NAME=motel_db
DB_USER=motel_admin
DB_PASSWORD=MotelApp2026!Secure

# Frontend URL (update with your domain)
FRONTEND_URL=http://3.110.24.107:3000
EOF

cat /tmp/.env.template
echo "================================"
echo ""
echo -e "${YELLOW}Copy the template above and replace {RDS_ENDPOINT} with actual endpoint${NC}"
echo "Then save as: /home/ubuntu/motel-management-system/.env"
echo ""
echo -e "${YELLOW}Run this to create .env file (replace ENDPOINT):${NC}"
echo "echo 'DB_HOST={ACTUAL_RDS_ENDPOINT}' > server/.env"
echo "echo 'DB_PORT=5432' >> server/.env"
echo "echo 'DB_NAME=motel_db' >> server/.env"
echo "echo 'DB_USER=motel_admin' >> server/.env"
echo "echo 'DB_PASSWORD=MotelApp2026!Secure' >> server/.env"
echo ""

# Step 8: Initialize database
echo -e "${YELLOW}Step 8: Database Initialization${NC}"
echo ""
echo "Once RDS is ready and .env is configured, run:"
echo ""
echo "psql -h {RDS_ENDPOINT} -U motel_admin -d motel_db -f database/init.sql"
echo ""
echo "Or if using the server's node-postgres driver:"
echo "node database/init-db.js"
echo ""

# Step 9: Start application
echo -e "${YELLOW}Step 9: Starting Application${NC}"
echo ""
echo "Start backend:"
echo "cd /home/ubuntu/motel-management-system/server"
echo "npm start"
echo ""
echo "In another terminal, start frontend (if needed):"
echo "cd /home/ubuntu/motel-management-system/client"
echo "npm run dev -- --port 3000 --host 0.0.0.0"
echo ""
echo "Or use PM2 to manage both:"
echo "pm2 start npm --name 'motel-backend' -- --prefix server start"
echo "pm2 start npm --name 'motel-frontend' -- --prefix client run dev -- --port 3000 --host 0.0.0.0"
echo "pm2 save"
echo "pm2 startup"
echo ""

# Step 10: Test application
echo -e "${YELLOW}Step 10: Testing Application${NC}"
echo ""
echo "Backend should be accessible at: http://3.110.24.107:5000"
echo "Frontend should be accessible at: http://3.110.24.107:3000"
echo ""
echo "Test with curl:"
echo "curl http://localhost:5000/api/rooms"
echo ""

# Completion
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Bootstrap Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Obtain RDS endpoint from AWS console"
echo "2. Configure .env file with RDS endpoint"
echo "3. Run database initialization script"
echo "4. Start backend application"
echo "5. Test the application"
echo ""
echo "For more details, see: aws-infrastructure-complete.txt"
