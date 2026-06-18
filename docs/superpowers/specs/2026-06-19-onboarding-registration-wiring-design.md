# BareFolio — Registro funcional del Onboarding + pantalla de confirmación

**Fecha:** 2026-06-19
**Rama:** `develop` (luego espejo a `main` / Vercel)
**Estado:** Diseño aprobado por el usuario; pendiente de su revisión escrita antes del plan.

---

## 1. Objetivo

Hacer que el alta de usuarios de BareFolio sea **real y completa**:

1. Los datos comunes recogidos en el landing (email, nombre, apellido, país, fecha de nacimiento, contraseña) se **pasan al onboarding** en vez de descartarse.
2. Cada rol (creator / seeker / studio / brand) guarda su información específica en las **tablas correctas** de Supabase.
3. El alta real (`auth.signUp`) se dispara **una sola vez**, al final del onboarding, al pulsar **"Enter to BareFolio"** en una nueva pantalla de confirmación.
4. Se renombra el campo mal nombrado `users.city_at_signup` → `users.country_at_signup`.
5. Se crea una **tabla propia para Seeker** (`seeker_profiles`), porque su modelo ya no coincide con el de Creator.

---

## 2. Estado actual (lo que está roto)

- **El landing tira datos.** `AuthModal` (`src/app/page.tsx`) recoge `firstName, lastName, dob, country` pero al final solo hace `supabase.auth.signUp({ email, password })`. Nombre, apellido, país y fecha se pierden.
- **Doble registro.** El landing crea la cuenta en el paso `password`; luego el onboarding (`handleRegister`) vuelve a llamar a `signUp`.
- **El onboarding escribe en una tabla muerta.** Hace `upsert` a `public.profiles` (legacy del spec de mayo) con columnas inexistentes (`profile_type` en vez de `role`, `verified` en vez de `is_verified`) y sin rellenar `name`/`email`, que son `NOT NULL`. La persistencia real del perfil no funciona.
- **La práctica del Seeker se descarta.** `const [, setSeekerPractice] = useState('')` guarda el setter pero tira el valor.

### Modelo de datos real (canónico) en Supabase

Un trigger `handle_new_user` (`AFTER INSERT ON auth.users`, `SECURITY DEFINER`) ya provisiona, hoy solo como `creator`:

- `public.users` — identidad (1 por persona): `id, email, first_name, last_name, birth_year, city_at_signup, auth_provider, active_account_id, …`
- `public.accounts` — 1 cuenta por rol: `account_type` (`creator|seeker|organization`), `handle`, `display_name`, `bio`, `location`, `website_url`, `is_verified`, `verification_status`, `plan` (`free|pro|scout`), `is_available`, …
- `public.creator_profiles` — `account_id, practice, disciplines, tools, education, …`
- `public.creator_employment` — `account_id, open_to_work, work_types, experience_years, seniority_level, …`
- `public.organization_profiles` — `account_id, org_type` (`studio|brand`)`, disciplines, industries, founded_year, team_size, contact_email, …`
- `public.creator_verifications` / `public.organization_verifications` — colas de verificación.

La tabla `public.profiles` legacy se **abandona** (no se borra en esta entrega; queda huérfana).

---

## 3. Arquitectura del flujo

```
LANDING (pasos comunes)                 ONBOARDING                         SUPABASE
─────────────────────────               ──────────────────────────         ─────────────────
email, password, nombre,                elige rol → flujo del rol           (nada todavía)
apellido, país, fecha   ──►  store en   (creator/seeker/studio/brand)
                             memoria
                                         Pantalla "Welcome to BareFolio"
                                         [Enter to BareFolio]  ───────────► auth.signUp(email, password,
                                                                              { data: metadata completa })
                                                                              │
                                                                              ▼ trigger handle_new_user
                                                                              users + accounts + perfil de rol
                                                                              (+ verificación si aplica)
                                         router.push('/')  ◄──────────────── sesión iniciada
```

### Decisiones clave

- **`signUp` solo al final.** El landing deja de crear la cuenta. Solo recoge los 6 datos comunes y navega a `/onboarding`.
- **Paso de datos en memoria.** Un store de cliente (React Context o módulo singleton) que sobrevive a `router.push`. **Nunca por URL.** La **contraseña no se persiste en disco** (ni `localStorage` ni `sessionStorage`). Si el usuario refresca a mitad del onboarding, el store está vacío → se le redirige al landing a empezar de nuevo (asumible).
- **Toda la persistencia ocurre en el trigger** (`SECURITY DEFINER`), de forma atómica y saltándose RLS. El cliente **no** hace `insert`/`upsert` a las tablas; solo llama a `signUp` con la metadata ya normalizada (valores listos para enum, mapeados en TypeScript). Así la lógica de mapeo es testeable en el cliente y el trigger queda simple.

---

## 4. Store de traspaso (landing → onboarding)

`src/lib/signupDraft.ts` — un store en memoria (no React) con un objeto módulo-scope:

```ts
export type SignupDraft = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;     // etiqueta del CountrySelect
  birthYear: number | null;  // derivado de dob
};
let draft: SignupDraft | null = null;
export const setSignupDraft = (d: SignupDraft) => { draft = d; };
export const getSignupDraft = () => draft;
export const clearSignupDraft = () => { draft = null; };
```

- El landing, en el último paso de signup, en vez de `signUp`, hace `setSignupDraft({...})` y `router.push('/onboarding')`.
- El onboarding lee `getSignupDraft()` al montar. Si es `null`, redirige a `/` (no se puede registrar sin los datos comunes).
- Tras un `signUp` exitoso, `clearSignupDraft()`.

> Nota: el `dob` del landing es una fecha; el backend solo guarda `birth_year` (integer). Derivamos el año en el cliente. (El día/mes no se almacena hoy — fuera de alcance ampliar el esquema para fecha completa.)

---

## 5. Cambios de esquema en Supabase (migraciones)

Se aplican con `apply_migration` (DDL), una migración por unidad lógica:

### 5.1 Renombrar el campo "City"
```sql
ALTER TABLE public.users RENAME COLUMN city_at_signup TO country_at_signup;
```

### 5.2 Enum nuevo para la práctica del Seeker
```sql
CREATE TYPE public.seeker_practice_enum AS ENUM
  ('recruiter_scout', 'creative_lead', 'producer_casting', 'founder', 'prefer_not_to_say');
```

### 5.3 Tabla propia `seeker_profiles`
```sql
CREATE TABLE public.seeker_profiles (
  account_id     uuid PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
  scout_practice public.seeker_practice_enum,
  disciplines    text[] DEFAULT ARRAY[]::text[],
  updated_at     timestamptz DEFAULT now()
);
ALTER TABLE public.seeker_profiles ENABLE ROW LEVEL SECURITY;
```
RLS (igual patrón que `creator_profiles`): SELECT público; INSERT/UPDATE solo el dueño de la cuenta. (Las políticas exactas se calcan de `creator_profiles` en el plan.)

### 5.4 Trigger `handle_new_user` extendido
Reemplaza la función para ramificar según `raw_user_meta_data->>'role'`:

- Siempre: `INSERT users(... first_name, last_name, birth_year, country_at_signup ...)` desde la metadata.
- `account_type` según rol: `creator→creator`, `seeker→seeker`, `studio|brand→organization`.
- `INSERT accounts(...)` con `handle`, `display_name`, `location`, `website_url`, `plan='free'`.
- Ramas:
  - **creator** → `creator_profiles(practice, disciplines)` + `creator_employment(open_to_work)`; si hay archivo de verificación → fila en `creator_verifications(status='pending', submission_files)`.
  - **seeker** → `seeker_profiles(scout_practice, disciplines)`.
  - **studio | brand** → `organization_profiles(org_type, disciplines, industries, team_size)`; si hay método de verificación → fila en `organization_verifications(method, verification_data, status)`.
- `UPDATE users SET active_account_id = <account_id>`.
- **Fallback:** si no llega `role` en la metadata (p. ej. OAuth Google/Apple), se mantiene el comportamiento actual (cuenta `creator` por defecto), para no romper esos logins.

---

## 6. Mapeo campo → columna por rol

La metadata se construye en el cliente con **valores ya normalizados a enum**. El trigger solo inserta.

### Común (todos los roles) → `users`
| Onboarding/landing | Columna |
|---|---|
| email | `users.email` |
| firstName | `users.first_name` |
| lastName | `users.last_name` |
| birthYear (año de `dob`) | `users.birth_year` |
| country | `users.country_at_signup` |
| — | `users.auth_provider = 'email'` |

### Cuenta (todos) → `accounts`
| Onboarding | Columna | Notas |
|---|---|---|
| username (creator/seeker) · studioName/brandName (org) | `accounts.handle` | slug: lowercase, espacios→`_`; el trigger garantiza unicidad con sufijo de id como ya hace hoy |
| name · studioName · brandName | `accounts.display_name` | |
| country | `accounts.location` | |
| studioLink / brandLink | `accounts.website_url` | solo org |
| — | `accounts.plan = 'free'` | |
| — | `accounts.account_type` | creator→`creator`, seeker→`seeker`, studio/brand→`organization` |

### Creator → `creator_profiles` + `creator_employment`
| Onboarding (valor UI) | Columna | Enum destino |
|---|---|---|
| `practice` (CAREER_STAGES): Student / Early Career / Freelancer / Employer | `creator_profiles.practice` | `student` / `early_career` / `freelance` / `employer` |
| `selectedDisciplines` | `creator_profiles.disciplines` (text[]) | — |
| `availabilityStatus` (OPPORTUNITY_OPTIONS): Yes, actively looking / Depends on the project / Not right now / I don't know yet | `creator_employment.open_to_work` | `yes` / `depends_on_project` / `not_right_now` / `not_sure` |
| `projectPdfName` (si subió archivo) | `creator_verifications.submission_files` + `status='pending'` | — |

### Seeker → `seeker_profiles`
| Onboarding (valor UI) | Columna | Enum destino |
|---|---|---|
| `seekerPractice` (SEEKER_PRACTICE_OPTIONS): Recruiter / Talent Scout / Creative Lead / Producer / Casting / Founder / Entrepreneur | `seeker_profiles.scout_practice` | `recruiter_scout` / `creative_lead` / `producer_casting` / `founder` |
| (botón "skip") | — | `prefer_not_to_say` |
| `seekerDisciplines` | `seeker_profiles.disciplines` (text[]) | — |

> Arreglo incluido: dejar de descartar `seekerPractice` (volver a `useState('')` con valor leído).

### Studio / Brand → `organization_profiles` (+ `organization_verifications`)
| Onboarding (valor UI) | Columna | Enum/forma destino |
|---|---|---|
| rol studio→`studio`, brand→`brand` | `organization_profiles.org_type` | `studio` / `brand` |
| `studioDisciplines` / `brandDisciplines` | `organization_profiles.disciplines` (text[]) | — |
| `brandIndustry` (string única) | `organization_profiles.industries` (text[]) | `[brandIndustry]` |
| `teamSize` (TEAM_SIZE_OPTIONS): 1-3 people / 4–10 people / 11–25 people / 26–50 people / 50+ people | `organization_profiles.team_size` | `size_1_3` / `size_4_10` / `size_11_25` / `size_26_50` / `size_50_plus` |
| `studioVerificationMethod`/`brandVerificationMethod` + `…VerificationData` | `organization_verifications.method` + `verification_data` (jsonb) + `status='pending'` | — |

---

## 7. Pantalla de confirmación (UI)

Nueva pantalla **terminal** al final de los 4 flujos (creator/seeker/studio/brand). Se muestra cuando el handler del último paso de cada flujo activa un flag `profileCreated`.

- **Estética:** misma plantilla que la primera pantalla del onboarding (`<main>` `#fafafa`, `min-height:100vh`, centrada, `<OnboardingHeader />`).
- **Check ✓ sutil** sobre el título (icono pequeño, discreto).
- **Título:** "Welcome to BareFolio" (`var(--font-display)`, 24px, weight 400, letterSpacing -1px, color `#101010`).
- **Subtítulo:** "Your profile is ready, welcome to your new creative space on BareFolio." (`var(--font-sans)`, 14px, `#737373`, maxWidth ~300px).
- **Un solo botón sólido** "Enter to BareFolio" (`#101010` / `#fafafa`, mismo patrón que los botones Next/Finish). Al pulsar:
  1. `setLoading(true)`, construye la metadata normalizada (mapeos del §6) + lee el draft del §4.
  2. `supabase.auth.signUp({ email, password, options: { data: metadata } })`.
  3. Éxito → `clearSignupDraft()` → `router.push('/')`. Error → mensaje inline.
- **Se elimina** el botón "Have an Invitation Code" y cualquier referencia a `/invite`. La alerta flotante de invitación en Home es una **tarea futura aparte** (fuera de alcance aquí).

> La confirmación de email de Supabase: si el proyecto tiene "confirm email" activado, `signUp` devuelve `user` sin `session`. En ese caso, en vez de empujar a `/`, se mantiene al usuario en la pantalla con un aviso "revisa tu correo". (Comportamiento a verificar en el plan; hoy el código ya distingue `data.user && !data.session`.)

---

## 8. Reescritura del onboarding (`handleRegister`)

- Eliminar el `upsert` a `public.profiles`.
- `handleRegister` pasa a: leer draft → construir metadata normalizada (helpers de mapeo UI→enum) → `signUp` → navegar. Toda la creación de filas la hace el trigger.
- Los helpers de mapeo (CAREER_STAGES→practice, OPPORTUNITY→open_to_work, SEEKER_PRACTICE→scout_practice, TEAM_SIZE→team_size) viven en un módulo testeable (`src/lib/onboardingMappings.ts`).

---

## 9. Fuera de alcance (explícito)

- Subida real de archivos de verificación a Storage (hoy `projectPdfName` es un nombre mock; se guarda solo la referencia).
- La alerta/card flotante de invitaciones en Home.
- Borrar la tabla legacy `public.profiles`.
- Ampliar el esquema para guardar la fecha de nacimiento completa (solo `birth_year`).
- Verificación del OTP de email del landing (hoy es un paso visual sin validar).

---

## 10. Riesgos / notas

- **Unicidad de `handle`:** el trigger ya añade sufijo de id; mantenerlo para evitar choques.
- **RLS:** como el alta la hace el trigger (`SECURITY DEFINER`), no se necesitan políticas de INSERT para el flujo de registro; las de `seeker_profiles` se añaden por coherencia (lectura pública, escritura propia).
- **OAuth:** el fallback del trigger preserva el alta de Google/Apple (sin `role` → `creator`).
- **Idempotencia:** todos los `INSERT` del trigger usan `ON CONFLICT DO NOTHING` (como el actual).
