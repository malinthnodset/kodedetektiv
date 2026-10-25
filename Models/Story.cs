namespace Kodedetektiv.Models;

/// <summary>En historie: fire saker som henger sammen, med intro og avslutning.</summary>
/// <param name="Difficulty">1 = lett, 2 = middels, 3 = vanskelig</param>
/// <param name="Hearts">Antall feil spilleren tåler før saken henlegges</param>
/// <param name="Base">Poeng per løst sak før trekk</param>
/// <param name="Sprite">Navnet på pixelart-figuren som vises i menyen</param>
public record Story(
    string Id,
    string Title,
    int Difficulty,
    int Hearts,
    int Base,
    string Sprite,
    string Tagline,
    List<string> Topics,
    List<string> Intro,
    List<string> Ending,
    List<Case> Cases);

/// <summary>Én sak: et vitne, en logg og en kodefil med en skyldig linje.</summary>
/// <param name="Lines">Kodelinjene som vises på «åstedet». Linjenummer starter på 1.</param>
/// <param name="Culprit">Linjen(e) som regnes som riktig svar</param>
/// <param name="Herrings">Hint som vises når spilleren anklager en bestemt feil linje</param>
/// <param name="Hint">Tipset bak hint-knappen</param>
public record Case(
    string Title,
    string Brief,
    string File,
    Witness Witness,
    string LogTitle,
    List<LogLine> Log,
    List<string> Lines,
    List<int> Culprit,
    Dictionary<int, string> Herrings,
    List<Motive> Motives,
    string Explain,
    string Fix,
    string After,
    string Hint);

public record Witness(string Who, string Text);

/// <param name="Kind">"" (feil), "info", "warn" eller "dim"</param>
public record LogLine(string Text, string Kind = "");

public record Motive(string Text, bool Correct);
