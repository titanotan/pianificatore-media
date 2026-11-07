Voglio creare un'app web per pianificare la mia carriera universitaria.
Non è un semplice libretto: il cuore dell'app è capire quali voti devo
prendere nei prossimi esami per raggiungere il mio obiettivo.

Funzionalità della prima versione:
- esami sostenuti: aggiungere, modificare ed eliminare esami
  (nome, CFU, voto da 18 a 30, lode), con la media ponderata attuale
- esami da sostenere: elenco degli esami futuri con nome, CFU e difficoltà
  (facile, media, difficile), per ora solo come informazione
- impostazioni: l'utente sceglie quanto vale la lode nel calcolo della media
- obiettivo: impostare la media o il voto di laurea che voglio raggiungere
- pianificazione: calcolare la media necessaria negli esami rimanenti,
  segnalando se l'obiettivo è impossibile o già raggiunto
- simulazione: assegnare un voto previsto ai singoli esami futuri, bloccarlo,
  e vedere subito come cambia la media finale e cosa serve negli esami restanti
- salvare i dati nel browser con localStorage

Direzione futura (non implementarla ora, ma tienine conto nella struttura):
- algoritmo che propone una distribuzione dei voti futuri in base alla
  difficoltà degli esami (voti più bassi per i difficili, più alti per i
  facili), rispettando l'intervallo 18-30 e i voti bloccati dall'utente
- salvare e confrontare più scenari (es. prudente, realistico, ambizioso)
- organizzare gli esami futuri per sessione
- grafico dell'andamento della media nel tempo
- vincoli per l'algoritmo: voto massimo raggiungibile per singolo esame
  e opzione per generare simulazioni senza lodi

Interfaccia:
- pensata prima per computer, poi adattata bene anche allo smartphone
- stile pulito e moderno, con tema chiaro e scuro
- la pianificazione deve essere la parte più in evidenza, non il libretto
- media e risultati ben visibili e aggiornati in tempo reale
- messaggi chiari in caso di dati non validi
- una schermata iniziale che spieghi cosa fare quando non ci sono dati
- prima di implementare, proponimi 2 o 3 direzioni di stile tra cui scegliere

Vincoli tecnici:
- proponimi tu le tecnologie più adatte, spiegandomi pro e contro,
  e aspetta la mia scelta prima di iniziare
- deve poter essere pubblicata come sito su GitHub Pages

Come lavoriamo:
- prima proponimi un piano in milestone e aspetta la mia conferma
- implementa una milestone alla volta e fermati per farmela provare
- fai un commit Git per ogni milestone, con un messaggio chiaro
- scrivi dei test per la logica di calcolo e verifica che passino
- spiegami brevemente le scelte che fai
