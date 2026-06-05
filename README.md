# StudentVote — Serverless Student Voting System

A modern, secure student voting platform built with React (Vite) and AWS Serverless (Lambda, API Gateway, DynamoDB).

## Architecture

```
Frontend (React + Vite)  →  API Gateway  →  Lambda Functions  →  DynamoDB
     Port 5174               Port 3001        Node.js 18          Local/AWS
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

Opens at `http://localhost:5174`. API calls are proxied to the backend via Vite.

## Seed Users (Default Credentials)

All passwords are `password123`.

| Role          | Email                  | Student ID  | Password    |
|---------------|------------------------|-------------|-------------|
| Super Admin   | admin@pollapp.com      | —           | password123 |
| Admin         | polladmin@pollapp.com  | —           | password123 |
| Student       | alice@pollapp.com      | STU2026001  | password123 |
| Student       | bob@pollapp.com        | STU2026002  | password123 |

> **Email constraint**: All emails must end with `@pollapp.com`. This is enforced on both client and server.

## API Endpoints

### Auth
| Method | Path                | Description       |
|--------|---------------------|-------------------|
| POST   | /api/auth/register  | Register new student (requires @pollapp.com email) |
| POST   | /api/auth/login     | Login, get JWT    |
| GET    | /api/auth/me        | Get current user  |

### Users (Super Admin only)
| Method | Path                           | Description            |
|--------|--------------------------------|------------------------|
| GET    | /api/users                     | List all users         |
| POST   | /api/users                     | Add user               |
| DELETE | /api/users/{userId}            | Remove user            |
| PUT    | /api/users/{userId}/role       | Change role            |
| PUT    | /api/users/{userId}/eligible   | Toggle eligibility     |

### Elections (Admin / Super Admin)
| Method | Path                               | Description          |
|--------|-------------------------------------|----------------------|
| POST   | /api/elections                      | Create election      |
| GET    | /api/elections                      | List elections       |
| GET    | /api/elections/{electionId}         | Get single election  |
| PUT    | /api/elections/{electionId}         | Edit election        |
| PUT    | /api/elections/{electionId}/status  | Open/close election  |
| DELETE | /api/elections/{electionId}         | Delete election      |

### Voting
| Method | Path                                    | Description    |
|--------|-----------------------------------------|----------------|
| POST   | /api/elections/{electionId}/vote         | Cast vote      |
| GET    | /api/elections/{electionId}/results      | Get results    |

## DynamoDB Tables

- **polling-app-users-dev** — Users with email GSI, includes studentId and eligible fields
- **polling-app-elections-dev** — Elections with createdBy GSI, candidates array, and status field
- **polling-app-votes-dev** — Votes with composite key (electionId + userId)

## User Model

```json
{
  "userId": "uuid",
  "name": "Alice Student",
  "email": "alice@pollapp.com",
  "role": "VOTER",
  "studentId": "STU2026001",
  "year": "3",
  "program": "Computer Science",
  "eligible": true
}
```

## Election Model

```json
{
  "electionId": "uuid",
  "title": "Student Council President",
  "description": "Annual election for...",
  "candidates": [
    { "id": "uuid", "name": "Alice", "bio": "...", "party": "...", "position": "" }
  ],
  "startDate": "2026-06-01T00:00:00.000Z",
  "endDate": "2026-06-30T00:00:00.000Z",
  "status": "draft|open|closed",
  "eligibilityRules": { "year": "3", "program": "Computer Science" },
  "createdBy": "userId"
}
```

## Election Lifecycle

1. Admin **creates** election → status: `draft`
2. Admin **opens** election → status: `open` (students can now vote)
3. Admin **closes** election → status: `closed` (voting stops, results final)

## Migration from PollStream

If migrating from the original PollStream app:

```bash
# 1. Stop existing backend
# 2. The DynamoDB tables have been renamed:
#    - polling-app-polls-dev  → polling-app-elections-dev
#    - Votes table key: pollId → electionId
# 3. Re-seed the database:
cd backend
npm run setup-db

# 4. Start the backend with new schema
npm start

# 5. Frontend routes changed from /polls to /elections
cd ../frontend
npm run dev
```

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

## Running Tests

```bash
cd backend
npm test
```

## Project Structure

```
Project Poll/
├── backend/
│   ├── serverless.yml           # IaC - Lambda, API GW, DynamoDB
│   ├── package.json
│   ├── seed/users.json          # Seed data with student users
│   └── src/
│       ├── handlers/
│       │   ├── auth.js          # Register (with student fields), Login, GetMe
│       │   ├── users.js         # CRUD users + eligibility toggle (Super Admin)
│       │   ├── elections.js     # CRUD elections + status management (Admin)
│       │   └── votes.js         # Cast vote (with eligibility check), Get results
│       ├── setup-db.js          # DynamoDB table creation + seeding
│       └── utils/
│           ├── jwt.js           # JWT sign/verify
│           ├── dynamodb.js      # DynamoDB client
│           ├── response.js      # HTTP response helpers
│           ├── validators.js    # Input validation (email domain, candidates, etc.)
│           ├── logger.js        # Pino logger
│           └── auth-middleware.js# Auth & RBAC checks
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── api/axios.js         # Axios with JWT interceptor
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── Charts.jsx       # Recharts bar & pie (election results)
│       │   ├── ProtectedRoute.jsx
│       │   └── Sidebar.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx     # Includes student ID, year, program fields
│           ├── superadmin/      # Dashboard, ManageUsers, AllElections
│           ├── admin/           # Dashboard, CreateElection, MyElections
│           ├── voter/           # Dashboard, AvailableElections, VoteElection
│           └── shared/          # ElectionResults (charts + table)
└── README.md
```
