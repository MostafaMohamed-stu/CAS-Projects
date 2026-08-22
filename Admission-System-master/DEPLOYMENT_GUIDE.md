# IIS Deployment Guide

## Backend Deployment

### 1. Build the Backend

```bash
cd server/SchoolAdmission
dotnet publish -c Release -o ./publish
```

### 2. Configure IIS

1. Create a new Application Pool
2. Set .NET CLR Version to "No Managed Code"
3. Set Managed Pipeline Mode to "Integrated"

### 3. Create IIS Site/Application

1. Create a new site or application
2. Point physical path to the published folder
3. Set application pool to the one created above

### 4. Configure appsettings.Production.json

Update the following in `appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-server;Database=SchoolAdmission;Trusted_Connection=true;TrustServerCertificate=true;"
  },
  "Jwt": {
    "Key": "your-secure-jwt-key-here",
    "Issuer": "SchoolAdmission"
  },
  "Cors": {
    "AllowedOrigins": ["http://your-domain.com", "https://your-domain.com"]
  }
}
```

### 5. Set Environment Variable

Set `ASPNETCORE_ENVIRONMENT=Production` in IIS Application Pool or web.config.

## Admission Settings Database Upgrade

Before deploying this application version, run the following SQL script once on the
target school database:

```text
server/SchoolAdmission/Database/20260801_AddVersionedAdmissionSettings.sql
```

The script is transactional and idempotent, so rerunning it is safe. It creates the
settings history and student assignment tables, seeds the legacy/IQ/current defaults,
and assigns every applicant that already exists to a historical configuration. It does
not update any row in `StudentExamResult` and does not recalculate stored marks.

Run the IQ upgrade script first if the target database does not yet contain
`StudentExamResult.ExamIQScore`.

## Frontend Deployment

### 1. Build the Frontend

```bash
npm run build
```

### 2. Configure Environment Variables

Create `.env.production` file:

```
VITE_API_BASE_URL=/api
```

Notes:

- `VITE_API_BASE_URL` is the Axios `baseURL` used by the frontend.
- In local development, the frontend uses the Vite dev-server proxy at `/api` (see `vite.config.js`), which forwards to your ASP.NET backend (default: `http://127.0.0.1:5253`).
- In production, you should set `VITE_API_BASE_URL` to:
  - `/api` if your frontend and backend are served from the same domain and you configure the server to route `/api` to the backend.
  - `https://your-api-domain.com/api` if your backend is on a different domain.

### 3. Deploy to IIS

1. Copy the `dist` folder contents to your IIS site
2. Ensure the API is accessible at `/api` path
3. Configure URL Rewrite rules for SPA routing

### 4. URL Rewrite Configuration

Add this to `web.config` in the frontend root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Check CORS configuration in appsettings.Production.json
2. **404 Errors**: Ensure URL Rewrite rules are configured
3. **Database Connection**: Verify connection string and SQL Server access
4. **JWT Issues**: Check JWT key configuration

### Logs:

- Check IIS logs in `%SystemDrive%\inetpub\logs\LogFiles`
- Check application logs in Event Viewer
- Enable detailed error pages in development
