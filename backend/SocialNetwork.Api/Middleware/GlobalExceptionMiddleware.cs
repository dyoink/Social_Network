using SocialNetwork.Api.Common;
using System.Net;
using System.Text.Json;

namespace SocialNetwork.Api.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
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
                _logger.LogError(ex, "Unhandled exception tại {Path}: {Message}",
                    context.Request.Path, ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var (statusCode, message) = exception switch
            {
                KeyNotFoundException ex     => ((int)HttpStatusCode.NotFound, ex.Message),
                UnauthorizedAccessException ex => ((int)HttpStatusCode.Forbidden, ex.Message),
                InvalidOperationException ex => ((int)HttpStatusCode.BadRequest, ex.Message),
                _ => ((int)HttpStatusCode.InternalServerError, "Có lỗi xảy ra phía server. Vui lòng thử lại sau.")
            };

            context.Response.StatusCode = statusCode;

            var response = ApiResponse.Fail(message);

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}
