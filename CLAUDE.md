# Viva la musica

App personale ("Viva la musica") per un coro SATB amatoriale. Aiuta i coristi a studiare la propria parte: consultazione del repertorio e riproduzione dei brani (completi o per singola voce). Pensata per crescere con nuove funzionalità nel tempo.

## Contesto d'uso
- Utenti: pochi amici/coristi. Uso principale da telefono, secondario da web.
- Nessuna autenticazione per i coristi (sola lettura). Solo un accesso admin (password/token unico) per caricare brani e gestire l'app.
- Lingua dell'interfaccia: italiano.

## Stack (decisioni)
- **SvelteKit + TypeScript**, mobile-first, installabile come **PWA**.
- **Hosting: Cloudflare** (Pages/Workers, piano gratuito) con `@sveltejs/adapter-cloudflare`.
  - **D1** (SQLite) per i metadati: brani, mappatura tracce→voci.
  - I file MIDI (pochi KB) stanno in D1 come base64, tabella `song_midi` (R2 richiede una carta; si può migrare più avanti).
- **Riproduzione lato client**: `@tonejs/midi` per parsare, `Tone.js` per suonare. Nessuna elaborazione audio sul server.
- Admin: password nel secret `ADMIN_PASSWORD`, verificata lato server, cookie di sessione httpOnly.

## Modello dati iniziale
- `song`: id, titolo, compositore/autore, note, voices (JSON: voce di ciascuna traccia con note), created_at.
- `song_midi`: song_id, data (MIDI in base64).
- `song_score`: song_id, data (spartito MusicXML/.mxl in base64, facoltativo). In upload l'admin conferma la mappatura tracce→voci (proposta automatica).

## Architettura: estendibilità
Le funzionalità sono **moduli separati** in `src/lib/features/<nome>/` (componenti, logica, tipi), con le rotte in `src/routes/<nome>/`. Una nuova funzionalità non deve richiedere modifiche invasive alle esistenti. Codice condiviso solo in `src/lib/shared/`. Migrazioni D1 in `migrations/`, numerate.

## Convenzioni
- TypeScript strict; niente `any` senza motivo.
- Commit piccoli, messaggi in italiano o inglese ma coerenti.
- Prima di aggiungere dipendenze, valutarne il peso (uso da mobile).
- Aggiornare `ROADMAP.md` quando una funzionalità viene completata o ne nasce una nuova.

## Note tecniche (scheletro)
- SvelteKit 3: la config sta in `vite.config.ts`; alias import `#lib/...` (non `$lib`), mappato in `package.json` → `imports`.
- Service worker in `src/service-worker/` (guscio dell'app in cache, brani network-first). Registrazione automatica; in dev dà un errore innocuo.
- Repertorio in D1 (`song`) + MIDI in D1 (`song_midi`), serviti da `/api/songs/<id>/midi`. `samples/esempio.mid` (rigenerabile con `node scripts/make-sample.mjs`) serve per provare l'upload.
- Area admin: `/admin` (elenco, elimina), `/admin/new`, `/admin/<id>`. Accesso protetto in `src/hooks.server.ts` (le `load` dei layout non girano sulle POST); sessione = cookie firmato HMAC con `ADMIN_PASSWORD`. Nessun rate limit sul login (da aggiungere se serve).
- Sviluppo locale: `.dev.vars` (non versionato, vedi `.dev.vars.example`) con `ADMIN_PASSWORD`; `npm run db:migrate` applica le migrazioni al D1 locale (in `.wrangler/`); `npm run types` rigenera `worker-configuration.d.ts`. Il server si legge `env` da `cloudflare:workers`.
- `@tonejs/midi` è CommonJS e non si importa lato server: la pagina brano ha `ssr = false` e `SongForm` lo importa dinamicamente.
- Produzione: https://viva-la-musica.viva-la-musica.workers.dev (Cloudflare Workers + D1). Deploy con `npm run deploy`; nuove migrazioni con `npx wrangler d1 migrations apply DB --remote` prima del deploy; password con `npx wrangler secret put ADMIN_PASSWORD`.
- Riconoscimento voci (`features/player/voices.ts`): dal nome traccia (Soprano/Alto/Tenore/Basso…), altrimenti per altezza media se le tracce sono 4. MuseScore esporta una traccia per rigo: se due voci condividono un rigo non si separano ancora.
- Voci: `Tone.Sampler` con i campioni "choir aahs" di FluidR3_GM, self-hosted in `static/soundfonts/choir_aahs/` (rigenerabili con `scripts/extract-soundfont.mjs`); un campione ogni 3 semitoni, caricati solo nell'estensione del brano e condivisi tra le 4 voci. Ripiego su un sintetizzatore se non si caricano. Limite: i campioni durano ~3 s, le note più lunghe si spengono.
- Spartito: `opensheetmusicdisplay` (import dinamico in `ScoreView.svelte`, solo se il brano ha lo spartito). Il cursore si sincronizza con i ticks del MIDI (1 semibreve = 4·ppq). Usa `CurrentEnrolledTimestamp` di OSMD, che srotola ritornelli e volte come fa il MIDI di MuseScore (verificato su `samples/amore_che_vieni.mxl`: 55.125 semibrevi in entrambi).
- Campioni di prova: `samples/esempio.mid` + `samples/esempio.musicxml` (`node scripts/make-sample.mjs` e `make-sample-xml.mjs`).
- Spartito su telefono: sotto i 600 px parte in modalità "Una riga" (`renderSingleHorizontalStaffline`, scorre in orizzontale seguendo il cursore) con zoom 80%; sopra, a pagina. Barra con zoom ±, cambio modalità e "Solo la mia voce" (nasconde gli altri righi quando si sceglie una voce). Ogni cambio ridisegna e ricalcola i passi del cursore (`rebuild()` in `ScoreView.svelte`).
- Logo: originale in `assets/logo-originale.jpeg` (fondo #f8f8f8, non trasparente); in `static/` le versioni PNG per favicon, apple-touch-icon e PWA (`icon-192.png`, `icon-512.png`). Nell'header sta in un riquadro chiaro per leggersi sul blu.
- Documentazione: `/documentazione` mostra in un iframe il libro Quarto "Gli spiritelli della musica" (repo https://github.com/palmerini/battimenti), copiato in `static/docs` con `sh scripts/sync-docs.sh` (poi `npm run deploy`). Non è precaricato dal service worker.
- Il pulsante "Spartito" nella pagina del brano mostra/nasconde lo spartito: di default è nascosto; la scelta è salvata in `localStorage` (`showScore`).
- Voci: si possono scegliere più voci insieme (`selected` in `Player.svelte`; nessuna = tutte). Le altre tacciono, oppure restano a volume basso con "Fai sentire le altre voci a basso volume". Lo spartito (`voices` in `ScoreView`) mostra solo i righi delle voci scelte, con "Solo le voci scelte" per vederli tutti.
- Spartito, bug risolto (ottobre 2026): in `rebuild()` serve `osmd.cursor.reset()` dopo `render()` e prima di raccogliere i passi, perché `render()` lascia il cursore dov'era; senza, cambiando voce o modalità durante la riproduzione l'elenco dei passi partiva da metà brano e il cursore ripartiva da capo. Verificato con scelta/deselezione di voci, seek, cambio modalità e ritornelli, in pausa e in riproduzione.
- Palette: token CSS in `src/app.css` (chiaro e scuro) ricavati dal logo: verde-petrolio `#1f4f4e` (header, pulsanti attivi), menta `#bfe5c6` (accento), sfondi con leggera tinta verde. Contrasti testo verificati (≥ 4.8:1). Cursore dello spartito `#2fa36d`. `theme-color` in `app.html` e `manifest.webmanifest` vanno tenuti allineati a `--brand`. La documentazione (Quarto) usa gli stessi colori tramite `theme-light.scss` / `theme-dark.scss` nel repo `battimenti` (tema chiaro/scuro in base al sistema); per aggiornarla: `quarto render` nel repo, poi `sh scripts/sync-docs.sh <percorso del repo>` (senza argomenti usa la versione su GitHub) e `npm run deploy`.
- Licenza: Apache 2.0 (`LICENSE`, `NOTICE` con i componenti di terze parti, campo `license` in `package.json`). Il footer in `src/routes/+layout.svelte` dichiara che è software libero e rimanda a `LICENSE` e al repo https://github.com/palmerini/viva-la-musica su GitHub.
- Spartito e voci assegnate: `ScoreView` riceve `partVoices` (la voce di ogni traccia MIDI con note, quella scelta dall'admin) e la usa per decidere quali righi mostrare, purché MIDI e MusicXML abbiano lo stesso numero di righi (MuseScore li esporta nello stesso ordine); altrimenti ripiega sul nome del rigo o sulla posizione. Verificato scambiando Tenore e Basso nell'assegnazione.
