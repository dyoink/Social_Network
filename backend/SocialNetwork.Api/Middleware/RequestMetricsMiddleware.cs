using System.Collections.Concurrent;
using System.Diagnostics;

namespace SocialNetwork.Api.Middleware;

/// <summary>
/// Middleware theo dõi số lượng request, response time, status code distribution.
/// Lưu metrics trong memory (singleton service).
/// </summary>
public class RequestMetricsMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ServerMetricsService metrics)
    {
        metrics.IncrementActiveConnections();
        var sw = Stopwatch.StartNew();

        try
        {
            await next(context);
        }
        finally
        {
            sw.Stop();
            metrics.DecrementActiveConnections();
            metrics.RecordRequest(context.Request.Method, context.Response.StatusCode, sw.ElapsedMilliseconds);
        }
    }
}

/// <summary>
/// Singleton service lưu trữ server metrics trong memory.
/// Thread-safe nhờ Interlocked và ConcurrentDictionary.
/// </summary>
public class ServerMetricsService
{
    private long _totalRequests;
    private long _activeConnections;
    private long _totalResponseTimeMs;
    private readonly DateTime _startTime = DateTime.UtcNow;

    // Status code distribution
    private readonly ConcurrentDictionary<int, long> _statusCodes = new();

    // Method distribution
    private readonly ConcurrentDictionary<string, long> _methods = new();

    // Request per minute tracking (sliding window 60 phút)
    private readonly ConcurrentQueue<DateTime> _requestTimestamps = new();

    // Response time buckets cho histogram
    private long _under50Ms;
    private long _under200Ms;
    private long _under500Ms;
    private long _under1000Ms;
    private long _over1000Ms;

    public void IncrementActiveConnections() => Interlocked.Increment(ref _activeConnections);
    public void DecrementActiveConnections() => Interlocked.Decrement(ref _activeConnections);

    public void RecordRequest(string method, int statusCode, long responseTimeMs)
    {
        Interlocked.Increment(ref _totalRequests);
        Interlocked.Add(ref _totalResponseTimeMs, responseTimeMs);

        _statusCodes.AddOrUpdate(statusCode, 1, (_, count) => count + 1);
        _methods.AddOrUpdate(method, 1, (_, count) => count + 1);

        _requestTimestamps.Enqueue(DateTime.UtcNow);

        // Phân loại response time
        if (responseTimeMs < 50) Interlocked.Increment(ref _under50Ms);
        else if (responseTimeMs < 200) Interlocked.Increment(ref _under200Ms);
        else if (responseTimeMs < 500) Interlocked.Increment(ref _under500Ms);
        else if (responseTimeMs < 1000) Interlocked.Increment(ref _under1000Ms);
        else Interlocked.Increment(ref _over1000Ms);

        // Cleanup timestamps cũ hơn 60 phút
        var cutoff = DateTime.UtcNow.AddHours(-1);
        while (_requestTimestamps.TryPeek(out var ts) && ts < cutoff)
            _requestTimestamps.TryDequeue(out _);
    }

    public ServerMetricsSnapshot GetSnapshot()
    {
        var process = Process.GetCurrentProcess();
        var now = DateTime.UtcNow;
        var totalReqs = Interlocked.Read(ref _totalRequests);
        var totalRespTime = Interlocked.Read(ref _totalResponseTimeMs);

        // Request per minute (RPM) — lấy số request trong 1 phút gần nhất
        var oneMinAgo = now.AddMinutes(-1);
        var recentRequests = _requestTimestamps.Count(ts => ts >= oneMinAgo);

        // Request per minute cho 60 phút gần nhất (cho biểu đồ)
        var rpmHistory = new List<RpmDataPoint>();
        for (int i = 59; i >= 0; i--)
        {
            var minuteStart = now.AddMinutes(-i - 1);
            var minuteEnd = now.AddMinutes(-i);
            var count = _requestTimestamps.Count(ts => ts >= minuteStart && ts < minuteEnd);
            rpmHistory.Add(new RpmDataPoint
            {
                Minute = minuteEnd.ToString("HH:mm"),
                Count = count
            });
        }

        return new ServerMetricsSnapshot
        {
            Uptime = now - _startTime,
            TotalRequests = totalReqs,
            ActiveConnections = Interlocked.Read(ref _activeConnections),
            RequestsPerMinute = recentRequests,
            AvgResponseTimeMs = totalReqs > 0 ? totalRespTime / (double)totalReqs : 0,

            MemoryUsedMb = process.WorkingSet64 / (1024.0 * 1024.0),
            GcGen0Collections = GC.CollectionCount(0),
            GcGen1Collections = GC.CollectionCount(1),
            GcGen2Collections = GC.CollectionCount(2),
            GcTotalMemoryMb = GC.GetTotalMemory(false) / (1024.0 * 1024.0),
            ThreadCount = process.Threads.Count,

            StatusCodes = _statusCodes.ToDictionary(kvp => kvp.Key, kvp => kvp.Value),
            Methods = _methods.ToDictionary(kvp => kvp.Key, kvp => kvp.Value),

            ResponseTimeHistogram = new ResponseTimeHistogram
            {
                Under50Ms = Interlocked.Read(ref _under50Ms),
                Under200Ms = Interlocked.Read(ref _under200Ms),
                Under500Ms = Interlocked.Read(ref _under500Ms),
                Under1000Ms = Interlocked.Read(ref _under1000Ms),
                Over1000Ms = Interlocked.Read(ref _over1000Ms),
            },

            RpmHistory = rpmHistory,

            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            DotNetVersion = Environment.Version.ToString(),
            OsPlatform = System.Runtime.InteropServices.RuntimeInformation.OSDescription,
            ProcessorCount = Environment.ProcessorCount,
            ServerTime = now,
        };
    }
}

public class ServerMetricsSnapshot
{
    public TimeSpan Uptime { get; set; }
    public long TotalRequests { get; set; }
    public long ActiveConnections { get; set; }
    public int RequestsPerMinute { get; set; }
    public double AvgResponseTimeMs { get; set; }

    public double MemoryUsedMb { get; set; }
    public double GcTotalMemoryMb { get; set; }
    public int GcGen0Collections { get; set; }
    public int GcGen1Collections { get; set; }
    public int GcGen2Collections { get; set; }
    public int ThreadCount { get; set; }

    public Dictionary<int, long> StatusCodes { get; set; } = [];
    public Dictionary<string, long> Methods { get; set; } = [];
    public ResponseTimeHistogram ResponseTimeHistogram { get; set; } = new();
    public List<RpmDataPoint> RpmHistory { get; set; } = [];

    public string Environment { get; set; } = "";
    public string DotNetVersion { get; set; } = "";
    public string OsPlatform { get; set; } = "";
    public int ProcessorCount { get; set; }
    public DateTime ServerTime { get; set; }
}

public class ResponseTimeHistogram
{
    public long Under50Ms { get; set; }
    public long Under200Ms { get; set; }
    public long Under500Ms { get; set; }
    public long Under1000Ms { get; set; }
    public long Over1000Ms { get; set; }
}

public class RpmDataPoint
{
    public string Minute { get; set; } = "";
    public int Count { get; set; }
}
