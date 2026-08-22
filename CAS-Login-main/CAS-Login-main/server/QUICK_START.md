# CAS Login API - Quick Start Guide

## ✅ Running the Application

### Prerequisites
- SQL Server database configured (update connection string in `appsettings.json`)
- Required NuGet packages installed
- .NET 10 SDK

### Steps
1. **Update Database Configuration** in `appsettings.json`:
   ```json
   "ConnectionStrings": {
	 "DefaultConnection": "Server=YOUR_SERVER;Database=CAS_DB;User Id=YOUR_USER;Password=YOUR_PASSWORD;"
   }
   ```

2. **Update JWT Secret** in `appsettings.json`:
   ```json
   "JWT": {
	 "Secret": "your-strong-secret-key-at-least-32-characters-long"
   }
   ```

3. **Run Database Migrations**:
   ```powershell
   Add-Migration InitialCreate
   Update-Database
   ```

4. **Start the Application**:
   ```powershell
   dotnet run
   ```

## 🌐 Access Swagger UI

### Development Mode
- **URL**: `https://localhost:7000/`
- Swagger UI automatically loads at the root

### Navigation
- Click any endpoint to expand its details
- Use **Try it out** to test endpoints interactively
- Click **Authorize** button for JWT authentication

## 📋 Basic Workflow

### 1. Register/Login
- **POST** `/api/account/register` - Create new account
- **POST** `/api/auth/login` - Get SSO and System tokens

### 2. Authorize in Swagger
- Copy the `SystemToken` from login response
- Click **Authorize** button
- Enter: `Bearer {your_token}`
- Click **Authorize**

### 3. Test Endpoints
- Click any secured endpoint
- Click **Try it out**
- Click **Execute**
- View response

## 🔑 Authentication

### Login Request
```json
{
  "email": "user@example.com",
  "password": "password123",
  "businessEntityName": "Zspark"
}
```

### Login Response
```json
{
  "ssoToken": "eyJhbGc...",
  "systemToken": "eyJhbGc...",
  "ssoExpiresIn": 28800,
  "systemExpiresIn": 3600,
  "profile": {
	"accountId": 1,
	"email": "user@example.com",
	"fullNameEn": "John Doe",
	"fullNameAr": "جون دو",
	"isActive": true
  },
  "role": {
	"roleId": 1,
	"name": "Admin",
	"description": "Administrator role"
  }
}
```

## 📚 API Documentation Features

✅ **Full OpenAPI/Swagger Support**
- Interactive API documentation
- Try-it-out functionality for all endpoints
- Automatic request/response formatting
- XML documentation from code comments
- JWT Bearer authentication support

✅ **Security**
- Swagger UI disabled in production
- All sensitive endpoints require JWT token
- Token validation on every request

✅ **Developer-Friendly**
- Example values for all parameters
- Error responses documented
- Response schemas shown
- Easy to test and debug

## 🐛 Common Issues

### Issue: "Database connection failed"
**Solution**: Update connection string in `appsettings.json`

### Issue: "Unauthorized - Invalid token"
**Solution**: 
- Use fresh token from login response
- Format: `Bearer {token}` (with space)
- Check token expiration

### Issue: "Swagger UI not loading"
**Solution**:
- Ensure running in Development environment
- Check that app is running on correct port
- Clear browser cache

## 📞 Support

For issues or questions:
1. Check `SWAGGER_DOCUMENTATION.md` for detailed guide
2. Review XML comments in service classes
3. Check error messages in Swagger response

---

**Last Updated**: 2024
**API Version**: v1
**Target Framework**: .NET 10
