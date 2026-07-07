# Benvenuto Digitale

Progetto web statico per creare minisiti di benvenuto per case vacanze, B&B e affitti brevi. Ogni struttura ha una guida digitale consultabile tramite QR Code, senza backend, database o framework.

## Struttura

```text
/index.html
/cliente.html
/css/style.css
/js/app.js
/data/clienti/macaluhome.json
/assets/img/
/assets/fonts/
/assets/logo/
/assets/qr/
/robots.txt
/_headers
/_redirects
```

## Test in locale

Apri il progetto con un piccolo server statico dalla cartella principale:

```bash
python3 -m http.server 8765
```

Poi visita:

- `http://localhost:8765/` per la landing.
- `http://localhost:8765/cliente.html?cliente=macaluhome` per la guida demo in locale.

Nota: `python3 -m http.server` non interpreta il file `_redirects`. L’URL pulito `https://tuodominio.it/clienti/macaluhome` funzionerà dopo la pubblicazione su Cloudflare Pages.

## Creare un nuovo cliente

1. Copia `data/clienti/macaluhome.json`.
2. Rinomina il file con lo slug del cliente, per esempio `villa-mare-blu.json`.
3. Modifica `slug`, `nome`, testi, contatti, Wi-Fi, consigli, numeri utili e link Maps.
4. L’URL pubblico sarà `/clienti/villa-mare-blu`.

Lo slug del file deve coincidere con lo slug nell’URL.

## Aggiungere immagini

Inserisci le immagini in `assets/img/` e aggiorna il campo `heroImage` nel JSON:

```json
"heroImage": "/assets/img/villa-mare-blu.jpg"
```

Usa immagini leggere e ottimizzate, idealmente sotto 300 KB per mantenere la pagina veloce su smartphone.

## Font

Il CSS è configurato per usare Bodoni XT. Il font è caricato da:

```text
assets/fonts/BodoniXT.ttf
```

Il file dichiara internamente il nome `BodoniXT`, quindi il CSS registra sia `BodoniXT` sia `Bodoni XT` come alias. Se il file non è presente, il browser userà il font solo se installato localmente e poi passerà ai fallback.

## Pubblicare su Cloudflare Pages

1. Crea un repository GitHub e carica questi file.
2. Entra in Cloudflare Pages e collega il repository.
3. Imposta:
   - Build command: lasciare vuoto.
   - Output directory: `/` oppure root del progetto.
4. Pubblica il sito.

Cloudflare Pages userà `_redirects` per servire gli URL `/clienti/*` tramite `cliente.html`.

## Collegare un dominio

In Cloudflare Pages apri il progetto, vai in `Custom domains` e aggiungi il dominio o sottodominio desiderato, per esempio:

```text
benvenuto.tuodominio.it
```

Segui le istruzioni DNS proposte da Cloudflare.

## Creare URL cliente

Ogni cliente ha un URL nel formato:

```text
https://tuodominio.it/clienti/slug-cliente
```

Esempio:

```text
https://tuodominio.it/clienti/macaluhome
```

## Generare QR Code

Genera il QR Code usando l’URL cliente finale. Salva il file in `assets/qr/` se vuoi conservarlo nel progetto, oppure stampalo su card, adesivi o materiale di benvenuto.

## Privacy e indicizzazione

Le guide cliente sono pensate per gli ospiti tramite QR Code. Il progetto include:

- `meta robots noindex, nofollow` in `cliente.html`;
- regole `robots.txt` per bloccare `/cliente.html` e `/clienti/`;
- header `X-Robots-Tag: noindex, nofollow` in `_headers`.
