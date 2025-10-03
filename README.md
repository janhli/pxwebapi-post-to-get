# POST → GET Converter (static site)

En superenkel **statisk** app som konverterer POST-body (form-encoded, JSON, cURL `-d`) til en GET-URL – alt skjer i nettleseren, ingen server.

## Bruk
1. Skriv inn **Base-URL** (uten parametre), f.eks. `https://api.example.com/search`
2. Lim inn **POST-body** eller en enkel **cURL-linje** (med `-d`/`--data`).
3. Trykk **Konverter** → du får en ferdig GET-URL som kan kopieres/åpnes.

Støtter:
- `application/x-www-form-urlencoded` – `key=value&x=1`
- JSON – `{"key":"value"}` (flates ut til `key=value`-par)
- `curl -X POST ... -d "key=value"` – henter også base-URL fra cURL-linjen om til stede

> NB: Dette er en statisk side. Ingen data sendes til server – alt skjer i nettleseren.

---

## Publisering på GitHub Pages (uten build-verktøy)
1. Opprett et nytt repository på GitHub, f.eks. `post-to-get`.
2. Legg filene i rot (`index.html`, `styles.css`, `main.js`, `.nojekyll`, `README.md`).
3. Push til `main`-branch.
4. I repoet: **Settings → Pages → Build and deployment**
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` – **Folder**: `/root`
5. Vent 1–2 minutter. Siden blir tilgjengelig på `https://<brukernavn>.github.io/post-to-get/`

Tips:
- Filen `.nojekyll` sørger for at GitHub Pages ikke prøver å Jekyll-bygge prosjektet.
- Vil du bruke et custom domene? Legg en `CNAME`-fil med domenet, og pek DNS CNAME til `<brukernavn>.github.io.`

---

## Lokal test
Bare åpne `index.html` i nettleseren (dobbeltklikk). Ingen server nødvendig.

---

## Videre arbeid
- Validering og bedre feilmeldinger for JSON/form.
- Støtte for flere `-d` flagg i cURL (kombinere flere payloads).
- Preset-lister for base-URL-er du bruker ofte.
- Permalinks: oppdater adressefeltet med resultatet.

---

## Lisens
MIT – bruk fritt, endre som du vil.
