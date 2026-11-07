# Pianificatore Media

App web per tenere sotto controllo la media universitaria. Non è un semplice libretto: il cuore
dell'app è capire **quali voti servono nei prossimi esami** per raggiungere la media obiettivo.

I requisiti completi sono in [`prompt.md`](prompt.md).

## Tecnologie

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org), con [Vite](https://vite.dev)
- [Vitest](https://vitest.dev) per i test della logica di calcolo
- CSS Modules con variabili CSS per il tema chiaro e scuro
- Dati salvati nel browser (`localStorage`): nessun server, nessun account

## Comandi

```bash
npm install        # installa le dipendenze (una volta)
npm run dev        # avvia l'app in locale → http://localhost:5173
npm test           # esegue i test
npm run build      # crea il sito statico in dist/
npm run preview    # prova in locale il sito appena costruito
npm run lint       # controlla il codice
npm run format     # formatta il codice con Prettier
```

## Struttura

```
src/
  domain/      logica di calcolo pura (medie, obiettivo, simulazione, validazione), con test
  storage/     salvataggio in localStorage con versione dello schema e migrazioni, con test
  state/       stato dell'app (reducer + provider React), con test
  app/         struttura della pagina, navigazione (#/piano, #/libretto, ...), tema
  components/  componenti grafici riutilizzabili
  features/    le sezioni dell'app (pianificazione, libretto, esami futuri, impostazioni)
  styles/      token di design (colori, spaziature) e stili di base
```

## Regole di calcolo

- **Media ponderata** = Σ(voto × CFU) / Σ CFU. Con la lode un 30 vale quanto impostato (30–33).
- **Obiettivo**: una media da 18 a 30.
- **Media necessaria** negli esami futuri non bloccati =
  (obiettivo × CFU totali − Σ voti sostenuti − Σ voti bloccati) / CFU non bloccati.
- **Stato dell'obiettivo**: già raggiunto (basta 18 ovunque) · raggiungibile · al limite (serve
  29 o più) · solo con lodi (serve più di 30) · impossibile.
- **Media finale prevista**: esami sostenuti + esami futuri con un voto previsto.
- La media necessaria è mostrata arrotondata per eccesso, per non sottostimare ciò che serve.

## Pubblicazione su GitHub Pages

Il workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) esegue lint, test e
build e pubblica il sito a ogni push su `main`. La prima volta, nel repository GitHub, vai in
**Settings → Pages → Source** e scegli **GitHub Actions**.

## Avanzamento

- [x] M0 — Fondamenta: progetto, temi chiaro/scuro, navigazione, deploy
- [x] M1 — Logica di calcolo e salvataggio
- [x] M2 — Libretto e impostazioni
- [ ] M3 — Esami futuri e obiettivo
- [ ] M4 — Pianificazione e simulazione
- [ ] M5 — Primo avvio, smartphone e pubblicazione
