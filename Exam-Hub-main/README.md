# 🎓 Exams Hub

Exams Hub is a comprehensive web application designed to manage and organize academic examinations. It provides a seamless experience for both administrators and students to handle exam materials effectively.

## 🚀 Architecture
The project is built using a **Monorepo** structure:
- **Client:** Modern frontend built with JavaScript (React/Vite).
- **Server:** Robust Backend API built with .NET Core (C#).

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** JavaScript / React
- **Styling:** CSS3 / Modern UI frameworks
- **Build Tool:** Vite / NPM

### Backend
- **Framework:** .NET Core (C#)
- **API Style:** RESTful API
- **Tools:** Entity Framework Core (likely used for DB management)

---

## 💻 Getting Started

### Prerequisites
- [.NET SDK](https://dotnet.microsoft.com/download) (latest version)
- [Node.js & npm](https://nodejs.org/)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/Sekiro242/Exams_Hub.git](https://github.com/Sekiro242/Exams_Hub.git)
   cd Exams_Hub
Backend Setup (Server)

Bash

cd server/api
dotnet restore
dotnet run
The server will typically start at http://localhost:5000 or 7000.

Frontend Setup (Client)

Bash

cd client
npm install
npm run dev
The application will be available at http://localhost:5173 (default for Vite).

📁 Project Structure
Plaintext

Exams_Hub/
├── client/              # Frontend source code
│   ├── src/             # Components and logic
│   └── package.json     # JS dependencies
├── server/              # Backend source code
│   ├── api/             # API Endpoints & Controllers
│   └── Exams_Hub.sln    # .NET Solution file
└── README.md            # Project documentation
🛡️ License
This project is licensed under the MIT License - see the LICENSE file for details.

👤 Author
Sekiro242

GitHub: @Sekiro242

Developed with ❤️ for education.