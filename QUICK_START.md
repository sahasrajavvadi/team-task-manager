# 🚀 Quick Reference Card

## Start Application

### Windows
```bash
setup.bat
```

### Mac/Linux
```bash
chmod +x setup.sh
./setup.sh
```

### Manual
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm start
```

### Docker
```bash
docker-compose up --build
```

## Access Points

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3000 | React app |
| Backend API | http://localhost:5000/api | REST API |
| MySQL | localhost:3306 | Database |
| Health Check | http://localhost:5000/api/health | API status |

## Demo Login

```
Email:    demo@taskflow.app
Password: demo123
```

## Project Structure

```
taskflow/
├── backend/          # Express API + MySQL
│   ├── models/       # Database models
│   ├── routes/       # API endpoints
│   ├── middleware/   # Auth, validation
│   └── server.js     # Main app
├── frontend/         # React application
│   ├── components/   # UI components
│   ├── pages/        # Page layouts
│   ├── context/      # Auth context
│   └── utils/        # API client
├── docker-compose.yml # Docker setup
├── GETTING_STARTED.md # Setup guide
└── DEPLOYMENT.md     # Deploy guide
```

## Common Commands

| Task | Command |
|------|---------|
| Seed demo data | `cd backend && npm run seed` |
| Build frontend | `cd frontend && npm run build` |
| Run backend dev | `cd backend && npm run dev` |
| Run backend prod | `cd backend && npm start` |
| Docker build | `docker-compose up --build` |
| View backend logs | `docker-compose logs -f backend` |
| Stop Docker | `docker-compose down` |

## Environment Files

- `backend/.env` - Backend config
- `backend/.env.production` - Production config
- `frontend/.env` - Frontend config  
- `frontend/.env.production` - Production config

## Key Features

✅ User Authentication (JWT)  
✅ Project Management  
✅ Task Management (Kanban)  
✅ Team Collaboration  
✅ Activity Tracking  
✅ Role-Based Access (Admin/Member)  
✅ Comments on Tasks  
✅ Drag & Drop Tasks  
✅ Dashboard with Stats  
✅ Responsive Design  

## Deployment (Railway)

1. Push to GitHub
2. Sign up at https://railway.app
3. Create MySQL database
4. Deploy backend (root: `backend`)
5. Deploy frontend (root: `frontend`)
6. Configure environment variables
7. Connect services
8. Done! ✅

See DEPLOYMENT.md for details.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MySQL connection error | Check .env credentials, ensure MySQL running |
| Frontend won't connect | Check REACT_APP_API_URL, verify backend running |
| npm install fails | Clear cache: `npm cache clean --force` |
| Port already in use | Kill process: `lsof -i :5000` (Mac/Linux) |
| Docker issues | Rebuild: `docker-compose down && docker-compose up --build` |

## Default MySQL Setup

```
Host:     localhost
Port:     3306
User:     root
Password: password
Database: taskflow
```

## API Quick Test

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@taskflow.app","password":"demo123"}'

# Get projects (requires token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/projects
```

## Files to Update for Production

1. `backend/.env` → Change JWT_SECRET
2. `backend/.env` → Change MySQL credentials
3. `frontend/.env` → Update REACT_APP_API_URL
4. `backend/server.js` → Update CORS origin
5. `.env.production` files → Set production values

## Support

- 📖 See **GETTING_STARTED.md** for setup help
- 🚀 See **DEPLOYMENT.md** for deployment help
- 📋 See **README.md** for full documentation
- ✨ See **FEATURES.md** for what's implemented

---

**Ready to go!** Run setup and start building! 🎉
