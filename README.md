# Task_Flow
# Team Task Manager

A full-stack web application for managing teams, projects, and tasks with role-based access control.

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT Auth  
**Frontend:** React (Vite), React Router, Axios, Lucide Icons

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` file with your MongoDB connection:
```
MONGODB_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_secret_key_here
```

Start backend:
```bash
npm run dev   # development (nodemon)
npm start     # production
```
Backend runs on: http://localhost:5000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

## Features

- **Authentication** — Signup/Login with JWT tokens
- **Projects** — Create, update, delete projects with color coding
- **Team Management** — Invite members by email, assign Admin/Member roles
- **Task Board** — Kanban-style board (To Do / In Progress / Review / Done)
- **Task List View** — Sortable/filterable table view
- **Task Details** — Full task editing, comments, priority, due dates
- **My Tasks** — Dashboard of all tasks assigned to you across projects
- **Role-Based Access Control**
  - **Admin**: Full access (create/edit/delete tasks, manage members, update project)
  - **Member**: View tasks, update task status, add comments
- **Dashboard** — Overview stats, recent projects & tasks
- **Profile** — Update name, change password

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/projects | Get user's projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PUT | /api/projects/:id | Update project (Admin) |
| DELETE | /api/projects/:id | Delete project (Owner) |
| POST | /api/projects/:id/members | Add member (Admin) |
| DELETE | /api/projects/:id/members/:uid | Remove member (Admin) |
| GET | /api/tasks?project=id | Get project tasks |
| GET | /api/tasks/my | Get my tasks |
| POST | /api/tasks | Create task (Admin) |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task (Admin) |
| POST | /api/tasks/:id/comments | Add comment |
