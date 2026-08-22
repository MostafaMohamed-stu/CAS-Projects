using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using SchoolAdmission.Data;
using SchoolAdmission.Services;
using OfficeOpenXml;
using SchoolAdmission.Repos.IRepos;
using SchoolAdmission.Repos;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.DependencyInjection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Set EPPlus license context
ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

// Get configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var jwtKey = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is required."));
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CAS.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CAS.Clients";

builder.Services.AddDbContext<SchoolAdmissionDbContext>(options => options.UseSqlServer(connectionString));


builder.Services.AddScoped<IAdminRepo, AdminRepo>();
builder.Services.AddScoped(typeof(IGenericRepo<>), typeof(GenericRepo<>));
builder.Services.AddScoped<IAuthRepo, AuthRepo>();
builder.Services.AddScoped<IExamRepo, ExamRepo>();
builder.Services.AddScoped<IStudentRepo, StudentRepo>();
builder.Services.AddScoped<ISectionRepo, SectionRepo>();
builder.Services.AddScoped<AdmissionSettingsService>();

// Simple CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// CAS issues the shared system JWT used by Admission staff and coordinators.
builder.Services.AddAuthentication().AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
            RoleClaimType = "Role",
            NameClaimType = "Email"
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdmissionAdmin", policy => policy.RequireClaim(
        "Role", "Interviewer", "Board", "SuperAdmin", "StudentAffair"));
    options.AddPolicy("ReceptionCoordinator", policy => policy.RequireClaim(
        "Role", "ReceptionCoordinator"));
});
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "School Admission API", Version = "v1" });
});

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
startupLogger.LogInformation(
    "Environment: {Environment}. Exam and admission settings are loaded from versioned database configuration.",
    app.Environment.EnvironmentName);

// Middleware
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "School Admission API V1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
