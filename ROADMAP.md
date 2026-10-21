# Roadmap

## v1 — Studio della propria parte
- [~] Scheletro SvelteKit + TS + PWA fatto; manca il deploy su Cloudflare
- [x] Schema D1 e bucket R2
- [x] Admin: login con password unica
- [x] Admin: upload MIDI, mappatura tracce→voci, titolo/note, modifica/eliminazione
- [x] Elenco repertorio con ricerca
- [x] Pagina brano: play/pause/stop, barra di avanzamento
- [x] Selettore voce: brano intero / solo S / A / T / B
- [x] Mixer: volume per voce, "metti in evidenza la mia voce" (le altre più basse)
- [ ] Controllo tempo (velocità) e loop su un intervallo di battute

## Idee per dopo (da pescare in base all'uso)
- Spartito/testo del brano (PDF o testo allegato)
- Segui la nota: visualizzazione della linea della propria voce
- Click/metronomo e conteggio iniziale
- Calendario prove e comunicazioni
- Presenze alle prove
- Preferiti / "brani da ripassare" salvati sul dispositivo
- Registrazione della propria voce sopra la base
- Utenti con login (se servirà)
- Suoni più realistici (soundfont corale)

## Domande aperte
- I MIDI esportati da MuseScore: verificare se ogni voce è una traccia (tipico: una traccia per rigo) o se più voci condividono un rigo.
