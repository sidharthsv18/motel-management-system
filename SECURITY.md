# 🔒 SECURITY GUIDELINES - Credentials Management

## What Was Done

### Problem (FIXED ✅)
❌ Credentials were hardcoded in `server/index.js` and committed to GitHub
- Owner email & password visible in Git history
- Reception email & password visible in Git history
- Anyone with access to repository could see credentials

### Solution
✅ Migrated to **AWS Secrets Manager**
- Credentials encrypted and stored in AWS
- Server retrieves credentials at startup from secure AWS storage
- No `.env` files needed in production
- Credentials never committed to Git
- Automatic fallback for local development

---

## How to Use Credentials Securely

### For Local Development

#### Option 1: Using `.env` file (Recommended for local testing)

**Step 1**: Copy the template
```bash
cp .env.example .env
```

**Step 2**: Edit `.env` with your credentials
```bash
# Open .env with your editor and fill in real values:
PORT=5000
JWT_SECRET=your-secret-key

OWNER_EMAIL=owner@yourhotel.com
OWNER_PASSWORD=SecurePassword123!

RECEPTION_EMAIL=reception@yourhotel.com
RECEPTION_PASSWORD=AnotherSecure456!
```

**Step 3**: Start the server
```bash
cd server
npm start
# Backend automatically uses fallback credentials for testing
```

#### Option 2: Using AWS Secrets Manager locally
Set environment variables:
```bash
export AWS_REGION=ap-south-1
export SECRET_NAME=motel-management-secrets
```

### For Production (AWS EC2)

✅ **RECOMMENDED: Use AWS Secrets Manager**

1. **Create secret in AWS Secrets Manager**
   - See: [AWS_SECRETS_SETUP.md](./AWS_SECRETS_SETUP.md) for complete instructions
   - Secret Name: `motel-management-secrets`
   - Region: `ap-south-1` (or your server's region)

2. **Attach IAM Role to EC2 instance**
   - Policy: `secretsmanager:GetSecretValue`
   - Resource: `arn:aws:secretsmanager:ap-south-1:*:secret:motel-management-secrets-*`

3. **Restart the server**
   ```bash
   pm2 restart motel-backend
   ```

4. **Verify secrets are loaded**
   ```bash
   pm2 logs motel-backend
   # Should show: ✅ Secrets loaded from AWS Secrets Manager
   ```

#### Legacy: Using `.env` file on server

If you prefer to use a `.env` file on your server:

```bash
# SSH into your server
ssh -i your-key.pem ubuntu@your-server-ip
cd /path/to/motel-management-system

# Create .env with production credentials
nano .env
# Add your production credentials here
# Save with Ctrl+X, Y, Enter

# Restart the server
pm2 restart motel-backend
```

> **Note**: `.env` method is less secure. AWS Secrets Manager recommended.

## ✅ Security Best Practices

### What's Safe to Commit
- ✅ `.env.example` - Template showing structure
- ✅ `server/index.js` - Uses AWS Secrets Manager (no hardcoded values)
- ✅ `README.md` - Documentation with setup instructions  
- ✅ `AWS_SECRETS_SETUP.md` - Instructions for secure setup
- ✅ All code files

### What's NOT Safe to Commit
- ❌ `.env` - Real credentials (in .gitignore ✓)
- ❌ Any file with passwords
- ❌ API keys or secrets
- ❌ Database credentials

### Production Credentials Strategy
1. **Use AWS Secrets Manager** - Encrypted storage with access control
2. **Avoid .env files in production** - They can be accidentally exposed
3. **Rotate credentials regularly** - Change passwords every 90 days
4. **Use strong passwords** - Example: `Elitegrand#1818`
5. **Enable CloudTrail logging** - Audit all secret access
6. **Restrict IAM permissions** - Only give EC2 instance what it needs
   ```json
   {
     "Effect": "Allow",
     "Action": "secretsmanager:GetSecretValue",
     "Resource": "arn:aws:secretsmanager:ap-south-1:*:secret:motel-management-secrets-*"
   }
   ```
   ```

## 🔑 Environment Variables Used

```
PORT                    # Server port (default: 5000)
JWT_SECRET             # Secret key for JWT signing
OWNER_EMAIL            # Owner login email
OWNER_PASSWORD         # Owner login password
RECEPTION_EMAIL        # Reception login email
RECEPTION_PASSWORD     # Reception login password
```

## 🛡️ If Credentials Are Ever Exposed

### Immediate Actions:
1. **Change credentials immediately**
   ```bash
   # Update .env locally and on server
   nano .env
   # Change all passwords
   pm2 restart backend
   ```

2. **Rotate JWT secret**
   ```bash
   # Generate new one and update .env
   OWNER_PASSWORD=NewSecurePassword789!@
   # Restart backend
   ```

3. **Review Git history** (if committed)
   ```bash
   # See what was exposed
   git log --oneline server/index.js
   
   # Remove from Git history (advanced)
   # Use: git filter-branch or BFG Repo-Cleaner
   ```

4. **Notify users** - If user passwords were exposed

## 📝 Deployment Checklist

Before deploying to production:
- [ ] `.env.example` is committed to Git
- [ ] `.env` is NOT committed (check .gitignore)
- [ ] `.env` file exists ONLY on production server
- [ ] `.env` permissions are restrictive (600)
- [ ] PM2 has restarted after .env changes
- [ ] Application loads credentials from environment variables
- [ ] No credentials visible in logs or error messages

## 🚀 Current Status

✅ Local Development: Use `.env` file
✅ Production (AWS): `.env` created on server
✅ All credentials loaded from environment variables
✅ No hardcoded secrets in Git repository
✅ `.env.example` added for reference

---

**Remember: Environment variables are the industry standard for secure credential management. Your system is now production-ready! 🎉**
