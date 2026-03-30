namespace SocialNetwork.Api.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }

        public static ApiResponse<T> Ok(T data, string? message = null) =>
            new() { Success = true, Data = data, Message = message };

        public static ApiResponse<T> Fail(string message) =>
            new() { Success = false, Message = message };
    }

    // Dùng khi không cần trả data (VD: delete, mark-as-read)
    public class ApiResponse : ApiResponse<object>
    {
        public static ApiResponse Ok(string? message = null) =>
            new() { Success = true, Message = message };

        public new static ApiResponse Fail(string message) =>
            new() { Success = false, Message = message };
    }
}
