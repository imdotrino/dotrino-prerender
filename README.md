# @dotrino/prerender

Las apps del ecosistema son de una sola página: el HTML que sirven trae el cuerpo vacío
(`<div id="app"></div>`). Quien lo lee sin ejecutar JavaScript —la primera pasada de un
buscador, y los que no ejecutan nada— no encuentra ni un texto ni un enlace.

Este paquete escribe en el HTML del build, justo después de `<body>`, lo que la página ya
dice de sí misma (su `<title>` y su `<meta name="description">`) más los enlaces al home y
al wiki del ecosistema. El bloque se quita solo en cuanto el navegador lo lee: la app se ve
exactamente igual que antes, y nada depende de cómo monte cada una.

Es la cáscara pública de la herramienta. Aquí nunca entra nada del usuario.

## Uso (Vite)

```bash
npm i -D @dotrino/prerender
```

```js
// vite.config.js
import prerender from '@dotrino/prerender/vite'

export default defineConfig({
  plugins: [prerender()],
})
```

Opciones, las dos opcionales:

| | |
|---|---|
| `text` | Un párrafo o una lista de párrafos (texto plano) debajo de la descripción. |
| `links` | `[{ href, text }]`: enlaces propios, delante de los del ecosistema (p. ej. la página del wiki de la app). |

Solo corre en `vite build`.

## Uso (sin Vite)

```js
import { prerenderHtml } from '@dotrino/prerender'

const html = prerenderHtml(await readFile('index.html', 'utf8'))
```

Pasarlo dos veces no duplica el bloque: lo reemplaza.

## Lo que exige de la página

`<title>`, `<meta name="description">`, `<html lang>` y `<body>`. Si falta alguno, **el
build se para** con un `PrerenderError` cuyo `code` dice cuál (`no-title`, `no-description`,
`no-lang`, `no-body`): una página que no dice qué es no tiene nada que enseñar, y un bloque
vacío sería peor que ninguno.

El idioma de los enlaces sale del `lang` de la página (`en…` → inglés; lo demás, español).

## Desarrollo

```bash
npm test
```

Se publica desde CI al etiquetar `vX.Y.Z` (`.github/workflows/release.yml`).

## Licencia

MIT
