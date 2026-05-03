# Team Task Manager

A full-stack web application for managing team projects and tasks with role-based access control (Admin / Member).

## ✨ Features

- 🔐 Authentication (Signup / Login) with JWT
- 👥 Role-based access control (Admin / Member)
- 📁 Project and team management
- ✅ Task creation, assignment, and status tracking
- 📊 Dashboard with task stats (total, in-progress, completed, overdue)
- 🌐 REST API with proper validation and relationships
- 🎨 Modern, responsive UI with Tailwind CSS

## 🏗️ Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcryptjs for password hashing
- express-validator

**Frontend**
- React 18 + Vite
- React Router v6
- Tailwind CSS
- Axios
- React Hot Toast

## 📁 Project Structure

```
.
├── backend/            # Express API server
│   ├── src/
│   │   ├── config/     # DB connection
│   │   ├── controllers/
│   │   ├── middleware/ # auth, role, error handling
│   │   ├── models/     # User, Project, Task
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   └── package.json
└── frontend/           # React Vite app
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   └── main.jsx
    └── package.json
```

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd team-task-manager
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL if needed
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## 🔑 Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/task_manager
JWT_SECRET=your_super_secret_change_me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

## 📡 API Endpoints

### Auth
- `POST /api/auth/signup` — register
- `POST /api/auth/login` — login
- `GET  /api/auth/me` — current user

### Projects
- `GET    /api/projects` — list projects user belongs to
- `POST   /api/projects` — create project (creator becomes admin)
- `GET    /api/projects/:id` — project details
- `PUT    /api/projects/:id` — update (admin only)
- `DELETE /api/projects/:id` — delete (admin only)
- `POST   /api/projects/:id/members` — add member (admin only)
- `DELETE /api/projects/:id/members/:userId` — remove member (admin only)
- `PUT    /api/projects/:id/members/:userId/role` — change role (admin only)

### Tasks
- `GET    /api/projects/:projectId/tasks` — list
- `POST   /api/projects/:projectId/tasks` — create (admin only)
- `GET    /api/tasks/:id` — details
- `PUT    /api/tasks/:id` — update (admin or assignee)
- `DELETE /api/tasks/:id` — delete (admin only)
- `PATCH  /api/tasks/:id/status` — quick status change
- `GET    /api/tasks/me/dashboard` — stats for logged-in user

### Users
- `GET /api/users?search=...` — search users (for adding to projects)

## 🛡️ Role-Based Access

| Action              | Admin | Member |
| ------------------- | :---: | :----: |
| Create project      |   ✅  |   ✅   |
| Invite members      |   ✅  |   ❌   |
| Remove members      |   ✅  |   ❌   |
| Create task         |   ✅  |   ❌   |
| Delete task         |   ✅  |   ❌   |
| Change task status  |   ✅  |   ✅ (own) |
| View project        |   ✅  |   ✅   |

Role is **per-project**: a user can be admin in one project and member in another. The project creator is automatically admin.

## 🚢 Deployment (Railway)

Both services deploy as separate Railway services.

### Backend
1. Push repo to GitHub.
2. On Railway → **New Project → Deploy from GitHub**.
3. Set the service root to `/backend`.
4. Add env vars from `.env.example`.
5. Railway auto-detects Node, runs `npm install` and `npm start`.

### Frontend
1. Add a **new service** in same project → GitHub repo, root `/frontend`.
2. Build command: `npm install && npm run build`
3. Start command: `npm run preview -- --port $PORT --host 0.0.0.0`
4. Set `VITE_API_URL` to the deployed backend URL + `/api`.

### MongoDB
- Use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier) or Railway's MongoDB plugin.
- Paste the connection string into backend `MONGO_URI`.

## 📹 Demo

Record a 2–5 minute walkthrough covering: signup → create project → invite member → create/assign tasks → status updates → dashboard.

## 📄 License

MIT
