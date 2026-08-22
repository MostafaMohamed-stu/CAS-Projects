# Swagger API Documentation

## Overview
The CAS Login API includes comprehensive Swagger/OpenAPI documentation enabled in the Development environment. When running the application in development mode, navigate to the root URL to access the interactive API documentation.

## Accessing Swagger UI

### Development Environment
- **URL**: `https://localhost:7000/` (or the configured HTTPS port)
- Swagger UI is automatically served at the root path
- Full interactive API documentation with try-it-out functionality

### Production Environment
- Swagger UI is **disabled** in Production for security reasons
- To enable in other environments, modify `Program.cs`

## Features

### ✅ JWT Bearer Authentication
- All secured endpoints require a valid JWT token
- Use the **Authorize** button in Swagger UI to add your token
- Format: `Bearer {your_jwt_token}`

### ✅ Interactive API Testing
- Try out all endpoints without leaving the browser
- Automatic request/response formatting
- Example values displayed for each parameter

### ✅ XML Documentation
- C# XML comments are automatically included in the documentation
- Each controller, service method, and DTO is documented
- Request/response schemas are fully documented

### ✅ Schema Documentation
- Request body schemas show required fields and types
- Response schemas show data types and structure
- Error responses documented with status codes

## API Endpoints

### Authentication (`/api/auth`)
- **POST /api/auth/login** - Authenticate user
- **POST /api/auth/exchange** - Exchange SSO token for System token
- **POST /api/auth/validate** - Validate token

### Account Management (`/api/account`)
- **POST /api/account/register** - Register new account
- **GET /api/account/profile** - Get current user profile
- **PUT /api/account/profile** - Update user profile
- **POST /api/account/change-password** - Change password
- **POST /api/account/forgot-password** - Request password reset
- **POST /api/account/reset-password** - Execute password reset

### Roles (`/api/role`)
- **GET /api/role** - Get all roles
- **GET /api/role/{id}** - Get specific role
- **GET /api/role/account/{businessEntityName}** - Get user's role

### Business Entities (`/api/businessentity`)
- **GET /api/businessentity** - Get all business entities
- **GET /api/businessentity/{name}** - Get specific entity
- **GET /api/businessentity/my-entities** - Get user's entities

## How to Use with Swagger UI

### Step 1: Login
1. Click on **POST /api/auth/login**
2. Click **Try it out**
3. Enter email, password, and businessEntityName
4. Click **Execute**
5. Copy the `SsoToken` and `SystemToken` from the response

### Step 2: Authorize
1. Click the **Authorize** button (top-right)
2. Paste the token in format: `Bearer {your_token}`
3. Click **Authorize**
4. Now all subsequent requests will include the token

### Step 3: Test Endpoints
1. Click on any endpoint
2. Click **Try it out**
3. Modify parameters if needed
4. Click **Execute**
5. View the response

## Swagger Configuration in Code

The Swagger setup in `Program.cs` includes:
- Full API documentation with title, version, and description
- JWT Bearer authentication scheme definition
- Security requirement for protected endpoints
- XML documentation from code comments
- Parameter naming conventions (camelCase)

## Building XML Documentation

XML documentation is generated automatically when building:
1. The project is configured with `<GenerateDocumentationFile>true</GenerateDocumentationFile>`
2. XML file is generated in the output directory: `CAS_Login_Back_End.xml`
3. Swagger automatically includes this in the UI

Warning code 1591 (undocumented public members) is suppressed to allow flexibility.

## Customizing Swagger

To customize Swagger documentation:

1. **Add XML comments** to your code:
   ```csharp
   /// <summary>
   /// Brief description of what this endpoint does
   /// </summary>
   /// <param name="id">Description of the id parameter</param>
   /// <returns>Description of return value</returns>
   [HttpGet("{id}")]
   public async Task<IActionResult> Get(int id)
   {
	   // ...
   }
   ```

2. **Modify Swagger configuration** in Program.cs:
   ```csharp
   builder.Services.AddSwaggerGen(options =>
   {
	   options.SwaggerDoc("v1", new OpenApiInfo { ... });
	   // Add more configuration
   });
   ```

3. **Hide endpoints** if needed (add to attribute):
   ```csharp
   [ApiExplorerSettings(IgnoreApi = true)]
   public IActionResult HiddenEndpoint() { }
   ```

## Security Notes

⚠️ **Important**: 
- Swagger UI exposes your API structure - disable in production
- Never commit real credentials in test requests
- Swagger is **only enabled in Development** by default
- To enable in other environments, modify the `if (app.Environment.IsDevelopment())` check

## Troubleshooting

### Swagger UI not showing
- Ensure you're running in Development environment
- Check browser console for JavaScript errors
- Verify `/swagger/v1/swagger.json` endpoint is accessible

### XML comments not appearing
- Rebuild the solution (generates fresh XML file)
- Ensure `<GenerateDocumentationFile>true</GenerateDocumentationFile>` in .csproj
- Add XML comments to public methods/classes

### Authorization not working
- Paste token with "Bearer " prefix
- Verify token is valid and not expired
- Check token format: `Bearer {jwt_token}`

## Resources

- [Swagger.io Official Documentation](https://swagger.io/)
- [Swashbuckle for ASP.NET Core](https://github.com/domaindrivendev/Swashbuckle.AspNetCore)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)
