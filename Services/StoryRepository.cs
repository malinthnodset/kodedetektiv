using System.Text.Json;
using Kodedetektiv.Models;

namespace Kodedetektiv.Services;

/// <summary>
/// Leser alle historiene fra Data/Stories/*.json ved oppstart.
/// Legg til en ny historie ved å legge en ny JSON-fil i mappen.
/// </summary>
public class StoryRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true
    };

    private readonly Dictionary<string, Story> _byId;

    public IReadOnlyList<Story> All { get; }

    public StoryRepository(IWebHostEnvironment env, ILogger<StoryRepository> logger)
    {
        var folder = Path.Combine(env.ContentRootPath, "Data", "Stories");
        if (!Directory.Exists(folder))
            throw new DirectoryNotFoundException($"Fant ikke mappen med historier: {folder}");

        var stories = new List<Story>();
        var errors = new List<string>();

        foreach (var path in Directory.GetFiles(folder, "*.json").Order())
        {
            Story? story;
            try
            {
                story = JsonSerializer.Deserialize<Story>(File.ReadAllText(path), JsonOptions);
            }
            catch (JsonException ex)
            {
                errors.Add($"{Path.GetFileName(path)}: ugyldig JSON ({ex.Message})");
                continue;
            }

            if (story is null)
            {
                errors.Add($"{Path.GetFileName(path)}: filen er tom");
                continue;
            }

            errors.AddRange(StoryValidator.Validate(story).Select(e => $"{Path.GetFileName(path)}: {e}"));
            stories.Add(story);
        }

        var duplicates = stories.GroupBy(s => s.Id).Where(g => g.Count() > 1).Select(g => g.Key);
        errors.AddRange(duplicates.Select(id => $"Id-en «{id}» brukes av flere historier"));

        if (errors.Count > 0)
            throw new InvalidOperationException("Feil i historiene:\n" + string.Join("\n", errors));

        All = stories
            .OrderBy(s => s.Difficulty)
            .ToList();
        _byId = All.ToDictionary(s => s.Id);

        logger.LogDebug("Historier: {Ids}", string.Join(", ", _byId.Keys));
    }

    public Story? Find(string id) => _byId.GetValueOrDefault(id);
}
