# School Management System API - Complete Setup Guide

## 📋 Project Overview

**Tech Stack:**
- Node.js + Express (REST API)
- PostgreSQL (Database)
- Prisma ORM (Database Management)
- Docker (Containerization)

**Features:**
- Complete CRUD for Students, Teachers, Classes, Courses, Enrollments
- RESTful API endpoints
- Type-safe database queries
- Docker deployment ready
- Perfect for CI/CD testing

---

### 1. Create Environment File

Create `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres123@school_db:5432/school_management?schema=public
PORT=3000
NODE_ENV=development
```

---

## 🗂️ Final Project Structure

```
demo-sms-api/
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── server.js
├── package.json
├── .env
├── Dockerfile
├── .dockerignore
├── .gitignore
└── README.md
```

---

## 🔧 Setup & Run

### Local Development Setup

```bash
docker network create sms-net
```

```bash
# 1. Start PostgreSQL (Docker)
docker run -d \
  --name school_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=school_management \
  --network sms-net \
  -v school_db_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Wait for database to start
sleep 5

# 3. Generate Prisma Client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Seed database
npm run prisma:seed

# 6. Start server
npm run dev
```

### Verify Setup

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"status":"OK","timestamp":"...","database":"connected"}

# Get all students
curl http://localhost:3000/api/students

# Get statistics
curl http://localhost:3000/api/stats
```

---

## 🐳 Docker Deployment (Separate Containers)

### Step 1: Create Network

```bash
docker network create sms-net
```

### Step 2: Run Database Container

```bash
docker run -itd \
  --name school_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=school_management \
  --network sms-net \
  -v school_db_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 3: Build API Image

```bash
docker build -t school-api:latest .
```

### Step 4: Run API Container

```bash
docker run -itd \
  --name school_api \
  --network sms-net \
  --env-file .env \
  -p 3000:3000 \
  school-api:latest
```

### Step 5: Check Containers

```bash
# List running containers
docker ps

# Check API logs
docker logs -f school_api

# Check DB logs
docker logs -f school_db
```

### Step 6: Test API

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/students
```

---

## 📚 API Endpoints Reference

### Health
- `GET /health` - API and DB health check

### Students
- `GET /api/students` - List all (Query: `?grade=10&classId=1`)
- `GET /api/students/:id` - Get one with enrollments
- `POST /api/students` - Create
- `PUT /api/students/:id` - Update
- `DELETE /api/students/:id` - Delete

### Teachers
- `GET /api/teachers` - List all (Query: `?subject=Math`)
- `GET /api/teachers/:id` - Get one with classes
- `POST /api/teachers` - Create
- `PUT /api/teachers/:id` - Update
- `DELETE /api/teachers/:id` - Delete

### Classes
- `GET /api/classes` - List all (Query: `?teacherId=1`)
- `GET /api/classes/:id` - Get one with teacher and students
- `POST /api/classes` - Create
- `PUT /api/classes/:id` - Update
- `DELETE /api/classes/:id` - Delete

### Courses
- `GET /api/courses` - List all
- `GET /api/courses/:id` - Get one
- `POST /api/courses` - Create
- `PUT /api/courses/:id` - Update
- `DELETE /api/courses/:id` - Delete

### Enrollments
- `GET /api/enrollments` - List all (Query: `?studentId=1&classId=1&status=active`)
- `POST /api/enrollments` - Create
- `DELETE /api/enrollments/:id` - Delete

### Statistics
- `GET /api/stats` - System statistics

---

## 🧪 Example API Requests

### Create Student

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice@school.com",
    "grade": "11"
  }'
```

### Update Student

```bash
curl -X PUT http://localhost:3000/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{"grade": "12"}'
```

### Create Teacher

```bash
curl -X POST http://localhost:3000/api/teachers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Michael",
    "lastName": "Brown",
    "email": "m.brown@school.com",
    "subject": "Science",
    "phone": "123-456-7892"
  }'
```

### Create Class

```bash
curl -X POST http://localhost:3000/api/classes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Science 101",
    "teacherId": 1,
    "room": "C-301",
    "schedule": "Mon-Wed-Fri 11:00-12:00",
    "capacity": 28
  }'
```

### Enroll Student

```bash
curl -X POST http://localhost:3000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "classId": 2,
    "status": "active"
  }'
```

---

## 🔧 Useful Commands

### Prisma Commands

```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name

# Format schema
npx prisma format

# Generate types
npx prisma generate
```

### Docker Commands

```bash
# View logs
docker logs -f school_api
docker logs -f school_db

# Stop containers
docker stop school_api school_db

# Start containers
docker start school_db school_api

# Remove containers
docker rm -f school_api school_db

# Access database
docker exec -it school_db psql -U postgres -d school_management

# View stats
docker stats school_api school_db

# Rebuild API
docker stop school_api && docker rm school_api
docker build -t school-api:latest .
docker run -itd --name school_api --network sms-net --env-file .env -p 3000:3000 school-api:latest
```

### Clean Up

```bash
# Stop and remove everything
docker stop school_api school_db
docker rm school_api school_db
docker network rm school-network
docker volume rm school_db_data
docker rmi school-api:latest
```

---


## 📝 Notes

- **Default Port**: 3000 (change in `.env`)
- **Default DB**: `school_management`
- **Default Credentials**: `postgres / postgres123`
- **Data Persistence**: Docker volume `school_db_data`
- **For Production**: Change passwords and use environment secrets

---

## ✅ Checklist

Before deployment, ensure:

- [ ] All dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database is running (Docker or local)
- [ ] Migrations applied (`npx prisma migrate dev`)
- [ ] Database seeded (`npm run prisma:seed`)
- [ ] `.env` configured correctly
- [ ] Health endpoint returns OK
- [ ] API endpoints tested
