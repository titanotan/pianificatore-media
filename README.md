# Piano Carriera

App web per pianificare la carriera universitaria. Non è un semplice libretto: il cuore dell'app è
capire **quali voti servono nei prossimi esami** per raggiungere la media o il voto di laurea
obiettivo.

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
  app/         struttura della pagina, navigazione (#/piano, #/libretto, ...), tema
  components/  componenti grafici riutilizzabili
  features/    le sezioni dell'app (pianificazione, libretto, esami futuri, impostazioni)
  styles/      token di design (colori, spaziature) e stili di base
```

La logica di calcolo (medie, obiettivo, simulazione) vivrà in `src/domain/` come funzioni pure,
indipendenti da React e coperte da test.

## Pubblicazione su GitHub Pages

Il workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) esegue lint, test e
build e pubblica il sito a ogni push su `main`. La prima volta, nel repository GitHub, vai in
**Settings → Pages → Source** e scegli **GitHub Actions**.

## Avanzamento

- [x] M0 — Fondamenta: progetto, temi chiaro/scuro, navigazione, deploy
- [ ] M1 — Logica di calcolo e salvataggio
- [ ] M2 — Libretto e impostazioni
- [ ] M3 — Esami futuri e obiettivo
- [ ] M4 — Pianificazione e simulazione
- [ ] M5 — Primo avvio, smartphone e pubblicazione
