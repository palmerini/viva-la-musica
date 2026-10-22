# Viva la musica

App per i coristi del coro **Viva La Musica** (Milano), un coro SATB amatoriale: repertorio, ascolto dei brani per voce, spartito che segue la riproduzione e documentazione.

È una web app installabile (PWA), pensata soprattutto per il telefono. Gira su Cloudflare (Workers + D1).

## Funzioni
- Repertorio caricato da un admin (MIDI e, facoltativo, spartito MusicXML da MuseScore).
- Ascolto del brano intero o delle voci scelte (anche più di una), con volume per voce e velocità regolabile.
- Spartito con cursore sincronizzato alla riproduzione.
- Sezione Documentazione ("Gli spiritelli della musica") dentro l'app.

## Sviluppo
```sh
npm install
cp .dev.vars.example .dev.vars   # imposta ADMIN_PASSWORD
npm run db:migrate               # database D1 locale
npm run dev
```

Deploy: vedi [CLAUDE.md](CLAUDE.md) (decisioni tecniche e note operative) e [ROADMAP.md](ROADMAP.md).

## Licenza
Software libero, rilasciato con licenza [Apache 2.0](LICENSE). Puoi usarlo, studiarlo, modificarlo e condividerlo. Le licenze dei componenti di terze parti sono in [NOTICE](NOTICE).
