# Pregunta2

Trivia para dos jugadores en el mismo dispositivo, inspirada en Preguntados.
Cualquiera puede crear su propio juego con sus categorías y preguntas, y
compartirlo con un link. Sin cuentas de usuario: cada juego tiene un link de
edición secreto.

## Stack

- Next.js 16 (App Router, Cache Components, React Compiler) + TypeScript
  estricto
- Tailwind CSS 4
- Neon Postgres + Drizzle ORM (driver HTTP `@neondatabase/serverless`)
- Vercel Blob para las imágenes (subida directa desde el navegador)
- next-intl (toda la UI sale de `messages/es.json`)
- Zod para validar toda entrada en el servidor
- Vitest (motor del juego y dominio) y Playwright (flujos completos)

Todo entra en los planes gratis de Vercel (Hobby), Neon y Vercel Blob.

## Correr el proyecto localmente

Requisitos: Node 22+ y pnpm (la versión está fijada en `packageManager`).

```bash
pnpm install
cp .env.example .env.local   # completá las variables (ver abajo)
pnpm db:migrate              # crea las tablas
pnpm db:seed                 # opcional: juego de ejemplo en /j/demo
pnpm dev                     # http://localhost:3000
```

## Configurar Neon y Vercel Blob

Las dos cosas se crean desde el dashboard del proyecto en Vercel, pestaña
**Storage**:

1. **Neon**: _Create Database_ → Neon (plan Free). Conectalo al proyecto con los
   entornos Development, Preview y Production. Vercel crea `DATABASE_URL` (y
   `DATABASE_URL_UNPOOLED`, entre otras).
2. **Blob**: _Create Database_ → Blob, con acceso **Public**. Es importante: las
   imágenes de las categorías y preguntas las ve cualquiera que juegue, y el
   modo de acceso no se puede cambiar después de crear el store. Conectalo al
   proyecto; Vercel crea `BLOB_READ_WRITE_TOKEN`.

Para desarrollo local copiá esas variables a `.env.local`. Podés usar el snippet
`.env.local` de cada store en el dashboard, o `vercel env pull .env.local` si
tenés el CLI vinculado al proyecto. `.env.local` no se commitea.

Variables que usa la app (validadas con Zod en `src/lib/env.ts`):

| Variable                | Uso                                              |
| ----------------------- | ------------------------------------------------ |
| `DATABASE_URL`          | Conexión a Neon (pooled)                         |
| `DATABASE_URL_UNPOOLED` | Opcional; las migraciones la prefieren si existe |
| `BLOB_READ_WRITE_TOKEN` | Firmar subidas y borrar imágenes en Vercel Blob  |

## Base de datos y migraciones

El esquema está en `src/features/games/schema.ts` y las migraciones en
`drizzle/`. `drizzle.config.ts` lee `.env.local` solo.

```bash
pnpm db:generate   # genera una migración nueva después de cambiar el esquema
pnpm db:migrate    # aplica las migraciones pendientes
pnpm db:studio     # explorador de la base
pnpm db:seed       # carga el juego de ejemplo publicado en /j/demo
```

Tablas: `games`, `categories` y `questions`. Al borrar un juego se borran en
cascada sus categorías y preguntas.

## Tests

```bash
pnpm test          # Vitest: motor del juego, paleta, requisitos, validaciones
pnpm test:watch
pnpm build && pnpm test:e2e   # Playwright en viewport de celular
```

- Los tests unitarios no necesitan base ni red.
- Los e2e levantan `next start` en el puerto 3100 (por eso necesitan un
  `pnpm build` antes) y usan la base y el Blob de `.env.local`. Crean un juego
  real, suben una imagen, lo publican y lo juegan, y al terminar borran lo que
  crearon. La partida de ejemplo necesita `pnpm db:seed`.
- La primera vez: `pnpm exec playwright install chromium`.

Otros chequeos: `pnpm typecheck`, `pnpm lint` y `pnpm format:check`.

## Estructura

```
src/
├── app/                       # solo rutas (todo bajo [locale], invisible en la URL)
│   ├── [locale]/page.tsx      # home: crear juego + juegos publicados
│   ├── [locale]/j/[slug]/     # partida
│   ├── [locale]/edit/[token]/ # editor (Server Actions en actions.ts)
│   └── api/blob/upload/       # firma de subidas a Vercel Blob
├── features/
│   ├── match/engine/          # motor del juego: reducer puro, sin React ni Next
│   ├── match/                 # geometría de la ruleta, persistencia en localStorage
│   └── games/                 # esquema, queries, mutations, validaciones, paleta
├── components/                # componentes compartidos (ruleta, avatar, botón)
├── lib/                       # env validado, cliente de la base
└── i18n/                      # configuración de next-intl
```

## Decisiones de diseño

- **Motor puro.** `gameReducer(state, action)` no tiene efectos secundarios, y
  la aleatoriedad llega en las acciones: `SPIN` trae la porción sorteada y las
  acciones que sacan preguntas traen un `seed`. Así los tests son deterministas,
  y el mismo código puede correr en el servidor para un modo online.
- **Fases.**
  `SETUP_PLAYERS → TURN_CHANGE → SPINNING → REVEAL → QUESTION → CHOOSE → DUEL_SETUP → FINISHED`.
  La pregunta normal, la pregunta por una categoría y las dos del duelo son la
  misma fase `QUESTION`, con un `context` distinto. La respuesta queda en el
  estado y sus consecuencias se aplican al tocar "Continuar", así que recargar
  mientras se muestra el resultado no rompe nada.
- **Jugador sin opciones.** Con estas reglas no puede pasar: si te falta algún
  categoría, siempre podés jugar por ella, y si no te falta ninguna ya ganaste.
  Igual hay dos protecciones: un juego con una categoría sin preguntas no se
  puede jugar, y antes de mostrar la elección se chequea si alguien ganó.
- **Link de edición.** El token (32 bytes aleatorios en base64url) es la única
  autorización para editar. En la base se guarda solo su SHA-256, así que una
  filtración de la base no expone los links. La página de edición no se indexa y
  no manda `Referer`.
- **Publicación.** Hacen falta un nombre, entre 3 y 6 categorías con nombre y
  color, y al menos 5 preguntas por categoría. El slug legible se fija al
  publicar por primera vez, para que los links compartidos no cambien. Si una
  edición deja a un juego publicado sin cumplir los requisitos, vuelve a
  borrador y el editor avisa.
- **Imágenes.** Las categorías llevan imagen y las preguntas pueden llevar una
  opcional. Se comprimen en el navegador (WebP, 512 px de lado para categorías y
  1024 px para preguntas) y se suben directo a Blob. El servidor solo firma
  rutas dentro del juego del token, valida el tipo (máx. 1 MB) y, al guardar,
  que la URL sea de esa ruta. Las imágenes reemplazadas, las de categorías o
  preguntas borradas y las subidas en un formulario que se canceló se eliminan
  del store.
- **Caché.** La partida y la lista de la home se leen con `"use cache"` y
  etiquetas; cada edición las invalida con `updateTag`. Las páginas con datos
  dinámicos usan PPR: el esqueleto se sirve estático y el contenido llega por
  streaming. Por eso un `notFound()` dentro de esas páginas responde con status
  200, pero muestra la página 404 y le agrega `noindex`.

## Deploy

Con el repo conectado a Vercel por Git, cada push genera un deploy: la rama de
producción configurada en el proyecto va a producción y las demás quedan como
preview. En el proyecto de Vercel, revisá que `DATABASE_URL` y
`BLOB_READ_WRITE_TOKEN` existan en Production y Preview, y que el token sea el
del store de Blob **público**.

Corré `pnpm db:migrate` contra la base de producción cada vez que cambie el
esquema. Si `.env.local` salió de los mismos stores que usa producción (lo
habitual con un solo Neon y un solo Blob), las migraciones, `pnpm db:seed` y los
tests e2e escriben en la base de producción. Los e2e borran lo que crean, pero
mientras corren, el juego de prueba aparece unos segundos en la home.
