# BareFolio — Verificación real de email por OTP (Resend) + creación de cuenta en servidor

**Fecha:** 2026-06-20
**Rama:** `develop` (luego espejo a `main` / Vercel)
**Estado:** Diseño aprobado por el usuario; pendiente de su revisión escrita antes del plan.

> Continuación de `2026-06-19-onboarding-registration-wiring-design.md`, que dejó la verificación del OTP **fuera de alcance** (su §9). Este spec la implementa.

---

## 1. Objetivo

Sustituir el paso de OTP **falso** del landing (hoy solo comprueba que el código tenga 5 dígitos) por una verificación **real**:

1. Códigos de **5 dígitos generados automáticamente en el servidor**, aleatorios y cripto-seguros, cada vez que alguien pide verificar su email.
2. El correo con el código se envía por **Resend** (no por el OTP de Supabase, cuyo límite y comportamiento no nos sirven), con una plantilla con la marca BareFolio.
3. La **creación de la cuenta se mueve del cliente al servidor**: una API route con la *service-role key* crea la cuenta ya confirmada (`admin.createUser({ email_confirm: true })`) solo si el email ha sido verificado. El trigger `handle_new_user` (ya existente) sigue creando todas las filas de perfil a partir del `user_metadata`.
4. Se eliminan los flags de desarrollo que permiten saltarse la validación: `DEV_BYPASS` (onboarding) y `NEXT_PUBLIC_SIGNUP_PREVIEW` (landing).

**Nivel de seguridad elegido:** estricto (servidor). Es **imposible** crear la cuenta sin que el servidor haya verificado el código.

---

## 2. Estado actual (lo que cambia)

- **Landing (`src/app/page.tsx`):** el paso `verify` solo hace `if (!SIGNUP_PREVIEW && code.length < 5) …`. No se envía ni se valida ningún código real. Comentario `// TODO: verify the OTP against Supabase before continuing.`
- **Onboarding (`src/app/onboarding/page.tsx`):** `handleRegister` hace `supabase.auth.signUp(...)` **en cliente** con la anon key. Detrás del flag hardcoded `const DEV_BYPASS = true` que (a) salta el `signUp` real y (b) desactiva todas las validaciones.
- **`.env.local`:** `NEXT_PUBLIC_SIGNUP_PREVIEW=true` desactiva las validaciones del landing.
- **Backend:** el trigger `on_auth_user_created → handle_new_user` (en `auth.users`, `SECURITY DEFINER`) ya está listo y lee exactamente las claves que produce `buildSignupMetadata` (`src/lib/onboardingMappings.ts`). **No se toca.**

### Hecho confirmado del backend

`handle_new_user` se dispara con **cualquier** `INSERT` en `auth.users`, incluido el de `auth.admin.createUser`. Por tanto, crear la cuenta con la admin API provoca igualmente la creación de `users` + `accounts` + perfil de rol. El cambio de cliente→servidor **no** requiere tocar el trigger.

---

## 3. Arquitectura del flujo

```
LANDING                                  SERVIDOR (API routes)              SUPABASE
──────────                               ─────────────────────             ─────────────
[paso email] introduce email
        │ al entrar al paso verify
        ▼
   POST /api/otp/send {email} ─────────► genera código 5 díg.
                                         guarda hash en email_otps  ──────► INSERT email_otps
                                         envía por Resend ──► 📧 código
[paso verify] introduce código
        │
        ▼
   POST /api/otp/verify {email,code} ──► valida caducidad/intentos
                                         compara hash → verified_at ✓ ────► UPDATE email_otps
        │ éxito → avanza
        ▼
[personal] → [password] → setSignupDraft (memoria) → router.push('/onboarding')

ONBOARDING (pasos sin cambios)
   ...último paso "Enter to BareFolio":
        ▼
   handleRegister:
   POST /api/auth/register {email,password,metadata} ─► ¿email_otps verificado,
                                                         reciente, sin consumir?
                                                         │ sí
                                                         ▼
                                                       admin.createUser(
                                                         email_confirm:true,
                                                         user_metadata:metadata) ─► trigger handle_new_user
                                                       marca consumed_at  ────────► users+accounts+perfil
        │ éxito
        ▼
   supabase.auth.signInWithPassword(email,password) → sesión → router.push('/')
```

### Decisiones clave

- **La BD es la única fuente de verdad** de "este email está verificado". El cliente no arrastra ningún token/permiso falsificable; solo lleva el `email` (que ya lleva en el `signupDraft`). `/api/auth/register` re-consulta `email_otps`.
- **`signUp` (cliente) → `admin.createUser` (servidor).** El cliente deja de crear la cuenta. La crea el servidor con la service-role key, ya confirmada.
- **OTP temprano, cuenta al final.** Se mantiene el diseño actual (verificación en el landing; cuenta al final del onboarding). La fila verificada de `email_otps` vive una **ventana de 1 hora** para cubrir el onboarding.
- **Resend ya está integrado** (patrón `render()` de react-email + `new Resend(...)`), reutilizamos exactamente ese patrón de `src/app/api/waitlist/route.ts`.

---

## 4. Cambios de esquema en Supabase (migración)

Una sola migración (`apply_migration`):

```sql
CREATE TABLE public.email_otps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  code_hash   text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    int         NOT NULL DEFAULT 0,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_otps_email_created_idx
  ON public.email_otps (email, created_at DESC);

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
-- Sin políticas a propósito: ni anon ni authenticated pueden acceder.
-- Solo la service-role key (que ignora RLS) lo usa desde el servidor.
```

- **`code_hash`:** SHA-256 hex del código en texto. Nunca se guarda el código en claro.
- **RLS sin políticas:** bloqueo total para el cliente; el servidor entra con service-role.
- El `email` se normaliza siempre a `trim().toLowerCase()` antes de escribir/consultar.

---

## 5. Variables de entorno

| Variable | Ámbito | Notas |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** (sin `NEXT_PUBLIC`) | Nueva. La pega el usuario desde Supabase → Project Settings → API → `service_role`. En `.env.local` y luego en Vercel. |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + servidor | Ya existe. |
| `RESEND_API_KEY`, `RESEND_FROM` | Servidor | Ya existen. |
| `NEXT_PUBLIC_SIGNUP_PREVIEW` | Cliente | Se pasa a `false` (o se elimina) en `.env.local`. |

**Config de Supabase (manual, en el dashboard):** desactivar **Authentication → Providers → Email → Confirm email**. Como creamos la cuenta con `email_confirm: true` vía admin, Supabase no envía ningún correo y no aplica su límite de OTP.

---

## 6. Módulos y archivos

### 6.1 `src/lib/otp.ts` (helpers puros, sin I/O)
```ts
export const OTP_LENGTH = 5;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;          // 10 min
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;      // 60 s
export const OTP_VERIFIED_WINDOW_MS = 60 * 60 * 1000; // 1 h

// 5 dígitos cripto-seguros, con ceros a la izquierda ('00000'–'99999').
export function generateCode(): string;
// SHA-256 hex (node:crypto).
export function hashCode(code: string): string;
export function normalizeEmail(email: string): string; // trim().toLowerCase()
```

### 6.2 `src/lib/supabaseAdmin.ts` (cliente solo-servidor)
```ts
import { createClient } from '@supabase/supabase-js';
// Lee NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Lanza error claro si falta la service-role key.
// autoRefreshToken:false, persistSession:false.
export const supabaseAdmin = createClient(url, serviceKey, { auth: { autoRefreshToken:false, persistSession:false } });
```
> Nunca debe importarse desde un componente cliente. Solo desde rutas `/api/*`.

### 6.3 `src/emails/OtpEmail.tsx` (react-email, marca BareFolio)
- Misma base que `WaitlistConfirmation.tsx` (fuente Geist, card blanca, logo, dark-mode).
- Muestra el **código de 5 dígitos** en grande y monoespaciado/espaciado.
- Texto: "Your verification code" + el código + "It expires in 10 minutes. If you didn't request this, ignore this email."
- Props: `{ code: string }`.

### 6.4 API routes

**`POST /api/otp/send`** — body `{ email }`
1. Rate-limit por IP (reutiliza `rateLimit`, 5/min) → 429 si excede.
2. `normalizeEmail`.
3. Cooldown por email: si existe una fila de ese email con `created_at > now()-60s`, devolver 429 con `retryAfter`.
4. Limpieza oportunista: `DELETE FROM email_otps WHERE email = $1 AND expires_at < now()`.
5. `generateCode()`, `hashCode()`, `INSERT` fila (`expires_at = now()+10min`).
6. `render(OtpEmail({code}))` + `resend.emails.send(...)` (mismo patrón que waitlist; from `RESEND_FROM`).
7. En `NODE_ENV !== 'production'`: `console.info('[otp] code for', email, '=', code)`.
8. Responde `{ success: true }`.

**`POST /api/otp/verify`** — body `{ email, code }`
1. `normalizeEmail`.
2. Selecciona la fila **más reciente** del email sin consumir: `WHERE email=$1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`.
3. Si no hay fila → `{ error: 'no_code' }` (pide reenviar).
4. Si `expires_at < now()` → `{ error: 'expired' }`.
5. Si `attempts >= 5` → `{ error: 'too_many_attempts' }`.
6. `UPDATE … SET attempts = attempts + 1`. Comparar `hashCode(code)` con `code_hash`:
   - Igual → `UPDATE … SET verified_at = now()` → `{ success: true }`.
   - Distinto → `{ error: 'invalid', attemptsLeft }`.

**`POST /api/auth/register`** — body `{ email, password, metadata }`
1. `normalizeEmail`.
2. Busca fila válida: `WHERE email=$1 AND verified_at IS NOT NULL AND consumed_at IS NULL AND verified_at > now()-1h ORDER BY created_at DESC LIMIT 1`.
3. Si no hay → `403 { error: 'not_verified' }`.
4. `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata })`.
   - Error de email duplicado → `409 { error: 'email_exists' }`.
   - Otro error → `500`.
5. `UPDATE email_otps SET consumed_at = now() WHERE id = <fila>`.
6. Responde `{ success: true, userId }`.

> `metadata` es el objeto que ya produce `buildSignupMetadata` (datos de perfil, no sensibles). Lo construye el cliente y lo envía. El único gate de seguridad es la verificación del email en BD.

---

## 7. Cambios en el cliente

### 7.1 Landing (`src/app/page.tsx`)
- **Eliminar `SIGNUP_PREVIEW`** y todos sus usos (las validaciones pasan a estar siempre activas).
- **Código de invitación (paso `invite`):** hoy ese paso solo exige texto no vacío (`inviteCode.trim()`), **no** se valida contra ningún backend. Al quitar `SIGNUP_PREVIEW`, el paso pasa a ser **obligatorio** (cualquier texto sirve, pero hay que escribir algo). Validar de verdad los códigos de invitación queda **fuera de alcance** de este spec (ver §11). Decisión a confirmar con el usuario: mantener el gate obligatorio-sin-validar, o dejar el paso saltable por ahora.
- Al **entrar al paso `verify`** (tras validar email + coincidencia): llamar a `POST /api/otp/send`. Manejar 429 (cooldown → arrancar `otpSeconds`).
- Botón **"Resend"**: re-llama a `/api/otp/send`; deshabilitado durante el cooldown (la UI ya tiene `otpSeconds`).
- En el paso `verify`, al pulsar continuar: `POST /api/otp/verify { email, code }`.
  - Éxito → `setSignupStep('personal')`.
  - Error → mensaje inline según código (`invalid` con intentos restantes, `expired`, `too_many_attempts`, `no_code`).
- El resto del flujo (personal → password → `setSignupDraft` → `/onboarding`) **sin cambios**.

### 7.2 Onboarding (`src/app/onboarding/page.tsx`)
- **Eliminar `DEV_BYPASS`** y todos sus usos → validaciones activas + sin seed de draft falso (si no hay draft, redirige a `/`, ya implementado).
- `handleRegister`:
  - Construye `metadata` con `buildSignupMetadata` (igual que hoy).
  - **Sustituye** `supabase.auth.signUp(...)` por `fetch('/api/auth/register', { method:'POST', body: JSON.stringify({ email, password, metadata }) })`.
  - Éxito y **no** `pendingReview`: `supabase.auth.signInWithPassword({ email, password })` → `clearSignupDraft()` → `router.push('/')`.
  - Éxito y `pendingReview` (ruta de documento de negocio): no iniciar sesión, quedarse en la pantalla de revisión (igual que hoy).
  - Error `email_exists` → mensaje "An account with this email already exists."; `not_verified` → mensaje + devolver al inicio.
- La pantalla `registered` ("Verify your Email" con el tip de Supabase) **se elimina/queda inalcanzable**: ya no usamos la confirmación por correo de Supabase. (La cuenta se crea ya confirmada.)

---

## 8. Manejo de errores (resumen UX)

| Situación | Respuesta API | Mensaje al usuario |
|---|---|---|
| Código incorrecto | `{error:'invalid', attemptsLeft}` | "Incorrect code. N attempts left." |
| 5 fallos | `{error:'too_many_attempts'}` | "Too many attempts. Request a new code." |
| Código caducado | `{error:'expired'}` | "This code expired. Request a new one." |
| Sin código emitido | `{error:'no_code'}` | "Request a code first." |
| Reenvío < 60 s | 429 + `retryAfter` | botón deshabilitado con cuenta atrás |
| Email ya registrado | 409 `email_exists` | "An account with this email already exists." |
| Registro sin verificar | 403 `not_verified` | "Verify your email first." → volver al paso verify |
| Falta service-role key | 500 (log servidor) | error genérico; nunca expone config |

---

## 9. Seguridad

- Código **hasheado** (SHA-256) en reposo; nunca en claro en BD ni en logs de producción.
- Tabla `email_otps` bajo **RLS sin políticas**: inaccesible para el cliente.
- **Rate-limit** en `send` (5/min/IP) y **cooldown** por email (60 s); `verify` limitado por `attempts` (5) + caducidad (10 min) → fuerza bruta online inviable (100 000 combinaciones, máx. 5 intentos por código).
- La cuenta **solo** se crea tras verificación confirmada en BD; el cliente no puede saltarse el gate.
- La `service_role` key vive solo en el servidor; nunca se expone con `NEXT_PUBLIC`.
- La contraseña viaja a `/api/auth/register` por HTTPS (igual que iría a Supabase); nunca se persiste en disco ni en la URL.

---

## 10. Verificación (no hay framework de tests)

- `npx tsc --noEmit` limpio.
- `npx eslint <archivos tocados>` sin nuevos problemas sobre el baseline.
- **Prueba end-to-end real** con el dev server: `send` (leer el código del log de dev o del correo) → `verify` → `register`; luego consultar Supabase (MCP) para confirmar filas en `users` / `accounts` / `creator_profiles`; **borrar** el usuario de prueba y su fila de `email_otps` al terminar.
- Comprobar los caminos de error: código incorrecto, caducado, reenvío en cooldown, registro sin verificar (403).

---

## 11. Fuera de alcance (explícito)

- Verificación del OTP en **login** (este spec cubre solo el alta/signup).
- Reenvío del correo de bienvenida/confirmación de marca tras el alta (la cuenta entra directa a la app).
- Internacionalización de los textos de error (quedan en inglés, como el resto del onboarding).
- Subida real de archivos de verificación a Storage (sigue fuera, como en el spec previo).
- Limpieza programada (cron) de `email_otps`: solo limpieza oportunista en `send`.
- **Validación real de códigos de invitación** contra un backend (el paso `invite` del landing). Tras quitar `SIGNUP_PREVIEW` queda como gate obligatorio sin validar; verificarlos de verdad es una tarea aparte.

---

## 12. Riesgos / notas

- **Refresco a mitad de onboarding:** el `signupDraft` está en memoria; si el usuario refresca, se pierde y se le redirige a `/` (comportamiento ya existente). La fila verificada de `email_otps` sigue válida 1 h, así que al rehacer el landing con el mismo email no necesita re-verificar si está dentro de la ventana — pero como el draft se perdió, repetirá el flujo igualmente. Asumible.
- **Doble disparo (StrictMode):** el envío de OTP al entrar al paso `verify` debe protegerse contra el doble montaje de React en dev (guard con `useRef`, como ya hace `reviewFired`).
- **`admin.createUser` e idempotencia:** si el trigger ya insertó filas con `ON CONFLICT DO NOTHING`, un reintento no duplica. Pero `admin.createUser` con email existente devuelve error → lo mapeamos a `email_exists`.
- **Migración a Vercel:** recordar añadir `SUPABASE_SERVICE_ROLE_KEY` en las env de Vercel antes de desplegar a producción, o `/api/auth/register` fallará con 500.
