# 🏗️ GEAR_UP — Equipment Rental Management System

> Full-Stack DevOps Project | Course: 23CS102PE405 | SR University, Warangal

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Axios, CSS Variables |
| Backend | Node.js, Express.js, JWT Auth |
| SQL DB | PostgreSQL + Sequelize ORM |
| NoSQL DB | MongoDB + Mongoose ODM |
| CI/CD | Jenkins + GitHub Actions |
| Container | Docker + Docker Compose |
| Orchestration | Kubernetes |
| IaC | Terraform |
| Monitoring | Prometheus + Grafana (config included) |

## Project Structure

```
rentforge/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # DB connections (PostgreSQL + MongoDB)
│   │   ├── controllers/      # Business logic
│   │   ├── middleware/        # Auth, RBAC, error handling
│   │   ├── models/           # Sequelize + Mongoose models
│   │   └── routes/           # API routes
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # React 18 SPA
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Auth context (JWT)
│   │   ├── hooks/            # Custom hooks
│   │   └── pages/            # All page components
│   ├── Dockerfile
│   └── package.json
├── cicd/
│   ├── Jenkinsfile           # Jenkins pipeline
│   └── github-actions.yml    # GitHub Actions workflow
├── docker/
│   └── docker-compose.yml    # Multi-container setup
├── k8s/                      # Kubernetes manifests
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── services.yaml
└── terraform/                # IaC — AWS provisioning
    └── main.tf
```

## Quick Start

```bash
# 1. Clone & setup
git clone <repo>
cd rentforge

# 2. Backend
cd backend && cp .env.example .env
npm install && npm run dev

# 3. Frontend (new terminal)
cd frontend && npm install && npm start

# 4. Docker (full stack)
cd docker && docker-compose up --build

# 5. Run tests
cd backend && npm test
```

## Role-Based Access

| Role | Permissions |
|------|-------------|
| Admin | Full CRUD on all resources, user management, reports |
| Manager | Approve rentals, manage equipment, view reports |
| Customer | Browse equipment, submit/track rental requests |
| Technician | View & update maintenance tickets only |

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/equipment          (all roles)
POST   /api/equipment          (admin, manager)
PUT    /api/equipment/:id      (admin, manager)
DELETE /api/equipment/:id      (admin only)
GET    /api/rentals            (role-filtered)
POST   /api/rentals            (customer, manager, admin)
PUT    /api/rentals/:id/status (manager, admin)
GET    /api/maintenance        (technician, manager, admin)
POST   /api/maintenance        (technician, manager, admin)
PUT    /api/maintenance/:id    (technician, manager, admin)
GET    /api/users              (admin only)
GET    /api/reports            (admin, manager)
```
