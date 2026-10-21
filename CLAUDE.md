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
  - **R2** per i file MIDI caricati.
- **Riproduzione lato client**: `@tonejs/midi` per parsare, `Tone.js` per suonare. Nessuna elaborazione audio sul server.
- Admin: password nel secret `ADMIN_PASSWORD`, verificata lato server, cookie di sessione httpOnly.

## Modello dati iniziale
- `song`: id, titolo, compositore/autore, note, midi_key (chiave R2), created_at.
- `song_track`: song_id, track_index, voice (`S`|`A`|`T`|`B`|`other`). In upload l'admin conferma la mappatura (auto-proposta dai nomi traccia).

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
- Repertorio in D1 (tabella `song`) + file MIDI in R2 (`songs/<id>.mid`), serviti da `/api/songs/<id>/midi`. `samples/esempio.mid` (rigenerabile con `node scripts/make-sample.mjs`) serve per provare l'upload.
- Area admin: `/admin` (elenco, elimina), `/admin/new`, `/admin/<id>`. Accesso protetto in `src/hooks.server.ts` (le `load` dei layout non girano sulle POST); sessione = cookie firmato HMAC con `ADMIN_PASSWORD`. Nessun rate limit sul login (da aggiungere se serve).
- Sviluppo locale: `.dev.vars` (non versionato, vedi `.dev.vars.example`) con `ADMIN_PASSWORD`; `npm run db:migrate` applica le migrazioni al D1 locale (in `.wrangler/`); `npm run types` rigenera `worker-configuration.d.ts`. Il server si legge `env` da `cloudflare:workers`.
- `@tonejs/midi` è CommonJS e non si importa lato server: la pagina brano ha `ssr = false` e `SongForm` lo importa dinamicamente.
- Produzione: `wrangler d1 create`, `wrangler r2 bucket create`, id del DB in `wrangler.jsonc`, `wrangler d1 migrations apply DB --remote`, `wrangler secret put ADMIN_PASSWORD`, poi `npm run deploy`.
- Riconoscimento voci (`features/player/voices.ts`): dal nome traccia (Soprano/Alto/Tenore/Basso…), altrimenti per altezza media se le tracce sono 4. MuseScore esporta una traccia per rigo: se due voci condividono un rigo non si separano ancora.
