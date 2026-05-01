# Getting Started with TaskFlow

Welcome to TaskFlow! This guide will help you set up and deploy your Team Task Manager application.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development](#local-development)
3. [Using Docker](#using-docker)
4. [Database Setup](#database-setup)
5. [Deployment](#deployment)
6. [Features Overview](#features-overview)
7. [Troubleshooting](#troubleshooting)

## ⚡ Quick Start

### For Windows Users
```bash
# Double-click setup.bat or run:
setup.bat
```

### For Mac/Linux Users
```bash
# Make script executable
chmod +x setup.sh

# Run setup
./setup.sh
```

Then follow the instructions to start the development servers.

## 🛠 Local Development

### Prerequisites
- **Node.js** 16+ ([Download](https://nodejs.org/))
- **npm** 8+ (comes with Node.js)
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** ([Download](https://git-scm.com/))

### Step 1: Install MySQL

**Windows:**
1. Download MySQL from https://dev.mysql.com/downloads/mysql/
2. Run the installer
3. Choose "Developer Default" setup
4. Configure with:
   - Port: 3306
   - Username: root
   - Password: password

**Mac (using Homebrew):**
```bash
brew install mysql
brew services start mysql
mysql -u root -p  # Test connection
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env`:
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=taskflow
MYSQL_URL=mysql://root:password@localhost:3306/taskflow
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

Start backend:
```bash
npm run dev
```

You should see:
```
✅ MySQL connected successfully
✅ Database tables synced
📦 Empty database detected — running seed...
🚀 Server running on port 5000
```

### Step 3: Frontend Setup

```bash
cd frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm start
```

The frontend will open automatically at `http://localhost:3000`

### Demo Credentials

Login with demo account:
- **Email:** demo@taskflow.app
- **Password:** demo123

Other demo accounts:
- alice@taskflow.app / demo123
- bob@taskflow.app / demo123

## 🐳 Using Docker

Docker makes it easy to run the entire stack with one command!

### Prerequisites
- **Docker** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (included with Docker Desktop)

### Quick Start with Docker

```bash
# Build and run everything
docker-compose up --build

# Or just start (if already built)
docker-compose up
```

Then:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **MySQL:** localhost:3306

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop containers
docker-compose down

# Remove volumes (careful - deletes database!)
docker-compose down -v

# Rebuild specific service
docker-compose build backend --no-cache
```

## 💾 Database Setup

### Auto-Setup (Recommended)
When you start the backend, it automatically:
1. Creates MySQL connection
2. Creates all required tables
3. Seeds demo data if database is empty

### Manual Database Operations

```bash
# Seed demo data
cd backend
npm run seed

# Reset database (from backend directory)
# Delete taskflow database manually, then restart server
```

### Database Schema

The application creates these tables:
- `users` - User accounts
- `projects` - Team projects
- `project_members` - Project membership with roles
- `tasks` - Tasks within projects
- `comments` - Task comments
- `activities` - Activity log

## 🌐 Deployment

### Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MySQL database service created
- [ ] Environment variables configured
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Services connected
- [ ] Tested all features

### Deploy to Railway (5 minutes)

1. **Sign up** at https://railway.app (with GitHub)

2. **Add MySQL:**
   - Click "New" → "MySQL"
   - Create database

3. **Deploy Backend:**
   - Click "New" → "GitHub Repo"
   - Select your repo
   - Root Directory: `backend`
   - Add variables (see DEPLOYMENT.md)
   - Deploy

4. **Deploy Frontend:**
   - Click "New" → "GitHub Repo"
   - Select your repo
   - Root Directory: `frontend`
   - Add variables (see DEPLOYMENT.md)
   - Deploy

5. **Connect Services:**
   - Update FRONTEND_URL in backend variables
   - Update REACT_APP_API_URL in frontend variables

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🎯 Features Overview

### User Authentication
- ✅ Sign up / Login
- ✅ Password strength meter
- ✅ JWT-based sessions
- ✅ Profile management
- ✅ Change password

### Projects
- ✅ Create/edit/delete projects
- ✅ Add team members
- ✅ Assign roles (Admin/Member)
- ✅ Project color coding
- ✅ Active/archived status

### Tasks
- ✅ Create tasks with title & description
- ✅ Set priority (Low/Medium/High/Critical)
- ✅ Set status (To Do/In Progress/In Review/Done)
- ✅ Assign to team members
- ✅ Set due dates
- ✅ Add tags
- ✅ Drag & drop between columns
- ✅ Add comments

### Dashboard
- ✅ Task statistics
- ✅ Overdue tasks list
- ✅ Completion rate
- ✅ Recent activities
- ✅ Quick project overview

### Activity Feed
- ✅ Track all changes
- ✅ Timestamps
- ✅ User avatars
- ✅ Grouped by project

### RBAC (Role-Based Access)
- **Admin:** Full control - create/edit/delete everything
- **Member:** Can create tasks and comment

## 🐛 Troubleshooting

### MySQL Connection Error

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solutions:**
1. Verify MySQL is running:
   ```bash
   # Windows: Check Services
   # Mac: brew services list | grep mysql
   # Linux: sudo service mysql status
   ```

2. Check credentials in `.env` match MySQL installation

3. Verify port 3306 is not blocked

4. Try MySQL command line:
   ```bash
   mysql -h localhost -u root -p
   ```

### Frontend Can't Connect to Backend

**Error:** `API Error: Network request failed`

**Solutions:**
1. Check backend is running on port 5000
2. Verify `REACT_APP_API_URL` in `.env`
3. Check CORS in backend/server.js allows frontend URL
4. Check firewall allows port 5000
5. Test API: `curl http://localhost:5000/api/health`

### Node Modules Issues

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json  # (or delete folders in Windows)
npm install
```

### Port Already in Use

**Backend port 5000 or Frontend port 3000 already in use:**

```bash
# Find process using port (Mac/Linux)
lsof -i :5000

# Kill process
kill -9 <PID>

# Windows: Find and kill in Task Manager
```

Or change ports in `.env` and React start command.

### Database Seeding

If demo data doesn't load:

```bash
cd backend
npm run seed
```

If that fails, manually clear database:
```bash
# In MySQL client
DROP DATABASE taskflow;
# Restart backend to recreate
```

## 📚 API Endpoints

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Authentication Examples
```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@taskflow.app","password":"demo123"}'
```

For full API documentation, see [README.md](./README.md#-api-documentation)

## 🚀 Next Steps

1. ✅ Run the application locally
2. ✅ Create test projects and tasks
3. ✅ Test all features
4. ✅ Try Docker setup
5. ✅ Deploy to Railway
6. ✅ Add custom domain (optional)
7. ✅ Invite team members

## 📖 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Sequelize ORM](https://sequelize.org/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Railway Docs](https://docs.railway.app/)
- [Docker Documentation](https://docs.docker.com/)

## 💬 Support

**Common Questions:**

Q: Can I use PostgreSQL instead of MySQL?
A: Currently configured for MySQL. To use PostgreSQL, update sequelize config in `backend/models/index.js` and install `pg` package.

Q: How do I add more team members?
A: Create a new user account, then add them to projects via the "Manage Members" feature.

Q: Can I deploy on Heroku instead of Railway?
A: Yes, similar process. See Heroku documentation for environment setup.

Q: How do I backup my database?
A: Most hosting platforms (Railway, Heroku) provide automated backups. For manual backups, use MySQL dump tools.

---

**Ready to start?** Run `setup.bat` (Windows) or `./setup.sh` (Mac/Linux) and begin building! 🚀

For deployment help, see [DEPLOYMENT.md](./DEPLOYMENT.md)
