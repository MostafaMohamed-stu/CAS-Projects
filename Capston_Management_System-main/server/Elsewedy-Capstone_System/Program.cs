using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services;
using Elsewedy_Capstone_System.Services.Interfaces;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<SchoolDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<RoleService>();
builder.Services.AddScoped<XssProtectionService>();
builder.Services.AddScoped<PasswordValidationService>();
builder.Services.AddScoped<LoginRateLimitService>();
builder.Services.AddScoped<RequestCounterService>();
builder.Services.AddMemoryCache();

builder.Services.AddScoped<IGradeService, GradeService>();
builder.Services.AddScoped<IWeekService, WeekService>();
builder.Services.AddScoped<IClassService, ClassService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IStudentExtensionService, StudentExtensionService>();
builder.Services.AddScoped<ITaskSubmissionService, TaskSubmissionService>();
builder.Services.AddScoped<IAccountTaskService, AccountTaskService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAccountService, AccountService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["Jwt:AccessTokenSecret"] ?? builder.Configuration["Jwt:Key"] ?? "tbV/kbyLRqqoDCKJVwksaKqE07GNPkOcFTX7LN96nkY=")),
            ValidateIssuer = true,
            ValidIssuers = new[] { builder.Configuration["Jwt:Issuer"] ?? "CAS.Api", "CAS.Api", "ElsewedyCapstoneSystem" },
            ValidateAudience = true,
            ValidAudiences = new[] { builder.Configuration["Jwt:Audience"] ?? "CAS.Clients", "CAS.Clients", "ElsewedyCapstoneSystem" },
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                if (context.Principal?.Identity is ClaimsIdentity identity)
                {
                    // Map "Role" / "role" claim to ClaimTypes.Role if ClaimTypes.Role doesn't exist
                    var roleClaim = identity.FindFirst("Role") ?? identity.FindFirst("role");
                    if (roleClaim != null && !identity.HasClaim(c => c.Type == ClaimTypes.Role))
                    {
                        identity.AddClaim(new Claim(ClaimTypes.Role, roleClaim.Value));
                    }

                    // Map "AccountId" / "accountId" / "sub" / "nameid" to ClaimTypes.NameIdentifier if needed
                    var accountIdClaim = identity.FindFirst("AccountId") ?? identity.FindFirst("accountId") ?? identity.FindFirst("sub") ?? identity.FindFirst("nameid");
                    if (accountIdClaim != null && !identity.HasClaim(c => c.Type == ClaimTypes.NameIdentifier))
                    {
                        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, accountIdClaim.Value));
                    }
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            key => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 100
            }));

    options.AddPolicy("global-fixed", context => RateLimitPartition.GetSlidingWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        key => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 300,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 100
        }));

    options.AddPolicy("strict-login", context => RateLimitPartition.GetSlidingWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        key => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 5,
            AutoReplenishment = true
        }));

    options.AddPolicy("simple-login", context => RateLimitPartition.GetSlidingWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        key => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 7,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0,
            AutoReplenishment = true
        }));

    options.AddPolicy("submissions", context => RateLimitPartition.GetSlidingWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        key => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 30,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 4,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 10
        }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers["Retry-After"] = "60";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            message = "Rate limit exceeded. Please try again later.",
            remainingRequests = 0,
            retryAfter = 60,
            isRateLimited = true
        }, cancellationToken: token);
    };
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Elsewedy Capstone API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:4200", "http://192.168.10.32:1003", "https://192.168.10.32:1003", "http://sewedycapstone.runasp.net", "https://sewedycapstone.runasp.net")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Add("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    context.Response.Headers.Add("Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    await next();
});

app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    try { await next(); }
    catch (Exception ex)
    {
        if (app.Environment.IsDevelopment())
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine($"Stack Trace: {ex.StackTrace}");
        }
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var errorResponse = app.Environment.IsDevelopment() 
            ? System.Text.Json.JsonSerializer.Serialize(new { message = ex.Message, details = ex.StackTrace })
            : System.Text.Json.JsonSerializer.Serialize(new { message = "An error occurred. Please try again later." });
        await context.Response.WriteAsync(errorResponse);
    }
});

app.MapControllers();
app.Run();
