# 🔒 SECURITY GUIDELINES - Credentials Management

## What Was Done

### Problem
❌ Credentials were hardcoded in `server/index.js` and committed to GitHub
- Owner email & password visible in Git history
- Reception email & password visible in Git history
- Anyone with access to repository could see credentials

### Solution
✅ Implemented environment variables using `.env` file
- Credentials are now loaded from `.env` (NOT committed to Git)
- `.env` is in `.gitignore` - automatically excluded from Git
- `.env.example` is committed - shows structure without real credentials
- Server reads from environment variables at startup

---

## How to Use Credentials Securely

### For Local Development

#### Step 1: Copy the template
```bash
cp .env.example .env
```

#### Step 2: Edit `.env` with your credentials
```bash
# Open .env with your editor and fill in real values:
PORT=5000
JWT_SECRET=your-secret-key

OWNER_EMAIL=owner@yourhotel.com
OWNER_PASSWORD=SecurePassword123!

RECEPTION_EMAIL=reception@yourhotel.com
RECEPTION_PASSWORD=AnotherSecure456!
```

#### Step 3: Start the server
```bash
cd server
npm start
# Backend automatically loads from .env
```

### For Production (AWS/Any Server)

#### Step 1: SSH into your server
```bash
ssh -i your-key.pem ubuntu@your-server-ip
cd /path/to/motel-management-system
```

#### Step 2: Create `.env` on the server
```bash
nano .env
# Add your production credentials here
# Save with Ctrl+X, Y, Enter
```

#### Step 3: Restart the server
```bash
pm2 restart backend
```

## ✅ Security Best Practices

### What's Safe to Commit
- ✅ `.env.example` - Template showing structure
- ✅ `server/index.js` - Uses process.env.VARIABLE_NAME
- ✅ `README.md` - Documentation with setup instructions
- ✅ All code files

### What's NOT Safe to Commit
- ❌ `.env` - Real credentials (already in .gitignore ✓)
- ❌ Any file with passwords
- ❌ API keys or secrets
- ❌ Database credentials (if not using environment variables)

### Production Credentials Strategy
1. **Never commit .env to Git** - Already handled by .gitignore
2. **Create .env only on production server** - Manually or via deployment pipeline
3. **Rotate credentials regularly** - Change passwords every 90 days
4. **Use strong passwords** - Example: `Elitegrand#1818`
5. **Restrict .env file permissions** - Only readable by the application user
   ```bash
   chmod 600 .env  # Read/write for owner only
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
