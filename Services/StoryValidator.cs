using Kodedetektiv.Models;

namespace Kodedetektiv.Services;

/// <summary>
/// Sjekker at en historie henger sammen: at skyldige linjer og hint peker på linjer
/// som finnes, og at hver sak har nøyaktig ett riktig motiv.
/// </summary>
public static class StoryValidator
{
    public static IEnumerable<string> Validate(Story story)
    {
        if (string.IsNullOrWhiteSpace(story.Id))
            yield return "historien mangler id";

        if (story.Difficulty is < 1 or > 3)
            yield return $"difficulty må være 1, 2 eller 3 (er {story.Difficulty})";

        if (story.Hearts < 1)
            yield return "hearts må være minst 1";

        if (story.Cases.Count == 0)
            yield return "historien har ingen saker";

        for (var i = 0; i < story.Cases.Count; i++)
        {
            var c = story.Cases[i];
            var where = $"sak {i + 1} («{c.Title}»)";
            var lineCount = c.Lines.Count;

            if (c.Culprit.Count == 0)
                yield return $"{where}: mangler skyldig linje";

            foreach (var line in c.Culprit.Where(l => l < 1 || l > lineCount))
                yield return $"{where}: skyldig linje {line} finnes ikke (filen har {lineCount} linjer)";

            foreach (var line in c.Herrings.Keys)
            {
                if (line < 1 || line > lineCount)
                    yield return $"{where}: hint for linje {line}, som ikke finnes";
                if (c.Culprit.Contains(line))
                    yield return $"{where}: linje {line} er både skyldig og har et villedende hint";
            }

            var correct = c.Motives.Count(m => m.Correct);
            if (correct != 1)
                yield return $"{where}: må ha nøyaktig ett riktig motiv (har {correct})";

            if (string.IsNullOrWhiteSpace(c.Hint))
                yield return $"{where}: mangler hint";
        }
    }
}
