# 🎓 Elsewedy School Admission System

[![React](https://img.shields.io/badge/Frontend-React%2019-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%204.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![ASP.NET Core](https://img.shields.io/badge/Backend-ASP.NET%20Core%208.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![SQL Server](https://img.shields.io/badge/Database-SQL%20Server-CC2927?logo=microsoft-sql-server)](https://www.microsoft.com/en-us/sql-server)

A sophisticated, full-stack admission management platform designed for educational excellence. This system streamlines the entire student lifecycle—from initial application and online examinations to administrative evaluation and enrollment.

---

## ✨ Key Features

### 👨‍🎓 Student Experience
- **Seamless Registration**: intuitive multi-step application forms.
- **Dynamic Exam Portal**: Secure, timed online examinations with real-time progress saving.
- **Student Portal**: Personalized dashboard to track application status and results.

### 🔐 Administrative Control
- **Role-Based Access (RBAC)**: Distinct workflows for Admins, Board Members, SuperAdmins, and Staff.
- **Data Analytics**: Interactive charts and statistics for admission trends using Recharts.
- **Excel Integration**: Bulk student data import/export capabilities.
- **Interview Management**: Integrated scoring system for physical interviews.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Functional Components & Hooks)
- **Styling**: Tailwind CSS 4.0 (Modern utility-first CSS)
- **Routing**: React Router DOM 7
- **Visualization**: Recharts
- **Icons**: Lucide React

### Backend
- **Framework**: ASP.NET Core Web API
- **ORM**: Entity Framework Core (Code First)
- **Security**: JWT Authentication & Role-based Authorization
- **Documentation**: Swagger/OpenAPI

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [.NET SDK](https://dotnet.microsoft.com/download) (v8.0+)
- [SQL Server](https://www.microsoft.com/en-us/sql-server)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/admission-system.git
   cd admission-system
   ```

2. **Backend Setup**
   - Navigate to `server/SchoolAdmission`
   - Update `appsettings.json` with your SQL Server connection string.
   - Run migrations and start:
     ```bash
     dotnet run
     ```

3. **Frontend Setup**
   - Navigate to the root directory
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```

---

## 📂 Project Structure

```
├── public/                # Static assets
├── server/                # ASP.NET Core Backend
│   └── SchoolAdmission/   # Main API Project
│       ├── Controllers/   # API Endpoints
│       ├── Models/        # EF Core Models
│       ├── Data/          # DbContext & Migrations
│       └── Repos/         # Repository Pattern implementation
├── src/                   # React Frontend
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page-level components
│   ├── context/           # State management (AuthContext)
│   └── utils/             # Helper functions
└── package.json           # Frontend dependencies
```

---

## 📖 Detailed Documentation

For a comprehensive guide on user roles, API endpoints, and database architecture, please refer to the [DOCUMENTATION.md](./DOCUMENTATION.md) file.

---

## 📄 License
This project is proprietary and confidential. Unauthorized copying of this file, via any medium, is strictly prohibited.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
