using Kodedetektiv.Services;

var builder = WebApplication.CreateBuilder(args);

// Historiene lastes og valideres én gang ved oppstart.
builder.Services.AddSingleton<StoryRepository>();

var app = builder.Build();

// Tving lasting ved oppstart, så en feil i en JSON-fil stopper appen med en tydelig melding.
var repository = app.Services.GetRequiredService<StoryRepository>();
app.Logger.LogInformation("Lastet {Count} historier med totalt {Cases} saker",
    repository.All.Count, repository.All.Sum(s => s.Cases.Count));

// dotnet run -- --export site
// Lager en statisk versjon av spillet (for GitHub Pages) i stedet for å starte serveren.
if (app.Configuration["export"] is { Length: > 0 } exportDir)
{
    StaticExporter.Export(app.Environment.WebRootPath, repository, exportDir);
    app.Logger.LogInformation("Statisk side skrevet til {Dir}", Path.GetFullPath(exportDir));
    return;
}

app.UseDefaultFiles();   // serverer wwwroot/index.html på "/"
app.UseStaticFiles();    // css, js

var api = app.MapGroup("/api/stories");

// Alle historiene, sortert etter vanskelighetsgrad
api.MapGet("/", (StoryRepository repo) => repo.All);

// Én historie
api.MapGet("/{id}", (string id, StoryRepository repo) =>
    repo.Find(id) is { } story ? Results.Ok(story) : Results.NotFound());

app.Run();
