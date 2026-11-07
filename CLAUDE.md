# Pianificatore Media — istruzioni per Claude Code

App web (React + TypeScript + Vite) per pianificare la media universitaria: quali voti servono
negli esami futuri per raggiungere uno o più obiettivi di media. Sito statico su GitHub Pages,
dati solo in `localStorage`. Interfaccia e testi **in italiano**.

## Comandi

- `npm run dev` — sviluppo · `npm test` — Vitest · `npm run lint` — oxlint
- `npm run build` — controllo dei tipi + build in `dist/` · `npm run format:check` — Prettier
- Prima di ogni commit devono passare: `npm test`, `npm run lint`, `npm run build`,
  `npm run format:check`.

## Architettura

- `src/domain/` — **logica pura** (niente React né browser), ogni calcolo ha test `*.test.ts`:
  medie (`grades`), stato dell'obiettivo (`planning`), simulazione (`simulation`), più obiettivi e
  ambiti (`scenarios`), gruppo di esami (`group`), generazione dei voti (`distribution`),
  frasi di stato (`messages`), formattazione all'italiana (`format`), validazione (`validation`).
- `src/storage/` — salvataggio versionato: `SCHEMA_VERSION` + `MIGRATIONS` in `migrations.ts`,
  pulizia dei dati letti in `sanitize.ts`, copia di sicurezza se illeggibili.
- `src/state/` — reducer (tutte le modifiche passano da qui) e provider con i calcoli derivati
  (`main` e `group`, di tipo `ScopeView`).
- `src/features/` — pagine; `src/components/` — UI condivisa; `src/styles/tokens.css` — colori e
  spaziature (tema chiaro/scuro). Stili con CSS Modules, colori solo dai token.

## Concetti chiave

- **Scenario** = un obiettivo di media + la sua simulazione (voti previsti per esame futuro).
- **Ambito** (`PlanningScope`): `main` (tutti gli esami) o `group` (solo esami con `inGroup`).
  Le stesse componenti (`PlanningView`, `GoalDialog`, `SimulationPanel`) servono entrambi; le
  azioni su scenari e previsioni portano sempre `scope`.
- Voto **bloccato**: fisso nel calcolo della media necessaria e mai toccato da "Genera voti".
  Voto **previsto** non bloccato: conta solo nella media finale prevista.
- Media necessaria = (obiettivo × CFU totali − Σ voti certi) / CFU liberi, mostrata arrotondata
  per eccesso (`formatRequired`).

## Regole

- Ogni cambio alla forma dei dati salvati: incrementa `SCHEMA_VERSION`, aggiungi la migrazione,
  aggiorna `sanitize.ts` e i test (chi ha dati salvati non deve perdere nulla).
- Le funzioni aggiuntive (es. gruppo di esami) sono **spente di default** e, se spente, non
  lasciano alcuna traccia nell'interfaccia.
- Navigazione con hash (`#/piano`, ...) e `base: './'`: niente router lato server (GitHub Pages).
- `docs/requisiti-iniziali.md` è il prompt originale dell'utente: non modificarlo.
- Modo di lavorare con l'utente: proporre prima di implementare, una milestone alla volta,
  fermarsi per farla provare, un commit chiaro per milestone; spiegare brevemente le scelte.
