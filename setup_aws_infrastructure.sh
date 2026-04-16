#!/bin/bash

# AWS Infrastructure Automation Script for Motel Management System
# Creates: EC2 t2.micro, RDS PostgreSQL, Security Groups, Elastic IP
# Region: ap-south-1 (Mumbai, India)

set -e  # Exit on error

# Configuration
PROJECT_NAME="motel-management"
ENVIRONMENT="production"
INSTANCE_TYPE="t2.micro"
DB_INSTANCE_CLASS="db.t3.micro"
DB_NAME="motel_db"
DB_USERNAME="motel_admin"
DB_PASSWORD="MotelApp2026!Secure"
REGION="ap-south-1"
PROFILE="motel-deploy"

echo "================================================================================"
echo "MOTEL MANAGEMENT SYSTEM - AWS INFRASTRUCTURE SETUP"
echo "================================================================================"
echo ""
echo "Starting infrastructure setup at $(date)"
echo "Region: $REGION"
echo "Profile: $PROFILE"

# Verify credentials
echo ""
echo "[STEP 0] Verifying AWS Credentials..."
if aws sts get-caller-identity --profile $PROFILE > /dev/null 2>&1; then
    echo "✓ AWS credentials verified"
else
    echo "✗ AWS credentials failed verification"
    exit 1
fi

# Step 1: Create Security Groups
echo ""
echo "[STEP 1] Creating Security Groups..."

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --region $REGION --profile $PROFILE --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
echo "✓ Using default VPC: $VPC_ID"

# Create EC2 Security Group
SG_EC2_ID=$(aws ec2 create-security-group \
    --group-name "${PROJECT_NAME}-ec2-sg" \
    --description "Security group for Motel Management EC2 instance" \
    --vpc-id $VPC_ID \
    --region $REGION \
    --profile $PROFILE \
    --query 'GroupId' \
    --output text 2>/dev/null || echo "EXISTING")

if [ "$SG_EC2_ID" = "EXISTING" ]; then
    SG_EC2_ID=$(aws ec2 describe-security-groups \
        --region $REGION \
        --profile $PROFILE \
        --filters "Name=group-name,Values=${PROJECT_NAME}-ec2-sg" \
        --query 'SecurityGroups[0].GroupId' \
        --output text)
    echo "⚠ EC2 Security Group already exists: $SG_EC2_ID"
else
    echo "✓ Created EC2 Security Group: $SG_EC2_ID"
fi

# Create RDS Security Group
SG_RDS_ID=$(aws ec2 create-security-group \
    --group-name "${PROJECT_NAME}-rds-sg" \
    --description "Security group for Motel Management RDS database" \
    --vpc-id $VPC_ID \
    --region $REGION \
    --profile $PROFILE \
    --query 'GroupId' \
    --output text 2>/dev/null || echo "EXISTING")

if [ "$SG_RDS_ID" = "EXISTING" ]; then
    SG_RDS_ID=$(aws ec2 describe-security-groups \
        --region $REGION \
        --profile $PROFILE \
        --filters "Name=group-name,Values=${PROJECT_NAME}-rds-sg" \
        --query 'SecurityGroups[0].GroupId' \
        --output text)
    echo "⚠ RDS Security Group already exists: $SG_RDS_ID"
else
    echo "✓ Created RDS Security Group: $SG_RDS_ID"
fi

# Step 2: Configure Security Group Rules
echo ""
echo "[STEP 2] Configuring Security Group Rules..."

# Add ingress rules to EC2 SG (SSH, HTTP, HTTPS, Node.js)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_EC2_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --profile $PROFILE 2>/dev/null || echo "⚠ SSH rule already exists"

aws ec2 authorize-security-group-ingress \
    --group-id $SG_EC2_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --profile $PROFILE 2>/dev/null || echo "⚠ HTTP rule already exists"

aws ec2 authorize-security-group-ingress \
    --group-id $SG_EC2_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --profile $PROFILE 2>/dev/null || echo "⚠ HTTPS rule already exists"

aws ec2 authorize-security-group-ingress \
    --group-id $SG_EC2_ID \
    --protocol tcp \
    --port 5000 \
    --cidr 0.0.0.0/0 \
    --region $REGION \
    --profile $PROFILE 2>/dev/null || echo "⚠ Node.js rule already exists"

echo "✓ Configured EC2 security group (SSH, HTTP, HTTPS, Node.js)"

# Add ingress rules to RDS SG (PostgreSQL from EC2)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_RDS_ID \
    --protocol tcp \
    --port 5432 \
    --source-group $SG_EC2_ID \
    --region $REGION \
    --profile $PROFILE 2>/dev/null || echo "⚠ PostgreSQL rule already exists"

echo "✓ Configured RDS security group (PostgreSQL from EC2)"

# Step 3: Get Ubuntu 22.04 LTS AMI
echo ""
echo "[STEP 3] Finding Ubuntu 22.04 LTS AMI..."

AMI_ID=$(aws ec2 describe-images \
    --region $REGION \
    --profile $PROFILE \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
    "Name=state,Values=available" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text)

echo "✓ Found Ubuntu 22.04 LTS AMI: $AMI_ID"

# Step 4: Create or get EC2 Key Pair
echo ""
echo "[STEP 4] Creating EC2 Key Pair..."

KEY_PAIR_NAME="${PROJECT_NAME}-key"

if aws ec2 describe-key-pairs --region $REGION --profile $PROFILE --key-names $KEY_PAIR_NAME > /dev/null 2>&1; then
    echo "⚠ Key pair $KEY_PAIR_NAME already exists (will reuse)"
else
    aws ec2 create-key-pair \
        --key-name $KEY_PAIR_NAME \
        --region $REGION \
        --profile $PROFILE \
        --query 'KeyMaterial' \
        --output text > "${KEY_PAIR_NAME}.pem"
    chmod 400 "${KEY_PAIR_NAME}.pem"
    echo "✓ Created key pair: ${KEY_PAIR_NAME}.pem (saved locally)"
fi

# Step 5: Launch EC2 Instance
echo ""
echo "[STEP 5] Launching EC2 Instance..."

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_PAIR_NAME \
    --security-group-ids $SG_EC2_ID \
    --region $REGION \
    --profile $PROFILE \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT_NAME}-ec2},{Key=Environment,Value=${ENVIRONMENT}},{Key=Project,Value=motel-management-system}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✓ EC2 Instance launched: $INSTANCE_ID"
echo "  Waiting for instance to start (this takes ~30 seconds)..."

# Wait for instance to be running
aws ec2 wait instance-running \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --profile $PROFILE

echo "✓ EC2 Instance is now running"

# Get Public IP (might be empty if not assigned yet)
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --profile $PROFILE \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "  Public IP (temporary): $PUBLIC_IP"

# Step 6: Allocate Elastic IP
echo ""
echo "[STEP 6] Allocating Elastic IP..."

EIP_RESPONSE=$(aws ec2 allocate-address \
    --domain vpc \
    --region $REGION \
    --profile $PROFILE \
    --query '[PublicIp,AllocationId]' \
    --output text)

ELASTIC_IP=$(echo $EIP_RESPONSE | awk '{print $1}')
ALLOCATION_ID=$(echo $EIP_RESPONSE | awk '{print $2}')

echo "✓ Allocated Elastic IP: $ELASTIC_IP"

# Associate Elastic IP with EC2 instance
aws ec2 associate-address \
    --instance-id $INSTANCE_ID \
    --allocation-id $ALLOCATION_ID \
    --region $REGION \
    --profile $PROFILE

echo "✓ Associated Elastic IP with EC2 instance"

# Step 7: Create RDS PostgreSQL Database
echo ""
echo "[STEP 7] Creating RDS PostgreSQL Database..."
echo "  This takes 5-15 minutes (you can proceed with SSH setup while waiting)"

aws rds create-db-instance \
    --db-instance-identifier "${PROJECT_NAME}-db" \
    --db-instance-class $DB_INSTANCE_CLASS \
    --engine postgres \
    --engine-version 14.7 \
    --master-username $DB_USERNAME \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids $SG_RDS_ID \
    --db-name $DB_NAME \
    --port 5432 \
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00" \
    --preferred-maintenance-window "sun:04:00-sun:05:00" \
    --enable-cloudwatch-logs-exports postgresql \
    --region $REGION \
    --profile $PROFILE \
    --tags "Key=Name,Value=${PROJECT_NAME}-db" "Key=Environment,Value=${ENVIRONMENT}" 2>/dev/null || echo "⚠ RDS instance may already exist"

echo "✓ RDS Database creation initiated"
echo "  Database name: $DB_NAME"
echo "  Username: $DB_USERNAME"

# Step 8: Wait briefly for RDS endpoint (it takes a while)
echo ""
echo "[STEP 8] Checking RDS Status..."

for i in {1..12}; do
    RDS_STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "${PROJECT_NAME}-db" \
        --region $REGION \
        --profile $PROFILE \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text 2>/dev/null || echo "creating")
    
    if [ "$RDS_STATUS" = "available" ]; then
        echo "✓ RDS Database is available!"
        break
    else
        echo "  Status: $RDS_STATUS (checking again in 10 seconds...)"
        sleep 10
    fi
done

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "${PROJECT_NAME}-db" \
    --region $REGION \
    --profile $PROFILE \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text 2>/dev/null || echo "pending")

RDS_PORT=$(aws rds describe-db-instances \
    --db-instance-identifier "${PROJECT_NAME}-db" \
    --region $REGION \
    --profile $PROFILE \
    --query 'DBInstances[0].Endpoint.Port' \
    --output text 2>/dev/null || echo "5432")

if [ "$RDS_ENDPOINT" != "None" ] && [ "$RDS_ENDPOINT" != "pending" ]; then
    echo "✓ RDS Endpoint: $RDS_ENDPOINT"
else
    echo "⚠ RDS endpoint not yet available (it's still creating)"
    echo "  You can check AWS console > RDS > Databases > motel-management-db"
fi

# Generate output
echo ""
echo "================================================================================"
echo "INFRASTRUCTURE SETUP COMPLETE"
echo "================================================================================"

# Create output file
cat > aws-setup-output.txt <<EOF
MOTEL MANAGEMENT SYSTEM - AWS INFRASTRUCTURE SETUP OUTPUT
Generated: $(date)
Region: $REGION

============================================================================
EC2 INSTANCE
============================================================================
Instance ID:        $INSTANCE_ID
Instance Type:      $INSTANCE_TYPE
AMI ID:             $AMI_ID
Key Pair:           $KEY_PAIR_NAME
Security Group:     $SG_EC2_ID
Elastic IP:         $ELASTIC_IP
Allocation ID:      $ALLOCATION_ID

SSH Command:
  ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${ELASTIC_IP}

============================================================================
RDS DATABASE
============================================================================
Instance ID:        ${PROJECT_NAME}-db
Database Name:      $DB_NAME
Master Username:    $DB_USERNAME
Master Password:    $DB_PASSWORD
Port:               $RDS_PORT
Endpoint:           $RDS_ENDPOINT
Security Group:     $SG_RDS_ID
Status:             Check AWS console for current status

Database Connection URL:
  postgresql://${DB_USERNAME}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}

Environment Variable for .env:
  DATABASE_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}

============================================================================
NEXT STEPS
============================================================================
1. Wait for RDS database to be AVAILABLE (check AWS console RDS dashboard)

2. SSH into EC2 instance:
   ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${ELASTIC_IP}

3. Clone the GitHub repository:
   git clone https://github.com/sidharthsv18/motel-management-system.git
   cd motel-management-system

4. Install dependencies:
   npm run setup

5. Create .env file with database credentials:
   cat > .env <<'ENVEOF'
   DATABASE_URL=postgresql://${DB_USERNAME}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}
   JWT_SECRET=your-random-secret-key-here
   NODE_ENV=production
   PORT=5000
   ENVEOF

6. Initialize database tables:
   psql -h ${RDS_ENDPOINT} -U ${DB_USERNAME} -d ${DB_NAME} -f database/init.sql

7. Install PM2 and Nginx on EC2:
   sudo apt update && sudo apt install -y nodejs npm postgresql-client nginx
   sudo npm install -g pm2

8. Build React frontend:
   npm --prefix client run build

9. Start application with PM2:
   pm2 start 'npm start' --name motel-app
   pm2 startup
   pm2 save

10. Configure Nginx as reverse proxy:
    sudo tee /etc/nginx/sites-available/motel << EOF
    server {
        listen 80;
        server_name _;
        
        location / {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_cache_bypass \$http_upgrade;
        }
    }
    EOF

11. Enable Nginx site and restart:
    sudo ln -s /etc/nginx/sites-available/motel /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx

12. Install SSL certificate (Let's Encrypt):
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d yourdomain.com

13. Connect domain:
    - Go to your domain registrar (GoDaddy, Namecheap, etc.)
    - Update A record to point to: $ELASTIC_IP
    - Wait 5-24 hours for DNS to propagate

14. Verify application:
    - Visit https://yourdomain.com
    - Login with: owner@elitegrand.com / Elitegrand#1818
    - Test all pages and features

============================================================================
IMPORTANT NOTES
============================================================================
- Key pair file: ${KEY_PAIR_NAME}.pem (keep this safe!)
- RDS might still be creating. Check AWS console > RDS for status.
- Once RDS is available and you SSH in, you can initialize the database.
- All credentials are displayed above. Save this file for reference.
- You will need to obtain a domain name and update DNS records.
- For HTTPS, you'll use Let's Encrypt (free) via Certbot.

============================================================================
AWS Free Tier Benefits
============================================================================
- EC2 t2.micro: 750 hours/month free (covers 31 days)
- RDS db.t3.micro: 750 hours/month free  (covers 31 days)
- 1 GB data transfer out per month free
- Duration: Until March 26, 2027 + $100 credits for 6 months
- Cost after credits: ~\$30-40/month

============================================================================
EOF

echo "✓ Output saved to: aws-setup-output.txt"
echo ""
echo "SUMMARY:"
echo "--------"
echo "EC2 Instance ID:     $INSTANCE_ID"
echo "Elastic IP:          $ELASTIC_IP"
echo "SSH Command:         ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${ELASTIC_IP}"
echo "RDS Instance:        ${PROJECT_NAME}-db"
echo "RDS Status:          Check AWS console (should be available soon)"
echo "Database Password:   *** (see aws-setup-output.txt ***)"
echo ""
echo "Full details saved to: aws-setup-output.txt"
echo "Follow the NEXT STEPS section above to deploy your application."
echo ""
echo "================================================================================"
