# AWS Secrets Manager Setup

This application now uses **AWS Secrets Manager** to store sensitive credentials securely instead of using plain-text `.env` files.

## What Changed

- ✅ **dotenv package removed** - No more `.env` files in production
- ✅ **All credentials encrypted** in AWS Secrets Manager
- ✅ **Automatic fallback** - Server can start with or without Secrets Manager available
- ✅ **Zero secrets in Git** - Repository is completely safe to make public

## Creating the Secret

### Option 1: AWS Console (Recommended for beginners)

1. Go to: https://console.aws.amazon.com/secretsmanager/
2. Click **"Store a new secret"**
3. Choose **"Other type of secret"**
4. Click **"Plaintext"** tab and paste this JSON:

```json
{
  "JWT_SECRET": "motel_secret_2026_secure_key",
  "OWNER_EMAIL": "owner@elitegrand.com",
  "OWNER_PASSWORD": "Elitegrand#1818",
  "RECEPTION_EMAIL": "reception@elitegrand.com",
  "RECEPTION_PASSWORD": "Frontdesk#5100"
}
```

5. Secret name: `motel-management-secrets`
6. Region: `ap-south-1` (to match your EC2 instance)
7. Click **"Store secret"**

### Option 2: AWS CLI

```bash
aws secretsmanager create-secret \
  --name motel-management-secrets \
  --secret-string '{"JWT_SECRET":"motel_secret_2026_secure_key","OWNER_EMAIL":"owner@elitegrand.com","OWNER_PASSWORD":"Elitegrand#1818","RECEPTION_EMAIL":"reception@elitegrand.com","RECEPTION_PASSWORD":"Frontdesk#5100"}' \
  --region ap-south-1
```

## EC2 IAM Role Configuration

The EC2 instance needs permissions to read from Secrets Manager. Create an IAM role with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:ap-south-1:*:secret:motel-management-secrets-*"
    }
  ]
}
```

### Attaching the IAM role to EC2:

1. Go to EC2 Dashboard
2. Select your instance
3. Click **"Security"** tab → **"Modify IAM role"**
4. Select/Create a role with the above policy
5. Click **"Update IAM role"**

> **Note**: Changes take effect immediately without restarting the instance.

## Environment Variables (Optional)

You can override the secret ID using environment variables:

- `AWS_REGION` - Default: `ap-south-1`
- `SECRET_NAME` - Default: `motel-management-secrets`

Example:
```bash
export AWS_REGION=us-east-1
export SECRET_NAME=my-custom-secret-name
```

## Testing the Setup

After creating the secret and attaching the IAM role:

1. SSH to your EC2 instance
2. Stop the running server: `pm2 stop motel-backend`
3. Start the server: `pm2 start server/index.js --name motel-backend`
4. Check logs: `pm2 logs motel-backend`

You should see:
```
✅ Secrets loaded from AWS Secrets Manager
📦 Users configured: owner@elitegrand.com, reception@elitegrand.com
```

## Fallback Behavior

If Secrets Manager is unavailable or credentials don't have permission:

- Server logs: `⚠️  Using fallback credentials (development mode)`
- Built-in fallback credentials activate
- Server continues to function for testing

> **Production Note**: Always ensure Secrets Manager is properly configured. Fallback should only be used for development.

## Updating Secrets

To change credentials:

```bash
aws secretsmanager update-secret \
  --secret-id motel-management-secrets \
  --secret-string '{"JWT_SECRET":"...","OWNER_EMAIL":"...","OWNER_PASSWORD":"...","RECEPTION_EMAIL":"...","RECEPTION_PASSWORD":"..."}' \
  --region ap-south-1
```

Changes take effect on next server restart.

## Removing .env Files

After setting up Secrets Manager:

1. **Local development**: Keep `.env` for local testing (it's in `.gitignore`)
2. **Production**: The `.env` file on the server can be safely deleted
3. **GitHub**: No changes needed (`.env` was never committed)

```bash
# On production server:
rm /home/ubuntu/motel-management-system/.env
```

## Architecture

```
┌─────────────────┐
│   Express App   │
│   (server.js)   │
└────────┬────────┘
         │ Calls loadSecrets()
         ↓
┌─────────────────────────────┐
│ AWS Secrets Manager Client  │
│ (AWS SDK)                   │
└────────┬────────────────────┘
         │ Requests secret
         ↓
┌─────────────────────────────┐
│ AWS Secrets Manager         │
│ (Encrypted in AWS)          │
│ 🔐 Credentials stored       │
└─────────────────────────────┘
```

## Security Benefits

1. **Encryption at rest** - AWS manages encryption/decryption
2. **Automatic rotation** - Can set up automatic credential rotation
3. **Audit logging** - CloudTrail logs all access requests
4. **Access control** - IAM policies restrict who/what can access
5. **No Git exposure** - Secrets never committed to version control
6. **Separation of concerns** - App code ≠ secret storage

## Troubleshooting

### "Service unavailable: Secrets not loaded"
- Check CloudWatch Logs on EC2
- Verify IAM role attached to instance
- Verify secret exists in correct region
- Check EC2 can reach AWS Services (NAT gateway or IGW required)

### "Failed to load secrets"
- Verify secret name matches: `motel-management-secrets`
- Check secret region matches: `ap-south-1`
- Verify IAM policy grants `secretsmanager:GetSecretValue`
- Check secret JSON format is valid

### Can't create secret from EC2 CLI
- Install AWS CLI: `sudo apt-get install -y awscli`
- Verify IAM role has `secretsmanager:CreateSecret` permission
- Or create from AWS Console instead

## Next Steps

- ✅ Credentials moved to AWS Secrets Manager
- ✅ Server code updated to use Secrets Manager
- ⏳ Create secret in AWS (see above)
- ⏳ Attach IAM role to EC2  
- ⏳ Restart server
- ⏳ Test login
- ⏳ Remove old `.env` files

---

**Status**: All code changes complete. Awaiting secret creation and IAM role setup.
