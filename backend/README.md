# College ERP Backend

A full-stack College Management System backend built with Node.js, Express, PostgreSQL, and Prisma ORM.

## Roles

- **ADMIN** - Can manage students, attendance, and all features
- **STUDENT** - Can view their own attendance and profile

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Update `DATABASE_URL` with your Neon PostgreSQL connection string
   - Update `JWT_SECRET` with a secure random string

3. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

4. **Push schema to database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/signup` | Register new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/profile` | Get current user profile | Protected |
| PUT | `/profile` | Update user profile | Protected |
| PUT | `/change-password` | Change password | Protected |

### Students (`/api/students`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Create student | Admin |
| GET | `/` | List all students (with pagination & search) | Protected |
| GET | `/stats` | Get student statistics | Protected |
| GET | `/:id` | Get student by ID (with attendance) | Protected |
| PUT | `/:id` | Update student | Admin |
| DELETE | `/:id` | Delete student | Admin |

### Attendance (`/api/attendance`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Mark attendance for a student | Protected |
| POST | `/bulk` | Bulk mark attendance | Admin |
| POST | `/mark-all` | Mark all students present | Admin |
| GET | `/` | Get attendance records (with filters) | Protected |
| GET | `/stats` | Get attendance statistics | Protected |
| GET | `/student/:studentId` | Get attendance by student | Protected |
| PUT | `/:id` | Update attendance | Admin |
| DELETE | `/:id` | Delete attendance record | Admin |

## Example Requests

### Signup (Admin)
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91 98765 43210",
    "password": "admin123",
    "role": "ADMIN",
    "name": "Admin User",
    "email": "admin@college.edu"
  }'
```

### Signup (Student)
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91 98765 43211",
    "password": "student123",
    "role": "STUDENT",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+91 98765 43210", "password": "admin123"}'
```

### Create Student (Admin)
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@college.edu",
    "rollNo": "CS001",
    "phone": "+91 98765 43212",
    "course": "Computer Science",
    "semester": "1st"
  }'
```

### Get All Students
```bash
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mark Attendance
```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "studentId": "STUDENT_ID",
    "date": "2026-04-06",
    "status": "PRESENT"
  }'
```

### Mark All Present (Admin)
```bash
curl -X POST http://localhost:5000/api/attendance/mark-all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"date": "2026-04-06"}'
```

### Get Attendance Stats
```bash
curl http://localhost:5000/api/attendance/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Attendance with Filters
```bash
curl "http://localhost:5000/api/attendance?startDate=2026-04-01&endDate=2026-04-06&status=PRESENT" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Student (Admin)
```bash
curl -X PUT http://localhost:5000/api/students/STUDENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "John Smith", "course": "IT"}'
```

### Delete Student (Admin)
```bash
curl -X DELETE http://localhost:5000/api/students/STUDENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Query Parameters

### Students
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by name, email, roll no, phone
- `course` - Filter by course
- `semester` - Filter by semester

### Attendance
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `date` - Filter by specific date
- `startDate` - Start date for range
- `endDate` - End date for range
- `studentId` - Filter by student
- `status` - Filter by PRESENT, ABSENT, LATE
