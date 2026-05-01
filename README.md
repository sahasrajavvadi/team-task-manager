# TaskFlow - Team Task Manager Application

A full-stack web application for team collaboration with project management, task assignment, and role-based access control.

## 🎯 Features

✅ **Authentication** — Secure signup/login with JWT  
✅ **Projects** — Create and manage team projects  
✅ **Tasks** — Create, assign, and track task progress  
✅ **Team Management** — Add members, assign roles (Admin/Member)  
✅ **Kanban Board** — Drag & drop task management  
✅ **Activity Tracking** — Real-time activity feed  
✅ **Dashboard** — Overview with stats and overdue tasks  
✅ **RBAC** — Role-based access control with Admin/Member roles  
✅ **Responsive Design** — Works on desktop and mobile  

## 🛠 Tech Stack

**Backend:**
- Node.js + Express.js
- MySQL + Sequelize ORM
- JWT Authentication
- Express Validator

**Frontend:**
- React 18
- React Router v6
- TanStack React Query
- Axios
- Lucide Icons
- CSS3 (Responsive)

## 📋 Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- Docker (optional)

## 🚀 Installation & Setup

### Local Development

#### 1. Clone Repository
```bash
git clone <repo-url>
cd taskflow
```

#### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file with your database credentials
cp .env.example .env

# Edit .env with your MySQL details
nano .env
```

**Backend .env example:**
```
PORT=5000
MYSQL_URL=mysql://root:password@localhost:3306/taskflow
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

#### 4. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

Backend runs on `http://localhost:5000`  
Frontend runs on `http://localhost:3000`

## 🐳 Using Docker

### Build and Run with Docker Compose
```bash
docker-compose up --build
```

This will:
- Start MySQL database
- Build and run backend service
- Build and run frontend service
- All services connected and ready

Access:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

## 📦 Available Scripts

### Backend
```bash
npm run dev      # Start with auto-reload (nodemon)
npm start        # Start production server
npm run seed     # Seed database with demo data
```

### Frontend
```bash
npm start        # Development server
npm run build    # Build for production
npm test         # Run tests
```

## 🌐 Deployment on Railway

### 1. Connect GitHub Repository

1. Push your code to GitHub
2. Go to [Railway](https://railway.app)
3. Create new project
4. Select "Deploy from GitHub"
5. Authorize GitHub and select repository

### 2. Add Services

#### MySQL Database
1. Click "Add Service" → "MySQL"
2. Select the database
3. Note the connection string

#### Backend Service
1. Click "Add Service" → "GitHub Repo"
2. Configure:
   - **Root Directory:** `backend`
   - **Start Command:** `npm start`
   - **Port:** 5000

3. Add Variables:
   ```
   NODE_ENV=production
   JWT_SECRET=<your-random-secret>
   FRONTEND_URL=${{FRONTEND_URL}}
   MYSQL_URL=${{DATABASE_URL}}
   ```

#### Frontend Service
1. Click "Add Service" → "GitHub Repo"
2. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Port:** 3000

3. Add Variables:
   ```
   REACT_APP_API_URL=${{BACKEND_URL}}/api
   ```

### 3. Deploy
- Push to GitHub
- Railway auto-deploys on push
- Check deployment logs in Railway dashboard

## 📚 API Documentation

### Authentication
```
POST   /api/auth/signup      - Create account
POST   /api/auth/login       - Login user
GET    /api/auth/me          - Get current user
PUT    /api/auth/profile     - Update profile
PUT    /api/auth/password    - Change password
```

### Projects
```
GET    /api/projects                  - List all projects
POST   /api/projects                  - Create project
GET    /api/projects/:id              - Get project details
PUT    /api/projects/:id              - Update project
DELETE /api/projects/:id              - Delete project
POST   /api/projects/:id/members      - Add member
PUT    /api/projects/:id/members/:mid - Change member role
DELETE /api/projects/:id/members/:mid - Remove member
```

### Tasks
```
GET    /api/tasks               - List tasks (filtered)
POST   /api/tasks               - Create task
GET    /api/tasks/:id           - Get task details
PUT    /api/tasks/:id           - Update task
DELETE /api/tasks/:id           - Delete task
GET    /api/tasks/dashboard     - Dashboard stats
POST   /api/tasks/:id/comments  - Add comment
```

### Activity
```
GET    /api/activity            - Get activity feed
```

## 🔐 Role-Based Access Control

### Admin Role
- Create/edit/delete projects
- Add/remove team members
- Change member roles
- Create/update/delete tasks

### Member Role
- Create/update their own tasks
- Update assigned tasks
- Add comments
- View all project data

## 🧪 Demo Credentials

After running `npm run seed`:
| Email | Password | Role |
|---|---|---|
| demo@taskflow.app | demo123 | Owner |
| alice@taskflow.app | demo123 | Admin |
| bob@taskflow.app | demo123 | Member |

---

## ✨ Features

### Core
- **JWT Authentication** — Signup/Login with bcrypt password hashing, 7-day token expiry
- **Password Strength Indicator** — Visual feedback during registration
- **Projects** — Create with custom colors, archive/unarchive, delete with cascade
- **Kanban Board** — Drag-and-drop between 4 columns (To Do → In Progress → In Review → Done)
- **Task Management** — Title, description, priority, assignee, due dates, tags, comments
- **Team Management** — Invite by email, Owner/Admin/Member roles, remove members

### Extra Features (Beyond Requirements)
- **🎯 Activity Feed / Audit Log** — Every action tracked: task created, status changed, member added, etc.
- **📊 Dashboard Analytics** — Completion rate bar, task breakdown by status, overdue alerts
- **🖱️ Drag & Drop Kanban** — Native HTML5 DnD, no extra libraries
- **📱 Mobile Responsive** — Hamburger sidebar on mobile
- **🔒 Rate Limiting** — Auth endpoints protected (20 req/15min), general API (200 req/15min)
- **🌱 Auto-Seed** — Demo data auto-created on first run if DB is empty
- **🔐 Password Change** — Users can change their password from settings

### Role-Based Access Control
| Action | Owner | Admin | Member |
|---|---|---|---|
| Delete project | ✅ | ❌ | ❌ |
| Update project / Archive | ✅ | ✅ | ❌ |
| Add/remove members | ✅ | ✅ | ❌ |
| Change member roles | ✅ | ✅ | ❌ |
| Create/edit tasks | ✅ | ✅ | ✅ |
| Delete any task | ✅ | ✅ | ❌ |
| Delete own task | ✅ | ✅ | ✅ |
| Comment | ✅ | ✅ | ✅ |

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router v6, TanStack Query, Axios |
| Backend | Node.js, Express.js |
| Database | **MySQL** with Sequelize ORM |
| Auth | JWT + bcryptjs |
| Styling | Custom CSS (Inter font, dark theme, glassmorphism) |
| Deployment | Railway (backend + frontend + MySQL plugin) |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── models/
│   │   └── index.js        # All Sequelize models + associations
│   ├── routes/
│   │   ├── auth.js         # Signup, Login, Profile, Password change
│   │   ├── projects.js     # CRUD + members + stats
│   │   ├── tasks.js        # CRUD + comments + dashboard
│   │   ├── users.js        # User search
│   │   └── activity.js     # Activity feed (extra feature)
│   ├── middleware/
│   │   └── auth.js         # JWT verification
│   ├── seed.js             # Demo data seeder (auto-runs if DB empty)
│   ├── server.js
│   └── railway.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx          # Sidebar + mobile hamburger
│   │   │   ├── TaskCard.jsx        # Kanban card with drag handle
│   │   │   ├── CreateProjectModal.jsx
│   │   │   ├── CreateTaskModal.jsx
│   │   │   ├── TaskDetailModal.jsx # View/edit task + comments
│   │   │   └── ManageMembersModal.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx       # Animated bg + show/hide password
│   │   │   ├── SignupPage.jsx      # Password strength indicator
│   │   │   ├── DashboardPage.jsx   # Stats + completion bar + activity
│   │   │   ├── ProjectsPage.jsx    # Project grid + archive section
│   │   │   ├── ProjectDetailPage.jsx  # Kanban + drag-and-drop
│   │   │   └── ActivityPage.jsx    # Full audit log (extra feature)
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── utils/
│   │       └── api.js              # Axios with JWT interceptor
│   └── railway.toml
└── README.md
```

---

## 🏗 Local Development

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally (or use Railway MySQL plugin)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MYSQL_URL=mysql://root:yourpassword@localhost:3306/taskflow
JWT_SECRET=any_random_32_char_secret_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Create the database:
```sql
CREATE DATABASE taskflow;
```

Start (auto-creates tables + seeds demo data):
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start:
```bash
npm start
```

Visit **http://localhost:3000** → Login with `demo@taskflow.app` / `demo123`

---

## 🚂 Deploy to Railway

### Step 1 — Create Railway Project
1. Go to [railway.app](https://railway.app) → New Project
2. **Add MySQL Plugin** → Railway provisions a free MySQL instance
3. Copy the `MYSQL_URL` from the MySQL plugin's "Connect" tab

### Step 2 — Deploy Backend
1. Add service → Deploy from GitHub repo → set **Root Directory** to `backend`
2. Add environment variables:
   ```
   MYSQL_URL=<from MySQL plugin — already set if same project>
   JWT_SECRET=<generate a random 32+ char string>
   FRONTEND_URL=https://your-frontend.railway.app
   NODE_ENV=production
   ```
3. Railway auto-detects Node.js, runs `npm start`
4. Tables auto-sync and demo data seeds on first boot

### Step 3 — Deploy Frontend
1. Add another service → Deploy from same GitHub repo → set **Root Directory** to `frontend`
2. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   ```
3. Build command: `npm run build`
4. Start command: `npx serve -s build -l $PORT`

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | Current user |
| PUT | `/api/auth/profile` | ✅ | Update name |
| PUT | `/api/auth/password` | ✅ | Change password |
| GET | `/api/projects` | ✅ | List my projects (with task counts) |
| POST | `/api/projects` | ✅ | Create project |
| GET | `/api/projects/:id` | ✅ | Get project details |
| PUT | `/api/projects/:id` | ✅ Admin | Update project |
| DELETE | `/api/projects/:id` | ✅ Owner | Delete project + all tasks |
| POST | `/api/projects/:id/members` | ✅ Admin | Add member by email |
| PUT | `/api/projects/:id/members/:uid` | ✅ Admin | Change member role |
| DELETE | `/api/projects/:id/members/:uid` | ✅ Admin/Self | Remove member |
| GET | `/api/projects/:id/stats` | ✅ | Project statistics |
| GET | `/api/tasks` | ✅ | List tasks (with filters) |
| GET | `/api/tasks/dashboard` | ✅ | Dashboard stats |
| POST | `/api/tasks` | ✅ | Create task |
| GET | `/api/tasks/:id` | ✅ | Get task + comments |
| PUT | `/api/tasks/:id` | ✅ | Update task |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |
| POST | `/api/tasks/:id/comments` | ✅ | Add comment |
| GET | `/api/activity` | ✅ | Activity feed |
| GET | `/api/users/search` | ✅ | Search users by email/name |
| GET | `/api/health` | ❌ | Health check |

---

Built with ❤️ for the interview assignment | Stack: React + Express + MySQL (Sequelize) | ~12 hours
