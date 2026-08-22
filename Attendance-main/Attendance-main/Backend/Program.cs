using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AttendanceBehaviour_Backend.Interfaces;
using AttendanceBehaviour_Backend.Repos;
using AttendanceBehaviour_Backend.Models;
using AttendanceBehaviour_Backend.Data;
using AttendanceBehaviour_Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddDbContext<ElsewedySchoolContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("MyConnection")
    );

    // Enable sensitive data logging in development to help with debugging
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.LogTo(Console.WriteLine, LogLevel.Information);
    }
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>// to avoid circular reference
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin", policyBuilder =>
    {
        policyBuilder.WithOrigins(
            "http://localhost:3000",
            "https://localhost:3000",
            "https://192.168.10.32:1002",
            "http://192.168.10.32:1002",
            "http://127.0.0.1:61470",
            "https://127.0.0.1:61470",
            "http://127.0.0.1:59724",
            "https://127.0.0.1:59724",
            "http://127.0.0.1:55695",
            "https://127.0.0.1:55695",
            "http://127.0.0.1:53953",
            "https://127.0.0.1:53953",
            "https://attendance.sewedy.com.eg",
            "http://attendance.sewedy.com.eg")
                     .AllowAnyMethod()
                     .AllowAnyHeader()
                     .AllowCredentials();
    });
});

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
//builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<EmailService>();
// StudentProfile repository removed — consolidated to StudentExtension/StudentExtensions
builder.Services.AddScoped<IGradeRepository, GradeRepository>();
builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IAbsenceRepository, AbsenceRepository>();
builder.Services.AddScoped<IStaffRepository, StaffRepository>();
builder.Services.AddSingleton<INotificationFileStore, NotificationFileStore>();
builder.Services.AddSingleton<IPushSubscriptionStore, PushSubscriptionFileStore>();
builder.Services.AddSingleton<IFcmTokenStore, FcmTokenFileStore>();
builder.Services.AddSingleton<IPushSender, WebPushSender>();
builder.Services.AddSingleton<IFcmSender, FcmSender>();
builder.Services.AddSingleton<IAttendanceSubmissionStore, AttendanceSubmissionFileStore>();

builder.Services.AddScoped<IJwtService>(provider =>
    new JwtService(builder.Configuration["Jwt:Key"]));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
            // CAS tokens use custom claim names instead of the default long URIs
            NameClaimType = "AccountId",
            RoleClaimType = "Role"
        };
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowSpecificOrigin");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
