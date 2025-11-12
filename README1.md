# Medical Facilities & Activities Web App

A full-stack web application for managing medical facilities, complaints, and activities.

## Quick Start

### 1. Setup Database
```bash
sudo systemctl start postgresql
sudo -u postgres psql << 'SQL'
DROP DATABASE IF EXISTS medical_facilities;
DROP USER IF EXISTS medical_user;
CREATE USER medical_user WITH PASSWORD 'medical_pass';
CREATE DATABASE medical_facilities;
GRANT ALL PRIVILEGES ON DATABASE medical_facilities TO medical_user;
ALTER DATABASE medical_facilities OWNER TO medical_user;
\q
SQL
```

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

### 3. Setup Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4. Access App
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/health

### Test Accounts
- Admin: admin@medical.com / admin123
- Manager: manager@medical.com / manager123
- Resident: resident@medical.com / resident123

## Features
- JWT Authentication
- Role-based Access Control
- Facilities Management
- Complaints System with Status Tracking
- File Upload Support
- Dashboard with Statistics
- Entry/Exit Logging
