# BareFolio — Backend Supabase: Diseño

**Fecha:** 2026-05-22  
**Enfoque:** Conectar el backend real (Supabase) mediante vertical slices  
**Approach elegido:** Schema completo primero, implementar flujo a flujo

---

## Contexto

BareFolio es una red de portfolios visuales para creativos profesionales. La UI/UX está construida (Next.js 16, React 19, Tailwind 4) pero la app usa datos mock. Supabase está integrado parcialmente pero sin schema definido.

**4 tipos de perfil:** `creator`, `seeker`, `studio`, `brand`

**Principios de diseño que afectan al schema (de la Memoria):**
- Sin métricas públicas — likes y saves existen en DB pero no se muestran públicamente (sin conteos visibles)
- Verificación de entrada — el primer proyecto de un Creator pasa por revisión humana antes de acceso pleno
- IA semántica — los proyectos llevan metadatos auto-generados (disciplina, paleta, atmósfera, lenguaje visual)
- Briefs restringidos — solo `studio` y `brand` pueden crear Briefs (enforced via RLS)

---

## Schema de base de datos

### Enums

```sql
CREATE TYPE profile_type AS ENUM ('creator', 'seeker', 'studio', 'brand');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE content_type AS ENUM ('project', 'post', 'brief');
```

### Tabla: `profiles`

Extiende `auth.users`. Se crea automáticamente al completar el onboarding.

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Referencia a auth.users.id |
| username | text UNIQUE NOT NULL | Handle público |
| full_name | text | Nombre completo |
| avatar_url | text | URL en Supabase Storage |
| bio | text | Descripción corta |
| profile_type | profile_type NOT NULL | creator / seeker / studio / brand |
| location | text | Ciudad o país |
| website | text | URL personal |
| disciplines | text[] | Ej: ['Visual Identity', 'Photography'] |
| verified | boolean DEFAULT false | Acceso pleno tras revisión del primer proyecto |
| created_at | timestamptz DEFAULT now() | |

### Tabla: `projects`

Portfolio completo. Pantalla propia con URL. Solo visibles en el feed tras verificación.

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK DEFAULT gen_random_uuid() | |
| user_id | uuid FK → profiles.id | Autor |
| title | text NOT NULL | |
| description | text | Contexto del proyecto |
| cover_url | text | Imagen principal |
| images | text[] | Imágenes adicionales |
| discipline | text | Ej: 'Visual Identity', 'Web Design' |
| year | integer | Año de realización |
| client | text | Cliente (opcional) |
| visual_language | text | Ej: 'Minimalist', 'Brutalist' |
| palette | text[] | Colores hex del proyecto |
| atmosphere | text | Ej: 'Editorial', 'Commercial' |
| ai_tags | jsonb | Metadatos auto-generados por IA |
| tags | text[] | Tags editables por el creator |
| verification_status | verification_status DEFAULT 'pending' | Estado de revisión |
| created_at | timestamptz DEFAULT now() | |

### Tabla: `posts`

Formato ligero para proceso, bocetos, reflexiones. No requiere ficha técnica completa.

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK DEFAULT gen_random_uuid() | |
| user_id | uuid FK → profiles.id | |
| content | text NOT NULL | Texto del post |
| media_urls | text[] | Imágenes de proceso (opcional) |
| location | text | Ubicación (opcional) |
| created_at | timestamptz DEFAULT now() | |

### Tabla: `briefs`

Oportunidades de trabajo. Solo `studio` y `brand` pueden crear. Creators pueden aplicar.

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK DEFAULT gen_random_uuid() | |
| user_id | uuid FK → profiles.id | Publicador (studio o brand) |
| title | text NOT NULL | |
| description | text | |
| disciplines | text[] | Disciplinas requeridas |
| budget | text | Rango de presupuesto |
| deadline | date | Fecha límite de aplicación |
| duration | text | Duración estimada del proyecto |
| tags | text[] | |
| created_at | timestamptz DEFAULT now() | |

### Tabla: `likes`

Likes privados — no se exponen en la UI pública, solo se usan para personalizar el feed "For You".

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK DEFAULT gen_random_uuid() | |
| user_id | uuid FK → profiles.id | |
| target_type | content_type NOT NULL | project / post / brief |
| target_id | uuid NOT NULL | |
| created_at | timestamptz DEFAULT now() | |

Constraint: `UNIQUE (user_id, target_type, target_id)`

### Tabla: `collections`

Archivo de inspiración personal. Colecciones privadas por defecto; las públicas funcionan como señal de criterio estético en el perfil.

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK DEFAULT gen_random_uuid() | |
| user_id | uuid FK → profiles.id | |
| name | text NOT NULL | Nombre de la colección |
| is_public | boolean DEFAULT false | |
| created_at | timestamptz DEFAULT now() | |

### Tabla: `collection_items`

Ítems dentro de una colección. Polimórfico: puede guardar projects, posts o briefs.

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK DEFAULT gen_random_uuid() | |
| collection_id | uuid FK → collections.id | |
| target_type | content_type NOT NULL | |
| target_id | uuid NOT NULL | |
| created_at | timestamptz DEFAULT now() | |

### Tabla: `follows`

Seguimiento entre perfiles. Usado para el feed "For You".

| Campo | Tipo | Descripción |
|---|---|---|
| follower_id | uuid FK → profiles.id | Quien sigue |
| following_id | uuid FK → profiles.id | A quien sigue |
| created_at | timestamptz DEFAULT now() | |

PK compuesta: `(follower_id, following_id)`

### Tabla: `conversations`

Contenedor de una conversación directa entre dos usuarios.

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK DEFAULT gen_random_uuid() | |
| last_message_at | timestamptz | Para ordenar la lista del Inbox |
| created_at | timestamptz DEFAULT now() | |

### Tabla: `conversation_participants`

Relación many-to-many entre conversations y profiles.

| Campo | Tipo | Descripción |
|---|---|---|
| conversation_id | uuid FK → conversations.id | |
| user_id | uuid FK → profiles.id | |
| created_at | timestamptz DEFAULT now() | |

PK compuesta: `(conversation_id, user_id)`

### Tabla: `messages`

Mensajes individuales. Supabase Realtime escucha esta tabla para el Inbox en tiempo real.

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK DEFAULT gen_random_uuid() | |
| conversation_id | uuid FK → conversations.id | |
| sender_id | uuid FK → profiles.id | |
| content | text NOT NULL | |
| created_at | timestamptz DEFAULT now() | |

---

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Políticas clave:

- **profiles:** SELECT público; INSERT/UPDATE solo el propio usuario
- **projects:** SELECT público (solo `verification_status = 'approved'`); INSERT solo creators; UPDATE solo el autor
- **briefs:** INSERT solo `profile_type IN ('studio', 'brand')` — enforced via join con profiles
- **likes / collections / collection_items:** Solo el propio usuario puede ver y modificar sus datos
- **messages / conversations:** Solo los participantes de la conversación pueden leer y escribir

---

## Supabase Storage

Dos buckets:

| Bucket | Acceso | Uso |
|---|---|---|
| `avatars` | Público | Fotos de perfil |
| `project-images` | Público | Imágenes de proyectos y posts |

---

## Flujo de Auth

1. Usuario llega a `/login`
2. Puede registrarse (email/password) o con Apple/Google (OAuth)
3. Verificación de email (Supabase Auth envía el mail)
4. Redirige a `/onboarding`: "Where do you fit?" → selecciona tipo de perfil
5. Completa datos básicos (nombre, username, disciplinas)
6. Se crea la fila en `profiles` (trigger en auth.users o llamada directa)
7. Redirige al home `/`

---

## Orden de implementación (vertical slices)

### Slice 1 — Auth + Perfil
**Tablas:** `profiles` + Supabase Auth + Storage `avatars`

- Configurar proyecto Supabase y variables de entorno
- Crear todas las tablas (migration SQL completa)
- Configurar RLS en todas las tablas
- Crear buckets de Storage
- Flujo de registro → onboarding → creación de perfil
- Trigger SQL: al crear usuario en auth.users, pre-crear fila en profiles
- Página de perfil propio (`/profile/me`) editable con datos reales
- Ver perfil de otros (`/profile/[id]`)

### Slice 2 — Feed real (lectura)
**Tablas:** `projects`, `posts`, `briefs`

- Insertar seed data (proyectos, posts, briefs de prueba)
- `page.tsx` lee de Supabase en lugar de datos mock
- Realtime subscriptions en el feed (INSERT en projects/posts/briefs)
- Eliminar todos los datos hardcodeados del feed

### Slice 3 — Crear contenido
**Tablas:** `projects`, `posts`, `briefs` + Storage `project-images`

- `CreateModal` funcional: upload de imágenes a Storage
- Crear proyecto: 4 pasos (disciplina → título/descripción → imágenes destacadas → publicar)
- Crear post: texto + imágenes opcionales
- Crear brief: solo disponible para perfiles `studio` y `brand`
- Primer proyecto de un creator no verificado entra con `verification_status = 'pending'`
- Una vez que `profiles.verified = true`, los proyectos siguientes se crean con `verification_status = 'approved'` directamente

### Slice 4 — Interacciones + Colecciones
**Tablas:** `likes`, `follows`, `collections`, `collection_items`

- Botón de like funcional (toggle, sin contar públicamente)
- Botón de save → guarda en colección por defecto o permite elegir colección
- Seguir/dejar de seguir perfiles
- Feed "For You" filtrado por follows
- Página de colecciones en el perfil (archivo de inspiración)

### Slice 5 — Inbox / Mensajería
**Tablas:** `conversations`, `conversation_participants`, `messages`

- Crear conversación al hacer click en "Contactar" desde un perfil
- Lista de conversaciones en `/inbox`
- Vista de mensajes con Realtime (Supabase channel)

---

## Decisiones técnicas

- **Trigger de profiles:** Usar un trigger `AFTER INSERT ON auth.users` para pre-crear la fila en `profiles` con `id` y `created_at`. El resto se completa en el onboarding.
- **Feed unificado:** La query del home hace tres `SELECT` en paralelo (projects approved, posts, briefs) y los mezcla por `created_at` en el cliente. Con volumen alto migrar a una vista materializada.
- **Sin métricas públicas:** No hay columnas `likes_count` ni `followers_count` en ninguna tabla. Los counts se calculan solo cuando el propio usuario los necesita (perfil propio).
- **IA tags:** El campo `ai_tags` es `jsonb` para flexibilidad. En la implementación inicial se deja vacío; en una segunda fase se conecta un edge function que llama a la API de visión.
- **Realtime:** Solo activar canales de Realtime en las páginas que los necesitan (feed y inbox). No activar globalmente para evitar conexiones innecesarias.
