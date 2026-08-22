# 📖 Project Documentation

This document provides a deep dive into the technical architecture, user workflows, and database structure of the Elsewedy School Admission System.

---

## 👥 User Roles & Workflows

The system implements a strict Role-Based Access Control (RBAC) model to ensure data security and specialized workflows.

### 1. Students
Students are the primary users of the registration and examination modules.
- **Registration**: New students register via the `/apply` page.
- **Information Completion**: After registration, students complete their detailed profile (educational background, parent info) at `/complete-student-info`.
- **Examination**: Students take automated online exams at `/get-exam`. The system tracks time and prevents navigation away from the exam.
- **Portal**: Students can check their admission status and exam scores via the `/student-portal`.

### 2. Admin
Admins manage the day-to-day operations of the admission process.
- **Dashboard**: Access to real-time statistics on registered students, exam completions, and section distributions.
- **Excel Upload**: Bulk import student data via the `/admin/excel-upload` tool.
- **Evaluation**: Admins can input interview scores and manage student records.

### 3. Board & SuperAdmin
These roles provide high-level oversight.
- **Analytics**: Advanced data visualization using Recharts to monitor the overall health of the admission cycle.
- **System Management**: SuperAdmins have full access to modify system configurations and sensitive data.

### 4. Reception Coordinator & Student Affairs
- **Reception**: Handles physical registration of students at the school desk.
- **Student Affairs**: Specialized search and edit tools to manage student files and documentation.

---

## 🏗️ Architectural Overview

### Frontend Architecture
- **State Management**: Uses `AuthContext` for global authentication state and JWT handling.
- **Component Design**: Highly modular UI built with functional components.
- **Data Fetching**: Axios is used for API communication, with interceptors for attaching JWT tokens.
- **Responsiveness**: Tailwind CSS ensures a mobile-first, responsive design for all dashboards.

### Backend Architecture
- **Repository Pattern**: Decouples data access logic from controllers, making the code more testable and maintainable.
- **Service Layer**: Handles complex business logic, such as Excel processing (EPPlus) and score calculations.
- **JWT Security**: Secure token-based authentication with role claims.
- **Swagger**: Automatically generated documentation for all API endpoints.

---

## 🔌 API Reference

The backend exposes a RESTful API. Key controllers include:

| Controller | Purpose | Key Endpoints |
| :--- | :--- | :--- |
| **Auth** | Authentication | `POST /api/auth/login`, `POST /api/auth/register` |
| **Admin** | Management | `GET /api/admin/stats`, `POST /api/admin/upload-excel` |
| **Exam** | Testing System | `GET /api/exam/questions`, `POST /api/exam/submit` |
| **Student** | Profile Management | `GET /api/student/profile`, `PUT /api/student/update` |
| **StudentAffair** | Data Management | `GET /api/studentaffair/search`, `POST /api/studentaffair/edit` |

> [!TIP]
> Access the interactive API documentation at `/swagger` when the backend is running.

---

## 🗄️ Database Schema

The database is built on SQL Server using Entity Framework Core. Core entities include:

### `Account`
The central table for all users.
- `Id`: Primary Key
- `Email`, `NationalId`: Unique identifiers
- `RoleId`: Foreign Key to `Role`

### `AdmissionProfile`
Extends `Account` with admission-specific data.
- `AccountId`: Primary Key / Foreign Key to `Account`
- `EnglishScore`, `MathScore`, `ArabicScore`: Exam results
- `ParentPhoneNumber`, `Address`: Contact details

### `ExamSystem`
- `ExamQuestion`: Stores the bank of questions and correct answers.
- `StudentExamAnswer`: Records every answer submitted by students.
- `StudentExamResult`: Final calculated scores for the admission exams.

---

## 🛠️ Deployment & Maintenance

### Deployment
1. **Frontend**: Can be deployed to Vercel, Netlify, or as static files on IIS.
2. **Backend**: Optimized for Windows Server/IIS or Linux with Kestrel.
3. **Database**: SQL Server 2019 or later.

### Backups
Regularly backup the SQL Server database. A sample backup file `ElsewedySchoolSysDB_DEV-BackUp-18-2` is included in the project root for development reference.

---

## 📞 Support
For technical issues, please contact the system administrator or the development team.
