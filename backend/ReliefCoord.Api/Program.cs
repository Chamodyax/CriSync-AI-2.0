using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ReliefCoord.Api.Security;
using ReliefCoord.Application.Interfaces;
using ReliefCoord.Application.Services;
using ReliefCoord.Application.Strategies;
using ReliefCoord.Infrastructure.ExternalServices;
using ReliefCoord.Infrastructure.Messaging;
using ReliefCoord.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AI-Powered Humanitarian Crisis Management & Aid Coordination API",
        Version = "v1.0",
        Description = "SE205.3 Software Architecture Multi-Organisation Humanitarian Operations Platform"
    });

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
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

string dbProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
builder.Services.AddDbContext<ReliefCoordDbContext>(options =>
{
    if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServerConnection"));
    }
    else if (dbProvider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseInMemoryDatabase("ReliefCoordTestDb");
    }
    else
    {
        options.UseSqlite(builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=reliefcoord_platform.db");
    }
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IConfiguration, IHostEnvironment>((options, configuration, environment) =>
    {
        string jwtKey = JwtConfigurationHelper.ResolveSigningKey(configuration, environment);
        string jwtIssuer = configuration["Jwt:Issuer"] ?? "ReliefCoordApi";
        string jwtAudience = configuration["Jwt:Audience"] ?? "ReliefCoordClients";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

string[] configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173" };

bool isProductionEnv = builder.Environment.IsProduction();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (isProductionEnv)
        {
            policy.WithOrigins(configuredOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.SetIsOriginAllowed(origin =>
            {
                if (configuredOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                {
                    return true;
                }
                if (Uri.TryCreate(origin, UriKind.Absolute, out Uri? uri) &&
                    uri.Scheme == Uri.UriSchemeHttps &&
                    (uri.Host.EndsWith(".ngrok-free.app", StringComparison.OrdinalIgnoreCase) ||
                     uri.Host.EndsWith(".ngrok-free.dev", StringComparison.OrdinalIgnoreCase) ||
                     uri.Host.EndsWith(".ngrok.io", StringComparison.OrdinalIgnoreCase)))
                {
                    return true;
                }
                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
        }
    });
});

bool isTestingEnv = builder.Environment.IsEnvironment("Testing");
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "local",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = isTestingEnv ? 1000 : 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "local",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = isTestingEnv ? 5000 : 300,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

builder.Services.AddHttpClient();
builder.Services.AddSingleton<IServiceResilienceMonitor, ServiceResilienceMonitor>();
builder.Services.AddSingleton<IGovernanceConfigProvider, GovernanceConfigProvider>();
builder.Services.AddSingleton<InMemoryDomainEventQueue>();
builder.Services.AddSingleton<IDomainEventPublisher>(sp => sp.GetRequiredService<InMemoryDomainEventQueue>());
builder.Services.AddHostedService<AsynchronousDomainEventWorker>();

builder.Services.AddScoped<IUnitOfWork, EfUnitOfWork>();
builder.Services.AddScoped<IMappingProviderService, ResilientMappingProviderService>();
builder.Services.AddScoped<IAiProviderFactory, AiProviderFactory>();
builder.Services.AddScoped<INotificationChannelFactory, NotificationChannelFactory>();

builder.Services.AddScoped<IResourceAllocationStrategy, MultiConstraintOptimalStrategy>();
builder.Services.AddScoped<IResourceAllocationStrategy, ShortageProportionalContentionStrategy>();
builder.Services.AddScoped<IResourceAllocationStrategy, ProximityFirstStrategy>();
builder.Services.AddScoped<ResourceAllocationStrategyResolver>();

builder.Services.AddScoped<HumanitarianOperationsService>();
builder.Services.AddSingleton<JwtTokenGenerator>();

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
        var exception = exceptionFeature?.Error;

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = exception switch
        {
            UnauthorizedAccessException => StatusCodes.Status403Forbidden,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            InvalidOperationException => StatusCodes.Status409Conflict,
            ArgumentException => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };

        await context.Response.WriteAsJsonAsync(new
        {
            error = exception?.GetType().Name ?? "Error",
            message = exception?.Message ?? "An unexpected error occurred."
        });
    });
});

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseHttpsRedirection();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ReliefCoordDbContext>();
    await DatabaseSeeder.EnsureCleanProductionDatabaseAsync(db);
}

app.Run();

public partial class Program { }
