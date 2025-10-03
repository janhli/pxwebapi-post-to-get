# POST → GET Converter (SSB PXWeb)

En statisk app som konverterer PXWeb POST-body (SSB) til en GET-URL med `valueCodes[Dim]=verdier`.
Ingen server – alt skjer i nettleseren.

## Bruk
1. Lim inn **base-URL** (inkludér gjerne `?lang=no`), f.eks.  
   `https://data.ssb.no/api/pxwebapi/v2/tables/09429/data?lang=no`
2. Lim inn **PXWeb POST-body** som JSON (eller en cURL-linje med `-d`).
3. Trykk **Konverter** → du får en GET-URL med `valueCodes[...]`-parametre.
4. Bruk **Kopier** eller **Åpne i ny fane**.

### Hva oppdages automatisk?
- Strukturen `{ "query": [ { "code": "...",
  "selection": { "values": [...] } }, ... ] }` → **PXWeb-modus**.
- `selection.filter` brukes ikke i GET (bare `values`). Rekkefølgen bevares.
- Andre formater (form-encoded/vanlig JSON) støttes som **fallback**.

## Eksempel
**Input (POST-body):**
```json
{
  "query": [
    {
      "code": "Region",
      "selection": {
        "filter": "agg_single:KommGjeldende",
        "values": ["3101","3103"]
      }
    },
    {
      "code": "Nivaa",
      "selection": { "filter": "item", "values": ["00","01","02a","11","03a","04a","09a"] }
    },
    {
      "code": "ContentsCode",
      "selection": { "filter": "item", "values": ["Personer"] }
    },
    {
      "code": "Tid",
      "selection": { "filter": "item", "values": ["2023","2024"] }
    }
  ],
  "response": { "format": "json-stat2" }
}
```

**Base-URL:**
```
https://data.ssb.no/api/pxwebapi/v2/tables/09429/data?lang=no
```

**Output (GET-URL):**
```
https://data.ssb.no/api/pxwebapi/v2/tables/09429/data?lang=no&valueCodes[Region]=3101,3103&valueCodes[Nivaa]=00,01,02a,11,03a,04a,09a&valueCodes[ContentsCode]=Personer&valueCodes[Tid]=2023,2024
```

## Publisering (GitHub Pages)
1. Opprett et nytt public repo på GitHub (f.eks. `post-to-get`).
2. Legg filene `index.html`, `styles.css`, `main.js`, `.nojekyll`, `README.md` i rot.
3. Repo → **Settings → Pages** → **Deploy from a branch** (`main` / `/root`). Vent 1–2 min.
4. Besøk `https://<brukernavn>.github.io/post-to-get/`

## Lokal test
Dobbeltklikk `index.html` (ingen server nødvendig).

## Lisens
MIT
