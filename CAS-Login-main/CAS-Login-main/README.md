# 🔐 Central Authentication Service (CAS) - SSO Integration Guide

This guide details how to integrate any new sub-system (e.g. Exam Hub, Capstone System, LMS, HR, etc.) into the **Central Authentication Service (CAS) Single Sign-On (SSO)** ecosystem.

---

## 📐 Architecture Overview

The CAS SSO ecosystem consists of:
1. **CAS Central Portal**:
   - **Frontend**: `http://localhost:5174` (React + Vite)
   - **Backend**: `http://localhost:5148` (.NET Core API)
   - **Role**: Central authority managing user credentials (`Logins`/`Accounts`), issuing central `cas_sso_token` and system-specific JWT tokens per `BusinessEntity`.
2. **Sub-Systems (Client Applications & APIs)**:
   - **Exam Hub**: Frontend `http://localhost:5173` | Backend `http://localhost:5051` | Entity: `Exams`
   - **Capstone Management System**: Frontend `http://localhost:3001` | Backend `http://localhost:5048` | Entity: `CapstoneProject`
   - **Future Systems**: Port X | API Port Y | Entity: `<BusinessEntityName>`

---

## 🔑 Shared JWT Configuration & Secrets

All sub-systems must validate JWT tokens using the CAS master signing key and claims configuration:

| Parameter | Value |
| :--- | :--- |
| **Secret Signing Key** | `"tbV/kbyLRqqoDCKJVwksaKqE07GNPkOcFTX7LN96nkY="` |
| **Valid Issuer** | `"CAS.Api"` |
| **Valid Audience** | `"CAS.Clients"` |
| **Role Claim Type** | `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` (`ClaimTypes.Role`) |
| **NameIdentifier Claim Type** | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier` (`ClaimTypes.NameIdentifier`) |

---

## ⚙️ Part 1: Backend Integration (.NET Core API)

### 1. Update `appsettings.json`
Add or update the `Jwt` section in your sub-system's `appsettings.json`:

```json
{
  "Jwt": {
    "Key": "tbV/kbyLRqqoDCKJVwksaKqE07GNPkOcFTX7LN96nkY=",
    "AccessTokenSecret": "tbV/kbyLRqqoDCKJVwksaKqE07GNPkOcFTX7LN96nkY=",
    "Issuer": "CAS.Api",
    "Audience": "CAS.Clients"
  }
}
```

### 2. Update `Program.cs` (JWT Validation & CORS)
Configure `TokenValidationParameters` to accept CAS-issued tokens and allow CORS requests from CAS:

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["Jwt:AccessTokenSecret"] ?? builder.Configuration["Jwt:Key"] ?? "tbV/kbyLRqqoDCKJVwksaKqE07GNPkOcFTX7LN96nkY=")),
            ValidateIssuer = true,
            ValidIssuers = new[] { builder.Configuration["Jwt:Issuer"] ?? "CAS.Api", "CAS.Api" },
            ValidateAudience = true,
            ValidAudiences = new[] { builder.Configuration["Jwt:Audience"] ?? "CAS.Clients", "CAS.Clients" },
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.WithOrigins(
            "http://localhost:5174", // CAS Portal
            "http://localhost:5173", // Exam Hub Client
            "http://localhost:3001"  // Capstone Client
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});
```

### 3. Extracting User ID & Claims safely in Controllers
Always use fallback claim parsing to avoid `null` / `undefined` user IDs:

```csharp
var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) 
               ?? User.FindFirstValue("sub") 
               ?? User.FindFirstValue("nameid");

long.TryParse(userIdClaim, out var userId);
```

---

## 💻 Part 2: Frontend Integration (React + Vite)

### 1. Remove Local Login Form
Do NOT create or render local email/password login forms in sub-systems. Make your `/login` route or unauthenticated state automatically redirect to CAS:

```javascript
// Automatically redirect to Central CAS Login page
const casUrl = 'http://localhost:5174';
const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`);
const businessEntity = 'YOUR_BUSINESS_ENTITY_NAME'; // e.g. 'Exams', 'CapstoneProject'

window.location.href = `${casUrl}/login?redirect=${callbackUrl}&businessEntity=${businessEntity}`;
```

### 2. Implement SSO Callback Handler (`/sso-callback`)
Create an `/sso-callback` route in your React app that receives URL query parameters from CAS, saves credentials, and opens the dashboard with **0ms delay**:

```javascript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SsoCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const userName = searchParams.get('name') || searchParams.get('userName');
    const email = searchParams.get('email');

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
      if (role) localStorage.setItem('userRole', role);
      if (userName) localStorage.setItem('userName', userName);
      if (email) localStorage.setItem('userEmail', email);

      // Instantly navigate to main application / dashboard
      navigate('/', { replace: true });
    } else {
      window.location.href = 'http://localhost:5174/login';
    }
  }, [searchParams, navigate]);

  return null; // Instant redirection, no intermediate card needed
}
```

### 3. Loop-Safe Axios 401 Interceptor
Prevent infinite redirect loops when API tokens expire or fail validation:

```javascript
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true;
        localStorage.clear();
        sessionStorage.clear();
        
        const casUrl = 'http://localhost:5174';
        const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`);
        window.location.href = `${casUrl}/login?redirect=${callbackUrl}&businessEntity=YOUR_BUSINESS_ENTITY_NAME`;
      }
    }
    return Promise.reject(error);
  }
);
```

### 4. Single Sign-Out (Logout Handler)
When a user clicks **Log Out** in your sub-system, clear local storage and redirect to CAS with `prompt=login`:

```javascript
const handleLogout = () => {
  localStorage.clear();
  sessionStorage.clear();

  const casUrl = 'http://localhost:5174';
  const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`);
  window.location.href = `${casUrl}/login?prompt=login&redirect=${callbackUrl}&businessEntity=YOUR_BUSINESS_ENTITY_NAME`;
};
```

---

## 🛠️ Troubleshooting & Known Errors Resolved

### 🛑 Error 1: 401 Unauthorized / Infinite Redirect Loop
- **Symptom**: Page refreshes in a loop between `http://localhost:5173/?redirect=...` and CAS.
- **Cause**: JWT signing key, issuer, or audience mismatch between CAS server and sub-system API.
- **Solution**: Ensure `Jwt:Key` in sub-system `appsettings.json` matches `"tbV/kbyLRqqoDCKJVwksaKqE07GNPkOcFTX7LN96nkY="` and `Issuer` matches `"CAS.Api"`.

### 🛑 Error 2: `GET /api/dashboard/student/undefined` (400 Bad Request)
- **Symptom**: Dashboard fails to load user profile or stats because User ID is `undefined`.
- **Cause**: Token claim name resolution difference between `sub`, `id`, `nameid`, and `ClaimTypes.NameIdentifier`.
- **Solution**: Parse token payloads using fallbacks:
  ```javascript
  const userId = payload.sub || payload.id || payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
  ```

### 🛑 Error 3: User Automatically Re-logs In On Logout
- **Symptom**: Clicking **Log Out** in a sub-system redirects to CAS, but CAS immediately auto-authenticates and sends the user right back.
- **Cause**: CAS retained `cas_sso_token` in `localStorage` on port 5174 and didn't know the user wanted to log out.
- **Solution**: Always append `prompt=login` in the logout redirect URL (`http://localhost:5174/login?prompt=login...`). In CAS `LoginForm.jsx`, detect `prompt=login` and wipe `cas_sso_token` and `cas_user_info`.

### 🛑 Error 4: SSO Not Auto-Logging Into Second Project
- **Symptom**: Logging into Exam Hub works, but opening Capstone forces a manual password login instead of auto-authenticating.
- **Cause 1**: CAS `authApi.exchangeToken` was missing the `Authorization: Bearer <cas_sso_token>` header.
- **Cause 2**: Lingering `cas_is_prompt_login` flag in `sessionStorage`.
- **Solution**:
  - In CAS `api.js`, update `exchangeToken` to explicitly attach `headers: { 'Authorization': 'Bearer ' + ssoToken }`.
  - In CAS `LoginForm.jsx`, clear `sessionStorage.removeItem('cas_is_prompt_login')` after handling prompt logins.

### 🛑 Error 5: Backend Process File Locking Error (`MSB3021` / `MSB3027`)
- **Symptom**: `dotnet build` fails with: `The process cannot access the file ... apphost.exe because it is being used by another process`.
- **Cause**: An active `dotnet run` background instance is locking the binary.
- **Solution**: Stop the running process first (`Stop-Process -Name "SystemExeName" -Force`), then re-run `dotnet build`.

---

## 📌 Summary Checklist for New Sub-System Integration

- [ ] Add master JWT key (`"tbV/kbyLRqqoDCKJVwksaKqE07GNPkOcFTX7LN96nkY="`) and issuer (`"CAS.Api"`) to backend `appsettings.json`.
- [ ] Add CAS origin (`http://localhost:5174`) to backend CORS policy in `Program.cs`.
- [ ] Set frontend `/login` to auto-redirect to CAS with `businessEntity=<YOUR_ENTITY>`.
- [ ] Implement `/sso-callback` route with instant navigation to dashboard.
- [ ] Wire up logout button to call CAS with `prompt=login`.
