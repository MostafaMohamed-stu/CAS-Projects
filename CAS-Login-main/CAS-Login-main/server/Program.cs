using CAS_Login_Back_End.Data;
using CAS_Login_Back_End.Models.Common;
using CAS_Login_Back_End.Models.Configuration;
using CAS_Login_Back_End.Middleware;
using CAS_Login_Back_End.Services.Accounts;
using CAS_Login_Back_End.Services.Authentication;
using CAS_Login_Back_End.Services.BusinessEntities;
using CAS_Login_Back_End.Services.Interfaces;
using CAS_Login_Back_End.Services.Roles;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Threading.RateLimiting;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(
                "https://login.sewedy.com.eg",
                "https://www.login.sewedy.com.eg",
                "https://192.168.10.32",
                "http://192.168.10.32",
                "https://localhost",
                "http://localhost")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddOptions<JwtOptions>()
    .BindConfiguration(JwtOptions.SectionName)
    .Validate(options =>
        !string.IsNullOrWhiteSpace(options.Key) &&
        !string.IsNullOrWhiteSpace(options.Issuer) &&
        !string.IsNullOrWhiteSpace(options.Audience) &&
        options.ExpirationMinutes > 0 &&
        options.SsoExpirationHours > 0,
        "JWT settings must include Key, Issuer, Audience, and positive token lifetimes.")
    .ValidateOnStart();

builder.Services.AddOptions<LoginRateLimitOptions>()
    .BindConfiguration(LoginRateLimitOptions.SectionName)
    .Validate(options =>
        options.MaxRequests > 0 && options.Window > TimeSpan.Zero,
        "Login rate limit settings must include a positive maximum request count and window.")
    .ValidateOnStart();

builder.Services.Configure<ForwardedHeadersOptions>(
    builder.Configuration.GetSection("ForwardedHeaders"));

var loginRateLimitOptions = builder.Configuration
    .GetSection(LoginRateLimitOptions.SectionName)
    .Get<LoginRateLimitOptions>()
    ?? throw new InvalidOperationException("Login rate limit settings are missing.");

builder.Services.AddRateLimiter(options =>
{
    options.OnRejected = async (context, cancellationToken) =>
    {
        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("LoginRateLimiting");

        logger.LogWarning(
            "Login request rate limit exceeded for client IP {ClientIp} on {Path}.",
            context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            context.HttpContext.Request.Path);

        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                Math.Ceiling(retryAfter.TotalSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
        }

        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse<object?>.FailureResponse("Too many login attempts. Please try again later."),
            cancellationToken);
    };

    options.AddPolicy("login", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(
            clientIp,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = loginRateLimitOptions.MaxRequests,
                Window = loginRateLimitOptions.Window,
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
        BearerFormat = "JWT",
        Description = "Paste a system JWT token. Swagger adds the Bearer prefix automatically."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference(
            JwtBearerDefaults.AuthenticationScheme,
            document,
            null)] = []
    });
});

builder.Services.AddDbContext<CasDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtKey = builder.Configuration["JWT:Key"]
    ?? throw new InvalidOperationException("JWT:Key is missing.");

var jwtIssuer = builder.Configuration["JWT:Issuer"]
    ?? throw new InvalidOperationException("JWT:Issuer is missing.");

var jwtAudience = builder.Configuration["JWT:Audience"]
    ?? throw new InvalidOperationException("JWT:Audience is missing.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),

            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,

            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                var tokenId = context.Principal?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value
                    ?? context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.SerialNumber)?.Value;

                var tokenRevocationService = context.HttpContext.RequestServices
                    .GetRequiredService<ITokenRevocationService>();

                if (!string.IsNullOrWhiteSpace(tokenId) && tokenRevocationService.IsRevoked(tokenId))
                    context.Fail("Token has been revoked.");

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CasToken", policy =>
    {
        policy.AuthenticationSchemes.Add(JwtBearerDefaults.AuthenticationScheme);
        policy.RequireAuthenticatedUser();
        policy.RequireClaim("TokenType", "SSO", "System");
    });
});

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddSingleton<ITokenRevocationService, TokenRevocationService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IAccountIdentityService, AccountIdentityService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IBusinessEntityService, BusinessEntityService>();
builder.Services.AddScoped<IBusinessEntityAuthorizationService, BusinessEntityAuthorizationService>();

var app = builder.Build();

app.AddExceptionHandlingMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Forwarded headers are honored only from the trusted proxies/networks configured above.
app.UseForwardedHeaders();
app.UseCors("FrontendPolicy");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
