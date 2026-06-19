# Diseño — Pantalla de revisión (Business Document), tag de creator y email en dos pasos

**Fecha:** 2026-06-19
**Rama:** develop
**Alcance:** Afinar el flujo de registro de onboarding ya cableado. Tres ajustes en `src/app/onboarding/page.tsx` (más el componente `ProfileVerification` del mismo archivo). Sin cambios de esquema en Supabase.

---

## Contexto

El registro de onboarding ya está funcional: cada rol recoge su info y, al final, la pantalla terminal (`if (profileCreated)`) muestra "Welcome to BareFolio" cuyo botón "Enter to BareFolio" dispara un único `supabase.auth.signUp` y navega a Home (`/`). Este diseño NO reconstruye eso; lo refina con tres cambios:

1. **Creator** — etiqueta del botón + píldora verde "en revisión" en Welcome.
2. **Estudio/Brand** — email corporativo en dos pasos + nueva pantalla de revisión para el Business Document.
3. **Seeker** — sin cambios (ya llega a Welcome desde "Finish").

La diferencia conceptual clave: el **Business Document** es el único camino que **bloquea la entrada a la app** y manda a una pantalla de espera de 24h, porque requiere revisión humana de la titularidad. Creator-con-proyecto, email corporativo y LinkedIn entran a la app normalmente.

## Modelo de ruteo (confirmado)

| Camino | Resultado |
|---|---|
| Creator sube proyecto | Welcome **con píldora verde "Project under review"** → entra a la app |
| Creator "Skip for now" | Welcome normal → entra |
| Estudio/Brand · Email corporativo | (paso código) → Welcome normal → entra |
| Estudio/Brand · LinkedIn | Welcome normal → entra |
| Estudio/Brand · Business Document | **Pantalla de Revisión nueva** (mensaje de 24h) → **NO entra** a la app |
| Seeker · "Finish" | Welcome normal → entra |

---

## Sección 1 — Creator

### Pantalla 4 "Verify your creative profile"
- El botón sólido inferior-derecha que hoy muestra `"Send"` cuando hay proyecto adjunto (`profileStep === 4 && !!projectPdfName`) pasa a mostrar **`"Next"`**. El `onClick` sigue siendo `profileFinish` (sin cambios de comportamiento).
- El camino "Skip for now" → alerta → "Skip" → `profileFinish` queda igual.

### Pantalla Welcome (variante creator)
- Si `role === 'creator'` y `projectPdfName !== ''`, se renderiza una **píldora verde** entre el subtítulo y el botón "Enter to BareFolio":
  - punto verde relleno + texto `"Project under review"`.
  - fondo verde claro, texto verde oscuro (tokens consistentes con la paleta del onboarding; p. ej. fondo `#e7f6ec` / texto `#157347` / punto `#157347`).
- Si el creator hizo "Skip" (`projectPdfName === ''`), NO se muestra la píldora.
- El botón "Enter to BareFolio" no cambia: dispara `handleRegister` → Home.

---

## Sección 2 — Estudio/Agencia y Company/Brand

### Email corporativo (componente `ProfileVerification`, compartido por studio y company)
- Hoy el botón `"Verify email"` (pantalla `screen === 'email'`) llama a `onComplete('email', corporateEmail)` y finaliza, **saltándose** la pantalla del código.
- Cambio: `"Verify email"` ahora **avanza a la pantalla del código** (`screen === 'emailCode'`) en vez de finalizar. Se mantiene `disabled` cuando `corporateEmail` está vacío.
- En `emailCode`, el botón `"Confirm code"` sigue llamando a `onComplete('email', corporateEmail)` → finaliza → Welcome → "Enter to BareFolio" → Home. (Ahora es correctamente el paso terminal.)
- El flujo del código es mock (no se envía email real); no se añade validación nueva.

### LinkedIn
- Sin cambios. `"Continue with LinkedIn"` → `onComplete('social', 'linkedin')` → Welcome → Home.

### Business Document
- `"Submit Document"` → **dispara el registro** (`signUp`, cuenta en estado pendiente) y va a la **pantalla de Revisión nueva** (NO Welcome, NO Home).
- Contenido de la pantalla de Revisión (en inglés, estilo Welcome pero diferenciada):
  - Ícono de **reloj** (`Clock` de lucide-react) dentro del círculo oscuro `#101010` (en vez del `Check`).
  - Título (`var(--font-display)`, 24px, weight 400, `-1px`, `#101010`): `"We're reviewing your account"`.
  - Subtítulo (`var(--font-sans)`, 14px, `#737373`), con label según rol:
    - studio → `"We're verifying that you own this Studio / Agency. You'll receive a confirmation within 24 hours."`
    - brand → `"We're verifying that you own this Company / Brand. You'll receive a confirmation within 24 hours."`
  - El label se deriva de `role`: `role === 'studio' ? 'Studio / Agency' : 'Company / Brand'`. Nunca aparecen "Studio" y "Brand" a la vez.
  - Un botón discreto: `"Back to home"` → navega a la landing `/` (el usuario no entra a la app).
  - Estructura visual idéntica a Welcome (`<main>` `#fafafa`, `OnboardingHeader`, centrado).

---

## Sección 3 — Estado y flujo de datos

### Estado nuevo
- `const [pendingReview, setPendingReview] = useState(false);`

### Bloque terminal (`if (profileCreated)`)
- Si `pendingReview` → renderiza la variante **Revisión** (con label según `role`).
- Si no → renderiza la variante **Welcome** (con la píldora verde condicional para creator con proyecto).

### Ruteo del Business Document
- En los call sites de `onComplete` de studio (`studioStep === 3`) y company (`companyStep === 3`):
  - cuando `method === 'document'`: fijar método/datos de verificación, `setPendingReview(true)`, `setProfileCreated(true)`, y disparar el registro.
  - cuando `method !== 'document'` (email/social): comportamiento actual (`studioFinish` / `companyFinish` → `setProfileCreated(true)` → Welcome).
- Para evitar el problema de estado asíncrono (los campos de verificación se fijan con `setState` justo antes de registrar), el `signUp` se dispara **pasando el método/datos de verificación explícitamente** al camino de registro, o vía un `useEffect` que reaccione a `pendingReview === true`, de modo que el metadata de `buildSignupMetadata` incluya la verificación por documento. La decisión concreta (parámetro explícito vs. `useEffect`) se fija en el plan; el requisito es que el `signUp` del camino documento lleve `verification_method='documentation'` y su `verification_data`.

### `handleRegister` (destino según caso)
- Al completar con éxito:
  - si `pendingReview` → **permanece en la pantalla de Revisión** (no navega; la cuenta pendiente ya quedó creada).
  - si no → comportamiento actual: `setRegistered(true)` si `data.user && !data.session`, o `router.push('/')`.

### Backend
- Sin cambios de esquema. El trigger `handle_new_user` ya inserta `organization_verifications` con `status='pending'` cuando `verification_method='documentation'` (constraint `organization_verifications_method_check` admite `documentation`). Por tanto "cuenta pendiente de revisión" queda satisfecho tal cual: la cuenta + `organization_profiles` + `organization_verifications(status='pending')` se crean, y el gate de acceso real (impedir uso de la app hasta `approved`) es un tema aparte/futuro, fuera de este alcance.

---

## No-objetivos (YAGNI)

- No se construye el gate de acceso que bloquea la app hasta `approved` (futuro).
- No hay tag "en revisión" para email/LinkedIn ni para estudio/brand fuera del Business Document.
- No se toca el seeker (ya cumplido).
- No se integra OAuth real de LinkedIn ni envío real de email (siguen mock).
- No se refactoriza el bloque terminal a un componente aparte (se mantiene inline, Enfoque A).

## Estándar de verificación

- `npx tsc --noEmit` limpio.
- `npx eslint src/app/onboarding/page.tsx` sin problemas NUEVOS sobre el baseline del archivo.
- e2e manual por el túnel cloudflared:
  - creator con proyecto → Welcome con píldora verde → entra; creator skip → Welcome sin píldora → entra.
  - studio/brand email → paso código → "Confirm code" → Welcome → entra.
  - studio/brand LinkedIn → Welcome → entra.
  - studio/brand Business Document → pantalla de Revisión (label correcto según rol) → NO entra.
- Inspección de filas (Supabase) para el camino documento: cuenta + `organization_profiles` + `organization_verifications(status='pending', method='documentation')`. Confirmar que email/LinkedIn entran a Home y que `profiles` (legacy) no se escribe.
