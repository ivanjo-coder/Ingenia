# Ingenia

App web para estudiar asignaturas de ingeniería con tarjetas, tests y problemas con números que cambian. Interfaz y contenido en catalán y castellano.

**Estado:** Fase 1 terminada (esqueleto, navegación, contenido de ejemplo, idiomas y fórmulas).

## Instalar en Windows (solo la primera vez)

1. Instala **Node.js** desde https://nodejs.org (botón "LTS"). Acepta todo lo que venga por defecto.
2. Abre la carpeta del proyecto, haz clic en la barra de direcciones del Explorador, escribe `cmd` y pulsa Intro. Se abre una ventana negra (la terminal) situada en esa carpeta.
3. Escribe:

   ```bash
   npm install
   ```

   Tarda uno o dos minutos. Al acabar verás algo como `added 200 packages`.

## Arrancar la app

```bash
npm run dev
```

Verás una línea `Local: http://localhost:5173/`. Abre esa dirección en el navegador. Mientras la terminal siga abierta, cada cambio que guardes se ve al momento. Para parar: `Ctrl + C`.

Para verla en el móvil (misma wifi que el ordenador): `npm run dev -- --host` y abre en el móvil la dirección `Network` que aparece.

## Comprobar que todo está bien

| Comando | Qué hace | Qué deberías ver |
| --- | --- | --- |
| `npm run validar` | Revisa todas las tarjetas | `Todo correcto: no hay errores en el contenido.` |
| `npm run test` | Pasa los tests automáticos | `Tests  29 passed` (el número irá creciendo) |
| `npm run build` | Prepara la app para publicar (carpeta `dist/`) | `✓ built in ...` |
| `npm run comprobar` | Los tres anteriores seguidos | Lo mismo, sin errores |

## Dónde está cada cosa

| Carpeta | Contenido |
| --- | --- |
| `contenido/` | Asignaturas, temas y tarjetas. **Lo único que hay que tocar para escribir contenido** (ver [CONTENIDO.md](CONTENIDO.md)) |
| `src/marca.ts` | Nombre de la app y correo de avisos. Único sitio donde aparecen |
| `src/contenido/` | Lectura y validación del contenido |
| `src/motor/` | Generador y corrector de problemas |
| `src/pantallas/`, `src/componentes/` | Lo que se ve |
| `src/i18n/` | Textos de la interfaz (`ca.json`, `es.json`) |
| `scripts/` | El comando `npm run validar` |
| `tests/` | Tests automáticos |

## Publicar

Pendiente de la Fase 6 (hosting gratuito y app instalable).
