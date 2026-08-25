# Elsewedy Capstone System - Frontend

This is the frontend application for the Elsewedy Capstone System, built with React and Vite.

## Features

- **Modern Login System**: Secure authentication with email and password
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dashboard**: Comprehensive dashboard with multiple sections
- **User Management**: Different user roles (Admin, Student, Supervisor, Teacher, Engineer)
- **Task Management**: View and manage tasks and phases
- **Reports**: Generate and view reports
- **Team Management**: Track team progress and assignments

## Login System

The application includes a complete login system with the following features:

### Frontend Components

1. **Login Component** (`src/Components/Login/Login.jsx`)
   - Email and password input fields
   - Password visibility toggle
   - Remember me checkbox
   - Forgot password link
   - Loading states and error handling
   - Responsive design

2. **Authentication Service** (`src/utils/authService.js`)
   - API calls to backend
   - Token management
   - User session handling
   - Automatic logout on token expiration

3. **App Component** (`src/App.jsx`)
   - Authentication state management
   - Conditional rendering (Login vs Dashboard)
   - User session persistence

### Backend Integration

The login system integrates with the .NET backend:

- **Login Endpoint**: `POST /api/Account/Login`
- **Current User Endpoint**: `GET /api/Account/CurrentUser`
- **Token-based Authentication**: Simple token generation (can be upgraded to JWT)

### User Roles

The system supports multiple user roles:

- **Admin** (RoleId: 1): Full system access
- **Student** (RoleId: 2): Student-specific features
- **Supervisor** (RoleId: 3): Supervisor capabilities
- **Teacher** (RoleId: 4): Teacher features
- **Engineer** (RoleId: 5): Engineer-specific access

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- .NET 8.0 (for backend)

### Installation

1. **Install Frontend Dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

3. **Start the Backend Server**
   ```bash
   cd ../server/Elsewedy-Capstone_System
   dotnet run
   ```

### Configuration

1. **API Base URL**: Update the `API_BASE_URL` in `src/utils/authService.js` to match your backend URL:
   ```javascript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

2. **CORS**: Ensure your backend allows CORS requests from the frontend domain.

## Usage

### Login Process

1. Navigate to the application
2. Enter your email and password
3. Click "Sign In"
4. Upon successful authentication, you'll be redirected to the dashboard

### Logout

- Click the "Log Out" button in the sidebar
- This will clear your session and return you to the login page

### Session Management

- User sessions are stored in localStorage
- Authentication tokens are automatically included in API requests
- Sessions persist across browser refreshes
- Automatic logout on token expiration

## Development

### Project Structure

```
client/
├── src/
│   ├── Components/
│   │   ├── Login/
│   │   │   ├── Login.jsx
│   │   │   └── Login.css
│   │   ├── Dashboard/
│   │   ├── Sidebar/
│   │   └── ...
│   ├── utils/
│   │   └── authService.js
│   ├── App.jsx
│   └── main.jsx
├── public/
└── package.json
```

### Key Files

- **Login Component**: `src/Components/Login/Login.jsx`
- **Authentication Service**: `src/utils/authService.js`
- **Main App**: `src/App.jsx`
- **Sidebar**: `src/Components/Sidebar/Sidebar.jsx`

### Styling

The login page uses the same design system as the rest of the application:
- Color scheme: Red (#e53e3e) primary color
- Typography: System fonts
- Responsive design with mobile-first approach
- Smooth animations and transitions

## Security Considerations

### Current Implementation

- Basic token-based authentication
- Password validation (demo mode - accepts any password for existing emails)
- Session storage in localStorage

### Recommended Improvements

1. **JWT Tokens**: Implement proper JWT token generation and validation
2. **Password Hashing**: Add proper password hashing (bcrypt, Argon2)
3. **HTTPS**: Use HTTPS in production
4. **Token Refresh**: Implement token refresh mechanism
5. **Rate Limiting**: Add rate limiting for login attempts
6. **Two-Factor Authentication**: Consider adding 2FA for enhanced security

## Testing

### Manual Testing

1. **Login Flow**:
   - Test with valid credentials
   - Test with invalid credentials
   - Test with empty fields
   - Test password visibility toggle

2. **Session Management**:
   - Test session persistence after refresh
   - Test logout functionality
   - Test automatic logout on token expiration

3. **Responsive Design**:
   - Test on different screen sizes
   - Test on mobile devices

### Demo Credentials

For testing purposes, you can use any email that exists in your database. The current implementation accepts any password for existing email addresses.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS configuration allows frontend domain
2. **API Connection**: Check that backend server is running and accessible
3. **Token Issues**: Clear localStorage and re-login if experiencing authentication problems

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages and API request/response logs.

## Contributing

1. Follow the existing code style and structure
2. Test your changes thoroughly
3. Update documentation as needed
4. Ensure responsive design works on all devices

## License

This project is part of the Elsewedy Capstone System.
