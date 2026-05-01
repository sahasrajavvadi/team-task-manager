# TaskFlow Deployment Guide

## 🚀 Deploying to Railway

Railway is the easiest way to deploy TaskFlow. Here's how:

### Step 1: Prepare Your Repository

1. Initialize git if not already done:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Push to GitHub:
```bash
git remote add origin https://github.com/yourusername/taskflow.git
git branch -M main
git push -u origin main
```

### Step 2: Create Railway Account

1. Visit [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 3: Deploy MySQL Database

1. In Railway dashboard, click "New"
2. Select "MySQL"
3. Create the database
4. Note the connection details (you'll need this)

### Step 4: Deploy Backend

1. Click "New" → "Deploy from GitHub repo"
2. Select your taskflow repository
3. Configure:
   - **Root Directory:** `backend`
   - **Start Command:** `npm start`

4. Go to Variables section, add:

```
MYSQL_HOST=<mysql-host-from-railway>
MYSQL_PORT=3306
MYSQL_USER=<mysql-user>
MYSQL_PASSWORD=<mysql-password>
MYSQL_DATABASE=taskflow
MYSQLHOST=<mysql-host>
MYSQLPORT=3306
MYSQLUSER=<mysql-user>
MYSQLPASSWORD=<mysql-password>
MYSQLDATABASE=taskflow
MYSQL_URL=mysql://user:password@host:3306/taskflow
JWT_SECRET=your-super-secret-key-here-change-this
NODE_ENV=production
FRONTEND_URL=https://<your-frontend-url>.railway.app
PORT=5000
```

5. Click Deploy

### Step 5: Deploy Frontend

1. Click "New" → "Deploy from GitHub repo"
2. Select your taskflow repository
3. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Start Command:** `npx serve -s build -l $PORT`

4. Go to Variables section, add:

```
REACT_APP_API_URL=https://<your-backend-url>.railway.app/api
```

5. Click Deploy

### Step 6: Connect Services

In your Railway project, set up environment links:

1. Click backend service
2. Go to Variables
3. Update FRONTEND_URL to link to frontend service

Do the same for frontend pointing to backend API

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS on Railway
- [ ] Set proper CORS headers
- [ ] Review database backups
- [ ] Test login/signup flows
- [ ] Verify RBAC is working

## 🧪 Testing After Deployment

1. Visit your frontend URL
2. Sign up with a test account
3. Create a project
4. Add tasks
5. Test all features:
   - ✅ Authentication
   - ✅ Project creation
   - ✅ Task management
   - ✅ Team member management
   - ✅ Activity logging
   - ✅ Drag & drop tasks

## 📊 Monitoring

1. Check Railway dashboard for logs
2. Monitor database usage
3. Set up error tracking (optional)
4. Monitor API performance

## 🔄 Continuous Deployment

Railway automatically deploys when you push to main:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Check Railway dashboard for deployment status.

## 🆘 Troubleshooting

### Backend deployment fails
- Check MySQL connection URL
- Verify environment variables are set
- Check logs in Railway dashboard
- Ensure NODE_ENV is set to "production"

### Frontend can't connect to backend
- Verify REACT_APP_API_URL is correct
- Check CORS settings in backend
- Test API directly: `curl https://backend-url/api/health`

### Database connection issues
- Verify MySQL is running
- Check MYSQL_URL format
- Test connection locally first
- Check firewall/network rules

### Build fails
- Check Node.js version (16+ required)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json
- Reinstall: `npm install`

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Express.js Guide](https://expressjs.com)
- [React Documentation](https://react.dev)
- [Sequelize Documentation](https://sequelize.org)

## 🎯 Next Steps

After deployment:

1. Set up custom domain (optional)
2. Configure email notifications
3. Set up monitoring/alerts
4. Add more team members
5. Scale if needed

---

**Need help?** Check the main README.md for more information.
