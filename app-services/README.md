# nexustry/app-services

Application source code repository for the ArgoCD + Octopus Deploy Lab.

## Services

| Service  | Port | Image Base     | Description                                  |
|----------|------|----------------|----------------------------------------------|
| frontend | 8080 | nginx:alpine   | HTML page served by nginx, proxies to API    |
| api      | 8080 | node:18-alpine | Express REST API returning dummy JSON data   |
| backend  | 8080 | node:18-alpine | Business logic, reads/writes EBS volume      |
| scraper  | 9090 | node:18-alpine | Generates dummy data every 30 seconds        |

## Repository Structure

```
nexustry/app-services/
|-- frontend/
|   |-- src/
|   |   |-- index.html      <- the HTML page users see
|   |   `-- nginx.conf      <- nginx server config
|   |-- Dockerfile
|   `-- package.json
|
|-- api/
|   |-- src/
|   |   `-- index.js        <- Express server, returns dummy JSON
|   |-- Dockerfile
|   `-- package.json
|
|-- backend/
|   |-- src/
|   |   `-- index.js        <- reads and writes /data/records.json
|   |-- Dockerfile
|   `-- package.json
|
`-- scraper/
    |-- src/
    |   `-- index.js        <- generates dummy data every 30 seconds
    |-- Dockerfile
    `-- package.json
```

## How to Run Locally (without Kubernetes)

### Prerequisites
- Node.js 18+
- Docker Desktop

### Run each service locally

```bash
# API
cd api
npm install
npm start
# Open: http://localhost:8080

# Backend
cd backend
npm install
mkdir -p /tmp/data
DATA_DIR=/tmp/data npm start
# Open: http://localhost:8080

# Scraper
cd scraper
npm install
mkdir -p /tmp/scraped-data
DATA_DIR=/tmp/scraped-data npm start
# Open: http://localhost:9090

# Frontend (needs nginx - easier to use Docker)
cd frontend
docker build -t lab-frontend .
docker run -p 8080:8080 lab-frontend
# Open: http://localhost:8080
```

### Run with Docker

```bash
# Build all images
docker build -t lab-frontend:local ./frontend
docker build -t lab-api:local      ./api
docker build -t lab-backend:local  ./backend
docker build -t lab-scraper:local  ./scraper

# Run individually to test
docker run -p 8080:8080 lab-api:local
# Test: curl http://localhost:8080/health
# Test: curl http://localhost:8080/data
```

## How the CI/CD Pipeline Works

```
Developer pushes code to this repo
          |
          | git push + PR to main
          v
GitHub triggers TeamCity via webhook
          |
          v
TeamCity:
  1. Install dependencies  (npm install)
  2. Run tests             (npm test)
  3. Build Docker image    (docker build)
  4. Security scan         (trivy)
  5. Push to AWS ECR
  6. Update image tag in nexustry/k8s-config repo
          |
          v
ArgoCD detects image tag change in k8s-config
          |
          v
Octopus sends Slack approval request
          |
          v
Human approves -> ArgoCD syncs -> EKS deploys new version
```

## API Endpoints Quick Reference

### API Service (port 8080)
```
GET /           -> service info
GET /health     -> {"status":"ok"}
GET /data       -> list of all items
GET /items/:id  -> single item by ID
```

### Backend Service (port 8080)
```
GET    /           -> service info
GET    /health     -> {"status":"ok","data_file":"accessible"}
GET    /records    -> all records from EBS volume
POST   /records    -> create new record  body: {"title":"...", "status":"active"}
DELETE /records/:id -> delete record
```

### Scraper Service (port 9090)
```
GET /         -> service info
GET /health   -> {"status":"ok"}
GET /latest   -> latest scraped data
GET /history  -> last 10 scrape results
```

## Branch Naming Convention

```
feature/TASK-XXX-short-description   <- new features
bugfix/TASK-XXX-short-description    <- bug fixes
hotfix/TASK-XXX-short-description    <- production emergency fixes
```

## Commit Message Format

```
[TASK-XXX] Short description of change

Examples:
[TASK-001] Add welcome message to frontend
[TASK-002] Fix API /data endpoint returning wrong count
[TASK-003] Update scraper interval to 60 seconds
```
