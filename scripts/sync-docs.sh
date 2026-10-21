#!/bin/sh
# Copia in static/docs il libro Quarto già compilato (cartella _book) del repository
# https://github.com/palmerini/battimenti, che l'app mostra nella sezione Documentazione.
# Uso: sh scripts/sync-docs.sh   (poi: npm run deploy)
set -e
TMP=$(mktemp -d)
git clone --depth 1 https://github.com/palmerini/battimenti.git "$TMP/repo"
rm -rf static/docs
cp -R "$TMP/repo/_book" static/docs
rm -rf "$TMP"
echo "Documentazione aggiornata in static/docs ($(du -sh static/docs | cut -f1))"
