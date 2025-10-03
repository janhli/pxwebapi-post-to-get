# PXWeb v0 → v2 (STRICT, forced base)

Denne varianten tvinger alltid basen til **v2** uansett hva du skriver i Host-feltet.
Base-URL bygges som:
```
https://<domene>/api/pxwebapi/v2/tables/<TABLE>/data?lang=<LANG>
```
Deretter legges `&valueCodes[Dim]=v1,v2,...` til i samme rekkefølge som i v0-POSTen.

## Bruk
1. Skriv/past **Domene** (f.eks. `https://data.ssb.no`). Paster du en hel gammel URL, trekker vi bare ut domenet.
2. Skriv **Tabell-ID** (f.eks. `09429`) og **Språk** (f.eks. `no`).
3. Lim inn PXWeb **v0 POST-JSON**.
4. Klikk **Konverter** → få eksakt v2-GET som ønsket.

## Eksakt format (garantert)
```
https://data.ssb.no/api/pxwebapi/v2/tables/09429/data?lang=no&valueCodes[Region]=3101,3103&valueCodes[Nivaa]=00,01,02a,11,03a,04a,09a&valueCodes[ContentsCode]=Personer&valueCodes[Tid]=2023,2024
```

## Notater
- `selection.filter` og andre felt ignoreres i v2-GET.
- Braketter i nøkler encodes **ikke**. Verdier encodes individuelt, adskilt med komma.
- Appen er helt statisk (ingen nettverkskall), så den kan hostes på GitHub Pages/DreamHost.
