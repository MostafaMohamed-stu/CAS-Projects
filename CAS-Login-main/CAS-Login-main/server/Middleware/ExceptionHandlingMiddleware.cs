using CAS_Login_Back_End.Exceptions;
using CAS_Login_Back_End.Models.Common;
using System.Text.Json;

namespace CAS_Login_Back_End.Middleware;

/// <summary>
/// Global exception handling middleware.
/// Catches all application exceptions and returns standardized error responses.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception while processing {Method} {Path}", context.Request.Method, context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            UnauthorizedException ex => new
            {
                statusCode = StatusCodes.Status401Unauthorized,
                success = false,
                message = ex.Message,
                errors = (IReadOnlyCollection<string>?)null
            },
            NotFoundException ex => new
            {
                statusCode = StatusCodes.Status404NotFound,
                success = false,
                message = ex.Message,
                errors = (IReadOnlyCollection<string>?)null
            },
            ValidationException ex => new
            {
                statusCode = StatusCodes.Status400BadRequest,
                success = false,
                message = ex.Message,
                errors = (IReadOnlyCollection<string>?)ex.Errors
            },
            _ => new
            {
                statusCode = StatusCodes.Status500InternalServerError,
                success = false,
                message = context.RequestServices.GetService<IHostEnvironment>()?.IsDevelopment() == true
                    ? exception.Message
                    : "An internal server error occurred.",
                errors = (IReadOnlyCollection<string>?)null
            }
        };

        context.Response.StatusCode = response.statusCode;
        return context.Response.WriteAsJsonAsync(response);
    }
}

public static class ExceptionHandlingMiddlewareExtensions
{
    public static void AddExceptionHandlingMiddleware(this WebApplication app)
    {
        app.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
