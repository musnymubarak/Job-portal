# CareerConnect - Job Portal & ATS Platform

A comprehensive job management platform that streamlines the hiring process for students and administrators. It features a robust Applicant Tracking System (ATS), real-time notifications, role-based access control, and a modern, responsive UI.

## 🚀 Features

### 🎓 For Students
- **Job Board**: Browse and search for internships and full-time positions.
- **Smart Application**: Apply for jobs with a single click after uploading your CV.
- **ATS Scoring**: Get instant feedback on how well your CV matches job requirements.
- **Application Tracking**: Monitor the status of your applications in real-time (Applied, Reviewed, Accepted, Rejected).
- **Notifications**: Receive instant alerts for new job postings and application status updates.
- **Profile Management**: Manage your personal details and secure your account.

### 🏢 For Administrators
- **Job Management**: Create, edit, and manage job postings with rich details (skills, requirements, etc.).
- **Application Review**: varied dashboard to review candidates, view parsed CV data, and see ATS scores.
- **Workflow Automation**: Accept or reject candidates with a single click, triggering instant student notifications.
- **Real-time & Secure**: Strict role-based access ensures data security while WebSocket integration keeps dashboards uniform.

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python), SQLAlchemy, PostgreSQL
- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **Real-time**: WebSockets (FastAPI + React)
- **ATS Engine**: PDFMiner (Text Extraction & Keyword Matching)
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS (Dark Mode supported)

## 🏃‍♂️ How to Run

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL
- Git

### 1. Backend Setup
```bash
cd backend
# Create virtual environment
python -m venv venv
# Activate virtual environment (Windows)
.\venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Run Database Migrations
alembic upgrade head
# Seed Database (Optional - Creates dummy data)
python seed_data.py
# Start Server
uvicorn app.main:app --reload
```
*Backend runs on `http://localhost:8000`*

### 2. Frontend Setup (Student Portal)
```bash
cd frontend
# Install dependencies
npm install
# Start Development Server
npm run dev
```
*Student Portal runs on `http://localhost:5173`*

### 3. Admin Portal Setup
```bash
cd admin
# Install dependencies
npm install
# Start Development Server
npm run dev
```
*Admin Portal runs on `http://localhost:5174`*

## 🔐 Login Credentials (Seeded Data)

### Administrator
- **Email**: `admin1@example.com`
- **Password**: `password123`

### Student
- **Email**: `student1@example.com`
- **Password**: `password123`

## 🛡️ Security
- **JWT Authentication**: Secure token-based access with auto-expiration.
- **RBAC**: Strict separation of Student and Admin APIs.
- **Protected Routes**: Frontend redirects unauthenticated users immediately.
