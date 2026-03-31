#!/usr/bin/env python3
"""
AWS Infrastructure Automation Script for Motel Management System
Creates: EC2 t2.micro, RDS PostgreSQL, Security Groups, Elastic IP
Region: ap-south-1 (Mumbai, India)
"""

import boto3
import json
import time
from datetime import datetime

# AWS client initialization
ec2 = boto3.client('ec2', region_name='ap-south-1')
rds = boto3.client('rds', region_name='ap-south-1')

# Configuration
PROJECT_NAME = 'motel-management'
ENVIRONMENT = 'production'
INSTANCE_TYPE = 't2.micro'
DB_INSTANCE_CLASS = 'db.t3.micro'
DB_NAME = 'motel_db'
DB_USERNAME = 'motel_admin'
DB_PASSWORD = 'MotelApp2026!Secure'  # Change this to a strong password
REGION = 'ap-south-1'

print("=" * 80)
print("MOTEL MANAGEMENT SYSTEM - AWS INFRASTRUCTURE SETUP")
print("=" * 80)
print(f"\nStarting infrastructure setup at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Region: {REGION}")

# Step 1: Create VPC and Security Groups
print("\n[STEP 1] Creating Security Groups...")

try:
    # Get default VPC
    vpcs = ec2.describe_vpcs(Filters=[{'Name': 'isDefault', 'Values': ['true']}])
    vpc_id = vpcs['Vpcs'][0]['VpcId']
    print(f"✓ Using default VPC: {vpc_id}")
except Exception as e:
    print(f"✗ Error getting VPC: {e}")
    exit(1)

# Create EC2 Security Group
try:
    sg_ec2_response = ec2.create_security_group(
        GroupName=f'{PROJECT_NAME}-ec2-sg',
        Description='Security group for Motel Management EC2 instance',
        VpcId=vpc_id
    )
    sg_ec2_id = sg_ec2_response['GroupId']
    print(f"✓ Created EC2 Security Group: {sg_ec2_id}")
except ec2.exceptions.ClientError as e:
    if 'InvalidGroup.Duplicate' in str(e):
        print("⚠ EC2 Security Group already exists")
        sgs = ec2.describe_security_groups(
            Filters=[{'Name': 'group-name', 'Values': [f'{PROJECT_NAME}-ec2-sg']}]
        )
        sg_ec2_id = sgs['SecurityGroups'][0]['GroupId']
        print(f"✓ Using existing EC2 Security Group: {sg_ec2_id}")
    else:
        print(f"✗ Error creating EC2 Security Group: {e}")
        exit(1)

# Create RDS Security Group
try:
    sg_rds_response = ec2.create_security_group(
        GroupName=f'{PROJECT_NAME}-rds-sg',
        Description='Security group for Motel Management RDS database',
        VpcId=vpc_id
    )
    sg_rds_id = sg_rds_response['GroupId']
    print(f"✓ Created RDS Security Group: {sg_rds_id}")
except ec2.exceptions.ClientError as e:
    if 'InvalidGroup.Duplicate' in str(e):
        print("⚠ RDS Security Group already exists")
        sgs = ec2.describe_security_groups(
            Filters=[{'Name': 'group-name', 'Values': [f'{PROJECT_NAME}-rds-sg']}]
        )
        sg_rds_id = sgs['SecurityGroups'][0]['GroupId']
        print(f"✓ Using existing RDS Security Group: {sg_rds_id}")
    else:
        print(f"✗ Error creating RDS Security Group: {e}")
        exit(1)

# Configure EC2 Security Group Rules
print("\n[STEP 2] Configuring Security Group Rules...")

try:
    # SSH access (port 22)
    ec2.authorize_security_group_ingress(
        GroupId=sg_ec2_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 22,
                'ToPort': 22,
                'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'SSH access'}]
            },
            {
                'IpProtocol': 'tcp',
                'FromPort': 80,
                'ToPort': 80,
                'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'HTTP access'}]
            },
            {
                'IpProtocol': 'tcp',
                'FromPort': 443,
                'ToPort': 443,
                'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'HTTPS access'}]
            },
            {
                'IpProtocol': 'tcp',
                'FromPort': 5000,
                'ToPort': 5000,
                'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'Node.js app (development)'}]
            }
        ]
    )
    print("✓ Configured EC2 security group (SSH, HTTP, HTTPS, Node.js)")
except ec2.exceptions.ClientError as e:
    if 'InvalidPermission.Duplicate' in str(e):
        print("⚠ Security group rules already exist")
    else:
        print(f"! Error configuring EC2 rules: {e}")

try:
    # RDS PostgreSQL access (port 5432) from EC2 security group
    ec2.authorize_security_group_ingress(
        GroupId=sg_rds_id,
        IpPermissions=[
            {
                'IpProtocol': 'tcp',
                'FromPort': 5432,
                'ToPort': 5432,
                'UserIdGroupPairs': [{'GroupId': sg_ec2_id, 'Description': 'From EC2 instance'}]
            }
        ]
    )
    print("✓ Configured RDS security group (PostgreSQL from EC2)")
except ec2.exceptions.ClientError as e:
    if 'InvalidPermission.Duplicate' in str(e):
        print("⚠ RDS security group rules already exist")
    else:
        print(f"! Error configuring RDS rules: {e}")

# Step 3: Get Ubuntu 22.04 LTS AMI
print("\n[STEP 3] Finding Ubuntu 22.04 LTS AMI...")

try:
    images = ec2.describe_images(
        Filters=[
            {'Name': 'name', 'Values': ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*']},
            {'Name': 'state', 'Values': ['available']}
        ],
        Owners=['099720109477']  # Canonical
    )
    
    if not images['Images']:
        print("✗ Could not find Ubuntu 22.04 LTS AMI")
        exit(1)
    
    # Get the most recent AMI
    ami_id = sorted(images['Images'], key=lambda x: x['CreationDate'], reverse=True)[0]['ImageId']
    print(f"✓ Found Ubuntu 22.04 LTS AMI: {ami_id}")
except Exception as e:
    print(f"✗ Error finding AMI: {e}")
    exit(1)

# Step 4: Create EC2 Key Pair
print("\n[STEP 4] Creating EC2 Key Pair...")

key_pair_name = f'{PROJECT_NAME}-key'
try:
    key_response = ec2.create_key_pair(KeyName=key_pair_name)
    with open(f'{key_pair_name}.pem', 'w') as f:
        f.write(key_response['KeyMaterial'])
    print(f"✓ Created key pair: {key_pair_name}.pem (saved locally)")
except ec2.exceptions.ClientError as e:
    if 'InvalidKeyPair.Duplicate' in str(e):
        print(f"⚠ Key pair {key_pair_name} already exists (will reuse)")
    else:
        print(f"✗ Error creating key pair: {e}")
        exit(1)

# Step 5: Launch EC2 Instance
print("\n[STEP 5] Launching EC2 Instance...")

try:
    instances = ec2.run_instances(
        ImageId=ami_id,
        MinCount=1,
        MaxCount=1,
        InstanceType=INSTANCE_TYPE,
        KeyName=key_pair_name,
        SecurityGroupIds=[sg_ec2_id],
        TagSpecifications=[
            {
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': f'{PROJECT_NAME}-ec2'},
                    {'Key': 'Environment', 'Value': ENVIRONMENT},
                    {'Key': 'Project', 'Value': 'motel-management-system'}
                ]
            }
        ]
    )
    
    instance_id = instances['Instances'][0]['InstanceId']
    print(f"✓ EC2 Instance launched: {instance_id}")
    print(f"  Waiting for instance to start (this takes ~30 seconds)...")
    
    # Wait for instance to be running
    waiter = ec2.get_waiter('instance_running')
    waiter.wait(InstanceIds=[instance_id])
    print(f"✓ EC2 Instance is now running")
    
except Exception as e:
    print(f"✗ Error launching EC2 instance: {e}")
    exit(1)

# Get instance details
try:
    instances = ec2.describe_instances(InstanceIds=[instance_id])
    instance = instances['Reservations'][0]['Instances'][0]
    instance_public_ip = instance.get('PublicIpAddress', 'Pending...')
    print(f"  Public IP: {instance_public_ip}")
except Exception as e:
    print(f"! Error getting instance details: {e}")

# Step 6: Allocate Elastic IP
print("\n[STEP 6] Allocating Elastic IP...")

try:
    eip_response = ec2.allocate_address(Domain='vpc')
    allocation_id = eip_response['AllocationId']
    elastic_ip = eip_response['PublicIp']
    print(f"✓ Allocated Elastic IP: {elastic_ip}")
    
    # Associate with EC2 instance
    ec2.associate_address(
        InstanceId=instance_id,
        AllocationId=allocation_id
    )
    print(f"✓ Associated Elastic IP with EC2 instance")
    
except Exception as e:
    print(f"✗ Error allocating Elastic IP: {e}")
    exit(1)

# Step 7: Create RDS PostgreSQL Database
print("\n[STEP 7] Creating RDS PostgreSQL Database (this takes 5-10 minutes)...")

try:
    db_response = rds.create_db_instance(
        DBInstanceIdentifier=f'{PROJECT_NAME}-db',
        DBInstanceClass=DB_INSTANCE_CLASS,
        Engine='postgres',
        EngineVersion='14.7',
        MasterUsername=DB_USERNAME,
        MasterUserPassword=DB_PASSWORD,
        AllocatedStorage=20,
        StorageType='gp2',
        VpcSecurityGroupIds=[sg_rds_id],
        DBName=DB_NAME,
        Port=5432,
        PubliclyAccessible=False,
        BackupRetentionPeriod=7,
        PreferredBackupWindow='03:00-04:00',
        PreferredMaintenanceWindow='sun:04:00-sun:05:00',
        EnableCloudwatchLogsExports=['postgresql'],
        Tags=[
            {'Key': 'Name', 'Value': f'{PROJECT_NAME}-db'},
            {'Key': 'Environment', 'Value': ENVIRONMENT}
        ]
    )
    
    print(f"✓ RDS Instance created: {PROJECT_NAME}-db")
    print(f"  Database name: {DB_NAME}")
    print(f"  Username: {DB_USERNAME}")
    print(f"  RDS instances take 5-15 minutes to be available")
    
except rds.exceptions.DBInstanceAlreadyExistsFault:
    print(f"⚠ RDS instance {PROJECT_NAME}-db already exists")
except Exception as e:
    print(f"✗ Error creating RDS instance: {e}")
    exit(1)

# Step 8: Wait for RDS to be available and get endpoint
print("\n[STEP 8] Waiting for RDS Database to be available...")

max_wait_attempts = 60  # 5 minutes with 5-second intervals
attempt = 0

while attempt < max_wait_attempts:
    try:
        dbs = rds.describe_db_instances(DBInstanceIdentifier=f'{PROJECT_NAME}-db')
        db_instance = dbs['DBInstances'][0]
        status = db_instance['DBInstanceStatus']
        
        if status == 'available':
            db_endpoint = db_instance['Endpoint']['Address']
            db_port = db_instance['Endpoint']['Port']
            print(f"✓ RDS Database is now available")
            print(f"  Endpoint: {db_endpoint}")
            print(f"  Port: {db_port}")
            break
        else:
            print(f"  Status: {status}... ({attempt*5} seconds elapsed)")
            time.sleep(5)
            attempt += 1
    except Exception as e:
        print(f"! Error checking RDS status: {e}")
        time.sleep(5)
        attempt += 1

if attempt >= max_wait_attempts:
    print("⚠ RDS database is still creating. Check AWS console for status.")
    print("  You can proceed with SSH setup. The database will be ready when you need it.")

# Generate output file
print("\n" + "=" * 80)
print("INFRASTRUCTURE SETUP COMPLETE")
print("=" * 80)

output = {
    "timestamp": datetime.now().isoformat(),
    "region": REGION,
    "ec2": {
        "instance_id": instance_id,
        "instance_type": INSTANCE_TYPE,
        "ami_id": ami_id,
        "key_pair": key_pair_name,
        "security_group_id": sg_ec2_id,
        "elastic_ip": elastic_ip,
        "allocation_id": allocation_id
    },
    "rds": {
        "instance_id": f'{PROJECT_NAME}-db',
        "instance_class": DB_INSTANCE_CLASS,
        "database_name": DB_NAME,
        "master_username": DB_USERNAME,
        "master_password": DB_PASSWORD,
        "security_group_id": sg_rds_id,
        "port": 5432
    },
    "connection_details": {
        "ssh_command": f"ssh -i {key_pair_name}.pem ubuntu@{elastic_ip}",
        "database_url": f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@<db-endpoint>:5432/{DB_NAME}",
        "app_url": f"http://{elastic_ip}:5000"
    },
    "next_steps": [
        "1. Wait for RDS database to be AVAILABLE (check AWS console)",
        f"2. SSH into EC2: ssh -i {key_pair_name}.pem ubuntu@{elastic_ip}",
        "3. Clone the GitHub repository",
        "4. Install dependencies: npm run setup",
        "5. Create .env file with database credentials",
        "6. Initialize database tables",
        "7. Install PM2 and Nginx",
        "8. Build React frontend and configure Nginx",
        "9. Install SSL certificate (Let's Encrypt)",
        "10. Connect domain and verify"
    ]
}

# Save to file
output_file = 'aws-setup-output.json'
with open(output_file, 'w') as f:
    json.dump(output, f, indent=2)

print("\n✓ Setup output saved to: aws-setup-output.json")

# Display summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"\nEC2 INSTANCE:")
print(f"  Instance ID: {instance_id}")
print(f"  Instance Type: {INSTANCE_TYPE}")
print(f"  Elastic IP: {elastic_ip}")
print(f"  Security Group ID: {sg_ec2_id}")
print(f"  SSH Key: {key_pair_name}.pem")

print(f"\nRDS DATABASE:")
print(f"  Instance ID: {PROJECT_NAME}-db")
print(f"  Database Name: {DB_NAME}")
print(f"  Master Username: {DB_USERNAME}")
print(f"  Security Group ID: {sg_rds_id}")
print(f"  Status: Creating (5-15 minutes)")

print(f"\nNEXT STEPS:")
print(f"  1. Check RDS status in AWS console (should be 'Available' soon)")
print(f"  2. SSH into EC2:")
print(f"     ssh -i {key_pair_name}.pem ubuntu@{elastic_ip}")
print(f"  3. Follow AWS_SETUP.md steps 6-11 for application deployment")

print(f"\nDOCUMENTATION:")
print(f"  Full setup details: aws-setup-output.json")
print(f"  Deployment guide: AWS_SETUP.md")
print(f"  Connection string will be available once RDS is ready")

print("\n" + "=" * 80)
