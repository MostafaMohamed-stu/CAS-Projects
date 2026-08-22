## Repo quick-start for AI coding agents

This file helps an AI coding agent become productive quickly in the AttendanceBehaviour-Backend (.NET 7+ Web API).

### Big picture / architecture
- Single ASP.NET Core Web API project: `AttendanceBehaviour-Backend/` (solution and .csproj in repo root).
- Data layer: `Data/ElsewedySchoolContext.cs` — EF Core DbContext, many DbSet<> mapping and model configuration (collation: `Arabic_100_CI_AI`).
- Repositories & DI: Interfaces live in `Interfaces/` and concrete implementations in `Repos/` (registered in `Program.cs`). Example: `IUserRepository` -> `UserRepository`.
- Services: small services (JwtService, EmailService) are registered in `Program.cs`. `IJwtService` is constructed with the JWT key from config.
- API surface: controllers under `Controllers/` (e.g., `AttendanceController.cs`, `AuthController.cs`) receive repository services and `ILogger<T>` via constructor injection. Routes follow `api/[controller]`.
- DTOs: input/output models in `DTOs/` — controllers accept DTOs, validate ModelState, and call repository async methods.
- DB migrations & SQL: generated migrations under `Migrations/` and helper SQL in `Sql Files/`.

### Key patterns & conventions (do not invent alternatives)
- DI: All repositories/services are registered in `Program.cs`. When a constructor requires an `ILogger<T>` (e.g., `StudentProfileRepository`), the code sometimes registers the implementation via a factory to inject the logger — preserve that pattern when adding similar classes.
- Controllers always validate `ModelState` and return structured JSON with `message` and optional `errors` or `stackTrace`. Mirror this shape for consistency when adding endpoints.
- Date handling: controllers commonly use `.Date` on DateTime query params (e.g., `GetDailyAttendanceReport`) — prefer passing/expecting date-only semantics where appropriate.
- JSON options: System.Text.Json is configured in `Program.cs` to ignore cycles and nulls (see `AddJsonOptions`) — avoid introducing serialization behavior that conflicts with these settings.
- Logging: Console + Debug providers enabled in `Program.cs`. Use `ILogger<T>` for runtime diagnostics and follow existing log message shapes used in controllers.

### Config & secrets
- Configuration files: `appsettings.json`, `appsettings.Development.json`, `appsettings.Production.json`. Connection string key: `ConnectionStrings:MyConnection`.
- JWT: `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` are read from configuration and used by a symmetric key (see `Program.cs` and `JwtService`).
- Email settings: `EmailSettings` exist in config; passwords in the repo are placeholders — prefer using environment variables or secret store in real deployments.

### Build, run & common workflows (developer commands)
- Build the project from the project root (where the `.csproj` lives):
  - dotnet build -c Debug
  - dotnet run --configuration Debug
- Run with Development environment to enable Swagger & sensitive EF logging:
  - set ASPNETCORE_ENVIRONMENT=Development; dotnet run
- EF Core migrations (if you need to add/change migrations): run these commands from the project folder (requires dotnet-ef):
  - dotnet ef migrations add <Name>
  - dotnet ef database update
- Database scripts: manual SQL helpers are under `Sql Files/` (e.g., `AddStudents.sql`, `UpdateStudentProfileJsonColumns.sql`). Check them before running against production.

### Integration points & external dependencies
- SQL Server: `MyConnection` points to SQL Server. `ElsewedySchoolContext.OnConfiguring` contains a fallback connection but production uses `Program.cs` configuration.
- Authentication: JWT bearer authentication configured in `Program.cs`. Tokens validated against `Jwt` config.
- Email: SMTP configured in `appsettings.*` but values may be placeholders.

### File examples to consult when implementing changes
- Startup / composition root: `Program.cs` (registers DI, CORS, JSON options, authentication).
- EF mapping and DB rules: `Data/ElsewedySchoolContext.cs` (collation, default values, relationships).
- Typical controller example: `Controllers/AttendanceController.cs` (ModelState validation, logging, error payloads, DTO usage).
- DTOs: `DTOs/SaveAttendanceDto.cs`, `DTOs/UpdateAttendanceDto.cs`, `DTOs/NoteInputModel.cs` (follow shape when creating new endpoints).

### What to avoid / watchouts
- Do not hard-code connection strings or secrets into files — this repo already has connection strings in `appsettings.Production.json`; prefer env vars or secret manager for changes.
- Avoid changing JSON serializer settings without cross-checking `Program.cs`; client expectations assume current behavior (ignore nulls, ignore cycles).
- When modifying repository constructors, keep DI registrations in `Program.cs` in sync (some repos require factories for logger injection).

### Quick checklist for PRs an AI agent might create
- Update `Program.cs` DI registrations if you add a repository/service.
- Add DTOs to `DTOs/` and ensure ModelState validation is applied in controllers.
- Add/update EF migrations only when models or `ElsewedySchoolContext` change; include migration files under `Migrations/`.
- Run `dotnet build` locally and ensure app runs (Development env to get Swagger) before requesting a review.

If any part of this guidance is unclear or you want me to expand examples (e.g., exact DI registration snippets, a sample migration, or a small unit test), tell me which area and I'll iterate. 
