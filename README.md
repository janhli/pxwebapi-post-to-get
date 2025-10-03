# PXWeb v0 → v2 (autofill + strict v2 base)

Statisk app som:
1) **Autofyller** domene, tabell-ID og språk fra en v0-URL eller cURL
2) Konverterer PXWeb **v0 POST**-JSON → **v2 GET**-URL i eksakt format

## Eksakt v2-format
```
https://<domene>/api/pxwebapi/v2/tables/<TABLE>/data?lang=<LANG>&valueCodes[Dim]=v1,v2,...
```

## Bruk
1. (Valgfritt) Lim inn en **v0-URL eller cURL** i feltet og klikk **Autofyll**.
2. Sjekk/endre **Domene**, **Tabell-ID** og **Språk**.
3. Lim inn **PXWeb v0 POST-JSON** i feltet.
4. Klikk **Konverter** → kopier eller åpne resultatet.

### Hva oppdages fra URL/cURL?
- **Domene** (kun protocoll + hostname + ev. port)
- **Språk** (`?lang=` eller et språksegment i path, f.eks. `/no/`, `/en/`)
- **Tabell-ID**: finner `tables/<id>` eller nærmeste token som ligner en tabell-id (`07459`, `09429`, osv.).
  Faller tilbake til query-parametere `table`, `tableId` eller `id`.

### Hva garanteres i konvertering?
- Base-URL bygges **alltid** som v2: `.../api/pxwebapi/v2/tables/<TABLE>/data?lang=<LANG>`
- Etter `lang` kommer kun `valueCodes[Dim]=csv` for hver dimensjon i rekkefølge
- `selection.filter` og andre felter ignoreres i GET
- Braketter i nøklene encodes ikke, verdier encodes individuelt og separeres med komma

## Hosting
Helt statisk – kan hostes på GitHub Pages eller DreamHost.

## Lisens
MIT
