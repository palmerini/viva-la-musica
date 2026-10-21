#!/bin/sh
# Copia in static/docs il libro Quarto già compilato (cartella _book) del repository
# https://github.com/palmerini/battimenti, che l'app mostra nella sezione Documentazione.
# Uso: sh scripts/sync-docs.sh [percorso-locale-del-repo]
#   senza argomenti clona la versione pubblicata su GitHub; con un percorso usa la copia locale
#   (utile per provare il libro prima di pubblicarlo). Poi: npm run deploy
set -e
if [ -n "$1" ]; then
	SRC="$1/_book"
else
	TMP=$(mktemp -d)
	git clone --depth 1 https://github.com/palmerini/battimenti.git "$TMP/repo"
	SRC="$TMP/repo/_book"
fi
[ -f "$SRC/index.html" ] || { echo "Libro non trovato in $SRC" >&2; exit 1; }
rm -rf static/docs
cp -R "$SRC" static/docs
find static/docs -name ".DS_Store" -delete
[ -n "$TMP" ] && rm -rf "$TMP"
echo "Documentazione aggiornata in static/docs ($(du -sh static/docs | cut -f1))"
