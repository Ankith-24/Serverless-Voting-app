# PollStream — Serverless Full-Stack Polling App

A modern, real-time polling platform built with React (Vite) and AWS Serverless (Lambda, API Gateway, DynamoDB).

## Architecture

```
Frontend (React + Vite)  →  API Gateway  →  Lambda Functions  →  DynamoDB
     Port 5173               Port 3001        Node.js 18          Local/AWS
```

## Prerequisites

- **Node.js** 18+ and npm
- **Java Runtime** (JRE 8+) — required by `serverless-dynamodb` for local DynamoDB

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend
npm install
npm start
```

This starts:
- **API Gateway** at `http://localhost:3001`
- **DynamoDB Local** at `http://localhost:8000`
- Auto-creates tables and seeds sample users

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. API calls are proxied to the backend via Vite.

## Seed Users (Default Credentials)

| Role        | Email                  | Password       |
|-------------|------------------------|----------------|
| Super Admin | admin@pollapp.com      | password123    |
| Admin       | polladmin@pollapp.com  | password123    |
| Voter       | voter@pollapp.com      | password123    |

## API Endpoints

### Auth
| Method | Path                | Description       |
|--------|---------------------|-------------------|
| POST   | /api/auth/register  | Register new user |
| POST   | /api/auth/login     | Login, get JWT    |
| GET    | /api/auth/me        | Get current user  |

### Users (Super Admin only)
| Method | Path                      | Description      |
|--------|---------------------------|------------------|
| GET    | /api/users                | List all users   |
| POST   | /api/users                | Add user         |
| DELETE | /api/users/{userId}       | Remove user      |
| PUT    | /api/users/{userId}/role  | Change role      |

### Polls (Admin / Super Admin)
| Method | Path                | Description    |
|--------|---------------------|----------------|
| POST   | /api/polls          | Create poll    |
| GET    | /api/polls          | List polls     |
| GET    | /api/polls/{pollId} | Get single poll|
| PUT    | /api/polls/{pollId} | Edit poll      |
| DELETE | /api/polls/{pollId} | Delete poll    |

### Voting
| Method | Path                        | Description   |
|--------|-----------------------------|---------------|
| POST   | /api/polls/{pollId}/vote    | Cast vote     |
| GET    | /api/polls/{pollId}/results | Get results   |

## DynamoDB Tables

- **polling-app-users-dev** — Users with email GSI
- **polling-app-polls-dev** — Polls with createdBy GSI
- **polling-app-votes-dev** — Votes with composite key (pollId + userId)

## Deployment to AWS

```bash
cd backend
npx serverless deploy --stage prod
```

Update `VITE_API_URL` in the frontend `.env` to point to the deployed API Gateway URL.

```bash
cd frontend
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com npm run build
```

## Project Structure

```
Project Poll/
├── backend/
│   ├── serverless.yml           # IaC - Lambda, API GW, DynamoDB
│   ├── package.json
│   ├── seed/users.json          # Seed data for local DynamoDB
│   └── src/
│       ├── handlers/
│       │   ├── auth.js          # Register, Login, GetMe
│       │   ├── users.js         # CRUD users (Super Admin)
│       │   ├── polls.js         # CRUD polls (Admin)
│       │   └── votes.js         # Cast vote, Get results
│       └── utils/
│           ├── jwt.js           # JWT sign/verify
│           ├── dynamodb.js      # DynamoDB client
│           ├── response.js      # HTTP response helpers
│           └── auth-middleware.js# Auth & RBAC checks
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── api/axios.js         # Axios with JWT interceptor
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Charts.jsx       # Recharts bar & pie
│       │   ├── ProtectedRoute.jsx
│       │   └── Sidebar.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── superadmin/      # Dashboard, ManageUsers, AllPolls
│           ├── admin/           # Dashboard, CreatePoll, MyPolls
│           ├── voter/           # Dashboard, AvailablePolls, VotePoll
│           └── shared/          # PollResults (charts + table)
└── README.md
```
