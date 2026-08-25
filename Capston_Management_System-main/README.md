# Capstone Management System

A centralized web-based platform for managing student capstone projects, bridging students, engineers, and administrators through structured workflows for task assignment, progress tracking, and evaluation.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, React Router, Tailwind CSS, Chart.js |
| **Backend** | ASP.NET Core 8 Web API |
| **Database** | SQL Server with Entity Framework Core |
| **Security** | JWT Authentication, BCrypt hashing, XSS protection, Rate limiting |
| **Architecture** | Clean Architecture (Services, Repositories, Controllers) |

## User Roles

| Role | Permissions |
|------|-------------|
| **Student** | View tasks, submit deliverables, track progress, manage team projects |
| **Engineer** | Review submissions, assign tasks, provide feedback, monitor team progress |
| **Capstone Lead** | Full oversight of assigned classes, task management, student evaluation |
| **Staff Admin** | User management, team configuration, system administration |
| **Super Admin** | Complete system access, analytics dashboard, configuration |
| **Board** | Executive reporting, cross-team analytics, performance metrics |

## Features

### Task Management
- Full lifecycle tracking: Pending → In Progress → Submitted → Approved/Rejected
- Grade-level, class-level, and team-level task assignment
- Deadline tracking with automatic late submission detection
- Task submission with GitHub links and notes

### Team Management
- Create and manage project teams
- Assign team leaders
- Track team progress and performance
- Assign engineers/supervisors to classes

### Project Management
- Team project creation and tracking
- Company information and project description
- Supervisor assignment
- Progress monitoring

### Reporting System
- Student-submitted progress reports
- Status tracking and review workflow
- Performance analytics

### Analytics Dashboard
- Real-time statistics (students, teams, tasks, completion rates)
- Task completion by status breakdown
- Teams progress tracking
- Engineer assignments by class
- Teams completed all tasks overview

## Security Features

- **JWT Authentication** - Secure token-based authentication with 15-minute access tokens and 7-day refresh tokens
- **Role-Based Access Control (RBAC)** - Granular permission system per role
- **Password Security** - BCrypt hashing with complexity validation
- **Rate Limiting** - Protection against brute force attacks
- **XSS Protection** - Input sanitization for all user inputs
- **Security Headers** - Content Security Policy, X-Frame-Options, X-XSS-Protection

## API Endpoints

### Authentication
- `POST /api/Account/Login` - User login
- `POST /api/Account/Refresh` - Refresh access token
- `POST /api/Account/Logout` - Logout

### Accounts
- `GET /api/Account/CurrentUser` - Get current user info
- `POST /api/Account/CreateStaffAdmin` - Create staff/admin account
- `PUT /api/Account/{id}` - Update account
- `DELETE /api/Account/{id}` - Deactivate account

### Tasks
- `GET /api/AccountTask/StudentTasks/{studentId}` - Get student tasks
- `GET /api/AccountTask/ByGrade/{gradeId}` - Get tasks by grade
- `POST /api/AccountTask` - Create task (privileged)
- `PUT /api/AccountTask/{id}` - Update task
- `DELETE /api/AccountTask/{id}` - Delete task

### Submissions
- `GET /api/TaskSubmissions` - Get all submissions
- `POST /api/TaskSubmissions` - Submit task
- `POST /api/TaskSubmissions/{id}/review` - Mark as reviewed
- `POST /api/TaskSubmissions/{id}/reject` - Reject submission

### Teams
- `GET /api/Teams` - Get all teams
- `GET /api/Teams/{id}` - Get team details
- `POST /api/Teams/Create` - Create team
- `PUT /api/Teams/{teamId}/AssignLeader` - Assign team leader

### Dashboard
- `GET /api/Dashboard/Student/{studentId}` - Student dashboard
- `GET /api/Dashboard/Board/Statistics` - System statistics
- `GET /api/Dashboard/Board/TeamsProgress` - Teams progress
- `GET /api/Dashboard/Board/TaskCompletionByStatus` - Task breakdown

### Reference Data
- `GET /api/Grades` - Get grades (role-filtered)
- `GET /api/Classes` - Get classes
- `GET /api/Weeks` - Get course weeks

## Project Structure

```
server/
├── Controllers/           # API endpoints (thin controllers)
├── Services/            # Business logic layer
│   └── Interfaces/      # Service contracts
├── Repositories/        # Data access layer
│   ├── Interfaces/      # Repository contracts
│   └── Implementations/
├── Models/              # Entity models
└── Program.cs           # App configuration

client/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API integration
│   ├── context/         # Auth context, providers
│   └── utils/           # Helpers, constants
```

## Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQL Server 2019+

### Backend Setup
```bash
cd server
dotnet restore
dotnet build
dotnet run
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Environment Variables
```env
# Server
ConnectionStrings__DefaultConnection=your_sql_server_connection
Jwt__AccessTokenSecret=your_secret_key
Jwt__Issuer=ElsewedyCapstoneSystem
Jwt__Audience=ElsewedyCapstoneSystem
```

## Database Schema

Core entities: Accounts, Teams, TeamMembers, Projects, Tasks, TaskSubmissions, Reports, Grades, Classes, Weeks, StudentExtensions, ReviewerSupervisorExtensions, SuperAdminExtensions, Roles, AccountRoles

## Performance Optimizations

- Indexed queries for fast lookups
- No-tracking queries for read-only operations
- Efficient Include/ThenInclude for eager loading
- Rate limiting on sensitive endpoints

