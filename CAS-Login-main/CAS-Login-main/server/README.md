# CAS Login Back-End

Authentication and account-management API for CAS clients. The API issues two JWTs:

- **SSO token** — valid for 8 hours and identifies an authenticated account.
- **System token** — valid for 1 hour and includes the selected business-entity context.

The client selects a business entity by its numeric `businessEntityId`. The API resolves its name and redirect URL from `Tbl_BusinessEntity`; clients must not send a business-entity name.

## Run locally

### Prerequisites

- .NET SDK 10.0
- Access to the SQL Server database

Configure the connection and JWT settings in `appsettings.json` or user secrets:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=SERVER;Database=DATABASE;Integrated Security=True;Encrypt=True;Trust Server Certificate=True"
  },
  "JWT": {
    "Key": "a-long-random-signing-key",
    "Issuer": "CAS.Api",
    "Audience": "CAS.Clients",
    "ExpirationMinutes": 60,
    "SsoExpirationHours": 8
  },
  "LoginRateLimiting": {
    "MaxRequests": 5,
    "Window": "00:15:00"
  }
}
```

Run the project:

```powershell
dotnet run
```

Swagger UI is available at `/swagger` in the Development environment.

## Authentication

Protected endpoints accept either a valid SSO token or system JWT:

```http
Authorization: Bearer {jwtToken}
```

The login and registration endpoints are anonymous. All other protected endpoints accept both token types.

The system JWT contains the account, role, business-entity ID/name, and `RedirectUrl` claims. The redirect URL is data returned from the authorized `Tbl_BusinessEntity.URL` row; clients should use it only after successful authentication.

## Response envelope

All successful responses use this shape:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

Errors are returned by the exception middleware:

```json
{
  "statusCode": 400,
  "success": false,
  "message": "Registration validation failed.",
  "errors": ["Email is required."]
}
```

Common status codes are `400` (validation), `401` (invalid token, credentials, or access), `404` (not found), and `500`.

`POST /api/auth/login` is limited to five requests per client IP in each 15-minute fixed window. The sixth request returns `429 Too Many Requests` with `Too many login attempts. Please try again later.` Other endpoints are unaffected. When deployed behind a reverse proxy or load balancer, configure its trusted address in `ForwardedHeaders:KnownProxies` (or its trusted CIDR in `ForwardedHeaders:KnownNetworks`); forwarded client-IP headers from untrusted sources are ignored.

## Endpoint summary

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | None | Authenticate and obtain SSO/System tokens. |
| POST | `/api/auth/switch` | SSO or System token | Obtain a system token for another entity. |
| POST | `/api/auth/validate` | SSO or System token | Validate a token. |
| POST | `/api/auth/logout` | System token | Revoke the selected system JWT and, if supplied, its SSO token. |
| POST | `/api/account/register` | None | Create an account and login record. |
| GET | `/api/account/profile` | SSO or System token | Get the current profile. |
| PUT | `/api/account/profile` | SSO or System token | Update the current profile names. |
| POST | `/api/account/change-password` | SSO or System token | Change the current password. |
| GET | `/api/businessentity` | SSO or System token | List business entities. |
| GET | `/api/businessentity/{id}` | SSO or System token | Get one business entity. |
| GET | `/api/businessentity/my-entities` | SSO or System token | List entities assigned to the caller. |
| GET | `/api/role` | SSO or System token | List roles. |
| GET | `/api/role/{id}` | SSO or System token | Get a role. |
| GET | `/api/role/account/{businessEntityId}` | SSO or System token | Get the caller's role for an entity. |

## Authentication endpoints

### `POST /api/auth/login`

Authenticates credentials and verifies the user has a role in the supplied business entity.

`password` may be either the normal password or the exact stored BCrypt hash. Normal passwords are verified with BCrypt.

Request:

```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!",
  "businessEntityId": 1
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "ssoToken": "eyJ...",
    "jwtToken": "eyJ...",
    "accountId": 42,
    "email": "user@example.com",
    "fullNameEn": "Jane Doe",
    "fullNameAr": "جين دو",
    "role": "Administrator",
    "businessEntityId": 1,
    "businessEntityName": "CAS",
    "redirectUrl": "https://cas.example.com",
    "ssoExpiresAt": "2026-08-11T18:00:00Z",
    "jwtCreatedAt": "2026-08-11T10:00:00Z",
    "jwtExpiresAt": "2026-08-11T11:00:00Z"
  }
}
```

`redirectUrl` is an empty string when the selected entity has no URL configured.

### `POST /api/auth/switch`

Uses an SSO or system token to obtain a new system token scoped to another entity to which the account is assigned.

Request headers:

```http
Authorization: Bearer {ssoOrJwtToken}
```

Request:

```json
{
  "businessEntityId": 2
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Token exchanged successfully.",
  "data": {
    "jwtToken": "eyJ...",
    "role": "Instructor",
    "businessEntityId": 2,
    "businessEntityName": "Learning Portal",
    "redirectUrl": "https://learning.example.com",
    "jwtCreatedAt": "2026-08-11T10:05:00Z",
    "jwtExpiresAt": "2026-08-11T11:05:00Z"
  }
}
```

### `POST /api/auth/validate`

Validates either an SSO or system JWT.

Request headers:

```http
Authorization: Bearer {token}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Token validation completed successfully.",
  "data": {
    "isValid": true,
    "isExpired": false,
    "tokenType": "System",
    "accountId": 42,
    "createdAt": "2026-08-11T10:00:00Z"
  }
}
```

For SSO tokens, `createdAt` is `null` because SSO tokens do not carry that claim.

### `POST /api/auth/logout`

Revokes the System JWT in the `Authorization` header only when its `BusinessEntityId` matches the requested business entity. If `ssoToken` is supplied, the matching SSO token is also revoked; when it is omitted, SSO is left unchanged. Other System JWTs remain valid.

Request headers:

```http
Authorization: Bearer {currentSystemJwt}
```

Request:

```json
{
  "businessEntityId": 2,
  "ssoToken": "eyJ..."
}
```

`ssoToken` is optional.

Success response (`200`):

```json
{
  "success": true,
  "message": "System logged out successfully.",
  "data": {
    "businessEntityId": 2,
    "ssoTokenRevoked": true,
    "jwtTokenRevoked": true
  }
}
```

Clients should remove only their own stored SSO and system-JWT values after this succeeds. Other systems' locally stored JWTs are not changed.

## Account endpoints

### `POST /api/account/register`

Creates an active `Account_Info` profile and associated login credentials.

```json
{
  "nationalId": "29801011234567",
  "email": "user@example.com",
  "password": "P@ssw0rd!",
  "confirmPassword": "P@ssw0rd!",
  "fullNameEn": "Jane Doe",
  "fullNameAr": "جين دو"
}
```

Success response (`201`):

```json
{
  "success": true,
  "message": "Account registered successfully.",
  "data": {
    "accountId": 42,
    "email": "user@example.com",
    "nationalId": "29801011234567",
    "phone": null,
    "city": null,
    "fullNameEn": "Jane Doe",
    "fullNameAr": "جين دو",
    "isActive": true,
    "createdAt": "2026-08-11",
    "statusId": 1,
    "statusName": "Active",
    "governoratesId": null,
    "governorateNameEn": null,
    "governorateNameAr": null
  }
}
```

### `GET /api/account/profile`

Accepts either a valid SSO or system token. The API reads the account ID from the validated token, confirms that its login/profile is active, then returns the same profile object shown in the registration response.

### `PUT /api/account/profile`

Requires an SSO or system token. The caller can update their names, phone number, and city. Identity, status, and other ID fields cannot be changed through this endpoint.

```json
{
  "fullNameEn": "Jane A. Doe",
  "fullNameAr": "جين أ. دو"
}
```

Include optional `phone` and `city` fields in the request; send `null` for either field to clear it. Success response (`200`) contains the updated profile object.

### `POST /api/account/change-password`

Requires an SSO or system token.

`currentPassword` may be either the normal password or the exact stored BCrypt hash. Normal passwords are verified with BCrypt.

```json
{
  "currentPassword": "P@ssw0rd!",
  "newPassword": "N3wP@ssw0rd!",
  "confirmPassword": "N3wP@ssw0rd!"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Password changed successfully.",
  "data": null
}
```

## Business entity endpoints

All business-entity endpoints accept an SSO or system token.

### `GET /api/businessentity`

Lists `Tbl_BusinessEntity` rows.

### `GET /api/businessentity/{id}`

Gets an entity by `Tbl_BusinessEntity.ID`.

### `GET /api/businessentity/my-entities`

Lists only entities assigned to the authenticated account.

Entity response example:

```json
{
  "success": true,
  "message": "Business entities retrieved successfully.",
  "data": [
    {
      "id": 1,
      "name": "CAS",
      "description": "CAS",
      "redirectUrl": "https://cas.example.com",
      "isActive": true
    }
  ]
}
```

`isActive` is currently returned as `true` because `Tbl_BusinessEntity` does not expose an active-status column.

## Role endpoints

All role endpoints accept an SSO or system token.

### `GET /api/role`

Lists all roles.

### `GET /api/role/{id}`

Gets a role by ID.

### `GET /api/role/account/{businessEntityId}`

Gets the authenticated account's role in the specified business entity.

Role response example:

```json
{
  "success": true,
  "message": "Role retrieved successfully.",
  "data": {
    "roleId": 3,
    "name": "Instructor",
    "description": "Learning Portal"
  }
}
```

## Business-entity resolution

`Tbl_BusinessEntity` provides the canonical entity data:

| Column | API use |
| --- | --- |
| `ID` | `businessEntityId` accepted by login, switch, and account-role endpoints. |
| `BusinessEntity` | Resolved name returned in responses and used to match existing `AccountRoles.BusinessEntityName`. |
| `URL` | Returned as `redirectUrl` and embedded in system JWTs. |
| `OrderNo` | Stored by the table but not currently returned or used by the API. |

This preserves compatibility with the existing `AccountRoles.BusinessEntityName` schema while ensuring client requests use the stable numeric entity ID.
