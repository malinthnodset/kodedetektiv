*Beskrivelse også laget av Claude*

# Kodedetektiv

Et feilsøkingsspill i pixelart-stil, laget med ASP.NET Core (.NET 10).

I stedet for å skrive kode for å komme videre, er du detektiv i Bugavdelingen. Hver sak har et vitne som beskriver problemet, en byggelogg eller serverlogg og en kodefil. Du må finne linjen som er skyldig og forklare motivet, altså *hvorfor* den feiler. Feil anklager koster hjerter, og Inspektør Bit gir deg et hint som er skrevet for akkurat den linjen du valgte.

## Beskrivelse

Kodedetektiv gjør feilsøking til et spill. De fleste kodespill ber deg skrive kode for å løse oppgaver. Kodedetektiv trener i stedet ferdigheten utviklere bruker mest tid på: å lese kode, tolke feilmeldinger og forstå hvorfor noe går galt.

Spillet har ni historier fordelt på tre vanskelighetsgrader, med fire saker hver:

- **Lett:** byggfeil som manglende semikolon, krøllparenteser og `name` mot `Name`. Kompilatoren sier fra, men peker ikke alltid på riktig sted.
- **Middels:** koden kjører, men gir feil svar. Eksempler er off-by-one, heltallsdivisjon, datoformat og strenger som ikke kan endres.
- **Vanskelig:** alt ser riktig ut, og feilen dukker bare opp under spesielle forhold. Eksempler er en manglende `await`, `static`-felt som deles, closures i løkker og heltallsoverflyt.

Etter hver løste sak forklarer spillet feilen og viser hvordan den rettes.

## Kjør appen

Krever [.NET 10 SDK](https://dotnet.microsoft.com/download) eller nyere.

```bash
dotnet run
```

Åpne http://localhost:5080 i nettleseren.

I VS Code: installer utvidelsen **C# Dev Kit**, åpne mappen og trykk **F5**.

## Publiser på GitHub Pages

GitHub Pages kan ikke kjøre en .NET-server. Derfor bruker `.github/workflows/pages.yml` selve .NET-appen til å validere historiene og lage en statisk versjon av spillet. Den statiske versjonen er alle filene i `wwwroot` pluss `stories.json`, og det er den som publiseres.

1. Lag et nytt repo på GitHub, og push innholdet i denne mappen til `main`. Prosjektfilen må ligge i roten av repoet.
2. Gå til **Settings → Pages** i repoet, og velg **GitHub Actions** under *Source*.
3. Hver push til `main` publiserer spillet på `https://<brukernavn>.github.io/<repo>/`. Du ser fremdriften under fanen **Actions**.

Du kan lage den statiske versjonen lokalt også:

```bash
dotnet run -- --export site
```

## Struktur

```
Kodedetektiv/
├── Program.cs                  Oppstart og API-endepunkter
├── Models/Story.cs             Story, Case, Witness, LogLine, Motive
├── Services/
│   ├── StoryRepository.cs      Leser historiene fra Data/Stories ved oppstart
│   ├── StoryValidator.cs       Sjekker at linjenumre, hint og motiver henger sammen
│   └── StaticExporter.cs       Lager den statiske versjonen for GitHub Pages
├── Data/Stories/*.json         Én fil per historie
├── .github/workflows/pages.yml Bygger og publiserer til GitHub Pages
└── wwwroot/
    ├── index.html
    ├── css/site.css
    └── js/game.js              Spillogikk og pixelart
```

### API

| Metode | Rute                 | Svar                                         |
|--------|----------------------|----------------------------------------------|
| GET    | `/api/stories`       | Alle historiene, sortert etter vanskelighetsgrad |
| GET    | `/api/stories/{id}`  | Én historie, eller 404                       |

## Legg til en ny historie

1. Kopier en av filene i `Data/Stories/` og gi den et nytt navn, for eksempel `2-4-minhistorie.json`. Tallene foran bestemmer rekkefølgen.
2. Gi den en ny `id`, og skriv sakene. Linjenumre starter på 1.
3. Start appen på nytt. `StoryValidator` stopper oppstarten med en tydelig feilmelding hvis en skyldig linje ikke finnes, et hint peker på feil linje eller en sak ikke har nøyaktig ett riktig motiv.

Tilgjengelige figurer (`sprite`): `bread`, `book`, `cat`, `ticket`, `dumbbell`, `tv`, `train`, `coin`, `rocket`.

## Lagring

Spillet har ingen database. Fremgangen lagres i nettleserens `localStorage`, så den blir værende på samme maskin og nettleser.
