using System.Text.Json;

namespace Kodedetektiv.Services;

/// <summary>
/// Lager en statisk kopi av spillet: alt i wwwroot, pluss historiene som stories.json.
/// GitHub Pages kan ikke kjøre .NET, så der leser spillet stories.json i stedet for /api/stories.
/// </summary>
public static class StaticExporter
{
    public static void Export(string webRoot, StoryRepository repository, string outputDir)
    {
        var output = Path.GetFullPath(outputDir);
        if (Directory.Exists(output))
            Directory.Delete(output, recursive: true);
        Directory.CreateDirectory(output);

        foreach (var file in Directory.GetFiles(webRoot, "*", SearchOption.AllDirectories))
        {
            var target = Path.Combine(output, Path.GetRelativePath(webRoot, file));
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target);
        }

        // Samme JSON-format som API-et returnerer (camelCase)
        var json = JsonSerializer.Serialize(repository.All, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        File.WriteAllText(Path.Combine(output, "stories.json"), json);

        // Hindrer at GitHub Pages behandler siden som et Jekyll-prosjekt
        File.WriteAllText(Path.Combine(output, ".nojekyll"), "");
    }
}
