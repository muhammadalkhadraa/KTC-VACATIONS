using Microsoft.EntityFrameworkCore;
using Npgsql;
using KtcBackend;

var builder = WebApplication.CreateBuilder(args);

// Enable legacy timestamp behavior to allow non-UTC DateTimes to be saved to 'timestamp with time zone' column
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// <-- register database context ------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<KtcContext>(options =>
{
    options.UseNpgsql(connectionString, x => x.MigrationsHistoryTable("__ef_migrations_history")
                                              .CommandTimeout(120))
           .UseSnakeCaseNamingConvention();
});
// -----------------------------------------------------------------------------

// Add services to the container.
// During local development we allow all origins so the browser is not blocked by Same-Origin Policy.
builder.Services.AddCors(options =>
    options.AddPolicy("AngularDev", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddControllers();
var app = builder.Build();

// Early CORS to handle preflight requests regardless of downstream errors
app.UseCors("AngularDev");



app.MapControllers();
app.Run();