# Plataforma interna de staff — Fundación — Diseño técnico

**Fecha:** 2026-08-05
**Rama:** `develop`
**Estado:** Aprobado (pendiente de revisión del spec)
**Base:** `2026-07-02-internal-staff-platform-design.md` (documento de exploración)

> Este documento **sí** es un diseño técnico: define esquema, módulos, límites y
> pruebas para construir. Cubre **solo la fundación** de la plataforma interna.
> Cada módulo funcional (verificaciones, reportes, waitlist…) tendrá después su
> propio spec y su propio plan.

---

## 1. Alcance

### 1.1 Qué cubre este spec

La **capa de staff**: identidad del equipo, roles, aplicación de permisos, registro
de auditoría y el esqueleto del panel. Es la pieza de la que dependen todos los
módulos: sin saber quién eres y qué puedes hacer, ningún módulo puede existir. El
documento de exploración (§3.3) la identifica como inexistente hoy.

### 1.2 Qué NO cubre

Los nueve módulos funcionales quedan fuera y van cada uno con su spec:
verificaciones, reportes/moderación, waitlist + invite codes, cuentas y usuarios,
notificaciones/comunicaciones, analítica, export CSV y suscripciones.

De las siete preguntas abiertas de la exploración, este spec resuelve las tres
**arquitectónicas** (1, 4 y 6). Las otras cuatro pertenecen al módulo donde se
usan y se deciden allí, con el contexto delante:

| Pregunta abierta | Dónde se resuelve |
|---|---|
| 1. Identidad del staff | **Aquí** (§3) |
| 4. Estructura del audit log | **Aquí** (§5) |
| 6. Ubicación de la interfaz | **Aquí** (§2) |
| 2. Representación del baneo | Spec del módulo de Cuentas |
| 3. Notas internas / ficha | Spec del módulo de Cuentas |
| 5. Puente waitlist ↔ invite | Spec del módulo de Waitlist |
| 7. Histórico de suscripciones | Aparcado hasta que exista Stripe |

### 1.3 Criterio de "terminado"

1. Un Superadmin entra en `/admin` con contraseña **y** segundo factor TOTP.
2. Da de alta a un miembro con su rol; esa persona enrola su MFA y entra.
3. La navegación y las rutas muestran **solo** lo que su rol permite.
4. Toda acción con efecto aparece en el feed de auditoría con actor, objeto y fecha.
5. Un usuario de staff **no** genera cuenta ni handle de producto.

---

## 2. Arquitectura y acceso

### 2.1 Ubicación

`/admin/*` dentro de la app Next.js existente (Next 16.2.6).

**Por qué aquí y no en una app aparte ni en Retool.** Reutiliza `supabaseAdmin`,
Resend, `database.types.ts` y el pipeline de deploy ya en marcha; los documentos de
verificación (PII) nunca salen de la propia infraestructura; y el audit log es
propio, que es la regla de oro nº 3 de la exploración. Para un equipo de 1–5
personas, una segunda app o una herramienta externa añade coste de mantenimiento o
un tercero en la cadena de custodia de datos sensibles sin ganancia proporcional.

**Coste asumido:** comparte deploy con la web pública, y hay que excluir `/admin`
del build nativo.

### 2.2 Convivencia con el build de Capacitor

`next.config.ts` activa `output: "export"` cuando `NEXT_CAPACITOR === "1"`. El panel
depende de middleware y rutas de servidor, y **`output: "export"` no soporta
middleware**: son incompatibles por diseño, no por configuración.

Esto **no es un problema nuevo introducido por el panel**: la app ya tiene rutas
`/api/*` (registro, OTP, waitlist), que tampoco funcionan en un export estático —
por eso el propio `next.config.ts` documenta que `output: "export"` se quitó para
el deploy web. El panel simplemente hereda esa misma restricción.

**Requisito para quien implemente:** antes de añadir el middleware hay que
comprobar en `node_modules/next/dist/docs/` qué hace exactamente esta versión de
Next ante `output: "export"` + `middleware.ts`, y confirmar si el build nativo
falla o lo ignora. Si falla, la vía es condicionar el middleware al build
(no incluirlo cuando `NEXT_CAPACITOR === "1"`), no intentar excluir la ruta con
`rewrites()`: los rewrites no se aplican en un export estático, así que **añadir
`/admin` a `PLATFORM_PATHS` no serviría** para este caso.

No se da por resuelto aquí porque depende del comportamiento concreto de Next
16.2.6, que hay que leer y no suponer.

### 2.3 Sesión

Supabase Auth con **cookies en servidor**. Requiere añadir la dependencia
**`@supabase/ssr`** (hoy solo está `@supabase/supabase-js@^2.106.1`).

`src/middleware.ts` (no existe hoy) intercepta `/admin/*` antes de que la request
llegue a la página y:

1. Refresca la sesión de Supabase.
2. Sin sesión → redirige a `/admin/login`.
3. Con sesión pero `currentLevel !== 'aal2'` → redirige a `/admin/mfa`.
4. Con sesión válida pero sin fila **activa** en `staff_members` → cierra sesión y
   redirige a `/admin/login` con motivo `not_staff`.

Excepciones del matcher: `/admin/login` y `/admin/mfa` (si no, bucle de redirección).

> **Nota de implementación.** `AGENTS.md` avisa de que esta versión de Next tiene
> cambios de API respecto al conocimiento general. Antes de escribir el middleware
> y las rutas hay que leer las guías en `node_modules/next/dist/docs/`.

### 2.4 Cómo se aplican los permisos

**El problema.** Todo el acceso a datos sensibles va por `service_role`, que
**se salta RLS por diseño**. Por tanto RLS no puede ser la autoridad de
autorización: quedaría desactivada justo donde importa.

**La decisión.** Un **punto único de control** en servidor:

- La matriz de accesos de la exploración (§5) se codifica **como dato** en
  `src/lib/admin/capabilities.ts`. Única fuente de verdad.
- Toda página y ruta de `/admin` llama a `requireCapability(cap)` antes de tocar
  datos. No se comprueban roles sueltos por ahí: se comprueban **capacidades**.
- RLS se mantiene activo en las tablas de staff como **defensa en profundidad**,
  no como autoridad.

Alternativas descartadas: comprobar el rol en cada ruta (la regla vive repetida en
N sitios y basta olvidarla una vez), y RLS como autoridad (incompatible con
`service_role`).

### 2.5 Catálogo de capacidades

Derivado literalmente de la matriz §5 de la exploración.

| Capacidad | Superadmin | Staff | Verificador | Soporte |
|---|:--:|:--:|:--:|:--:|
| `verifications.view` | ✅ | ✅ | ✅ | ✅ |
| `verifications.review` | ✅ | ✅ | ✅ | — |
| `reports.view` | ✅ | ✅ | — | ✅ |
| `reports.resolve` | ✅ | ✅ | — | ✅ |
| `accounts.view` | ✅ | ✅ | ✅ | ✅ |
| `accounts.note` | ✅ | ✅ | — | ✅ |
| `accounts.ban` | ✅ | ✅ | — | — |
| `accounts.ban_propose` | ✅ | ✅ | — | ✅ |
| `accounts.edit` | ✅ | — | — | — |
| `waitlist.view` | ✅ | ✅ | — | — |
| `invites.manage` | ✅ | ✅ | — | — |
| `analytics.view` | ✅ | ✅ | — | — |
| `comms.send` | ✅ | ✅ | — | ✅ |
| `export.csv` | ✅ | ✅ | — | ✅ |
| `team.manage` | ✅ | — | — | — |
| `audit.view` | ✅ | — | — | — |

Notas que eliminan ambigüedad de la exploración:

- **`accounts.edit` solo Superadmin.** Es la regla de oro; el test la fija (§7).
- **Analítica para Verificador y Soporte:** la exploración la marcaba "opcional".
  Se decide **no concederla**, por mínimo privilegio (principio nº 1). Revertirlo
  es cambiar una línea de la matriz.
- **`accounts.ban_propose`** existe para que Soporte proponga sin ejecutar. La
  propuesta como entidad se modela en el spec del módulo de Cuentas; aquí solo se
  reserva la capacidad.
- **`export.csv` de Soporte** está acotado "a su ámbito"; el acotado real lo aplica
  cada módulo al filtrar sus datos.

---

## 3. Identidad del staff

Supabase Auth (el motor que ya se usa) más una tabla `staff_members` que mapea
usuario → rol. Reutiliza la infraestructura existente, trae MFA/TOTP nativo, y dar
de baja a alguien es una operación de una fila.

### 3.1 Alta de un miembro

Solo con `team.manage` (Superadmin). En `POST /api/admin/staff`:

1. `supabaseAdmin.auth.admin.createUser({ email, email_confirm: true,
   user_metadata: { is_staff: true } })`.
2. Insertar la fila en `staff_members` con el `id` devuelto y el rol elegido.
3. Si (2) falla, borrar el usuario de auth creado en (1) para no dejar huérfanos.
4. Registrar `staff.create` en el audit log.

La marca `is_staff: true` es la que consume el trigger (§4.4) para no crear cuenta
de producto.

### 3.2 Baja

**Baja lógica, nunca borrado**: `is_active = false` y `deactivated_at = now()`. Si
se borrara la fila, el audit log perdería a quién apunta cada acción, y un rastro
que apunta a nadie no es un rastro. Por eso `staff_audit_log` referencia
`staff_members` y esta tabla nunca recibe `DELETE`.

### 3.3 Arranque en frío

Solo un Superadmin puede crear staff, pero al principio no hay ninguno. Se resuelve
con un SQL puntual ejecutado una vez en Supabase Studio, documentado en la
migración, que inserta la fila del fundador a partir de su `auth.users.id`. Esa
fila lleva `created_by = NULL`, lo que la identifica inequívocamente como bootstrap.

---

## 4. Migraciones

### 4.1 `010_staff_identity_and_audit.sql`

**Enum de roles**

```sql
CREATE TYPE public.staff_role_enum AS ENUM
  ('superadmin', 'staff', 'verifier', 'support');
```

**Tabla `staff_members`**

```sql
CREATE TABLE public.staff_members (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  role            public.staff_role_enum NOT NULL,
  display_name    text NOT NULL,
  email           text NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES public.staff_members(id),
  deactivated_at  timestamptz
);
```

`ON DELETE RESTRICT` impide que borrar un usuario de auth arrastre silenciosamente
al miembro de staff y rompa el rastro de auditoría.

**Tabla `staff_audit_log`**

```sql
CREATE TABLE public.staff_audit_log (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_staff_id  uuid NOT NULL REFERENCES public.staff_members(id),
  action          text NOT NULL,
  entity_type     text NOT NULL,
  entity_id       text,
  diff            jsonb,
  ip              inet,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX staff_audit_log_created_at_idx ON public.staff_audit_log (created_at DESC);
CREATE INDEX staff_audit_log_actor_idx      ON public.staff_audit_log (actor_staff_id, created_at DESC);
```

`entity_id` es `text` para que sirva igual a un UUID de Supabase que a un id de
registro de Airtable. `diff` guarda `{"before": …, "after": …}`.

**Append-only real**

```sql
REVOKE UPDATE, DELETE ON public.staff_audit_log FROM anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.staff_audit_log_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'staff_audit_log is append-only';
END;
$$;

CREATE TRIGGER staff_audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON public.staff_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.staff_audit_log_immutable();
```

Los permisos por sí solos no bastan: una migración con privilegios elevados los
saltaría. El trigger es lo que lo hace real.

**Guarda del último Superadmin**

```sql
CREATE OR REPLACE FUNCTION public.staff_members_protect_last_superadmin()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role = 'superadmin' AND OLD.is_active
     AND (NEW.role <> 'superadmin' OR NOT NEW.is_active) THEN
    IF (SELECT count(*) FROM public.staff_members
        WHERE role = 'superadmin' AND is_active AND id <> OLD.id) = 0 THEN
      RAISE EXCEPTION 'cannot demote or deactivate the last active superadmin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER staff_members_last_superadmin
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.staff_members_protect_last_superadmin();
```

Sin esto, un despiste deja la plataforma sin nadie capaz de gestionar el equipo.

**Vista `staff_audit_feed`**

```sql
CREATE VIEW public.staff_audit_feed AS
SELECT l.id, l.created_at, l.action, l.entity_type, l.entity_id, l.diff,
       l.actor_staff_id, s.display_name AS actor_name, s.email AS actor_email, s.role AS actor_role
FROM public.staff_audit_log l
JOIN public.staff_members s ON s.id = l.actor_staff_id;
```

Es el feed cronológico del Superadmin y establece el patrón de **vistas por
módulo** acordado: cada módulo añadirá después su propia vista sobre esta misma
tabla genérica (p. ej. `verification_audit_feed` filtrando por
`entity_type = 'creator_verification'`), sin necesidad de nuevas tablas.

**RLS y permisos** (mismo patrón que la migración 008)

```sql
ALTER TABLE public.staff_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.staff_members, public.staff_audit_log, public.staff_audit_feed
  FROM anon, authenticated;

CREATE POLICY staff_members_self_read ON public.staff_members
  FOR SELECT TO authenticated USING (id = auth.uid());
```

La única policy permite a un miembro leer **su propia** fila, lo justo para
resolver su sesión. Todo lo demás pasa por `service_role`.

**Bootstrap (documentado, ejecución manual y única)**

```sql
-- Sustituir por el auth.users.id real del fundador antes de ejecutar.
-- INSERT INTO public.staff_members (id, role, display_name, email, created_by)
-- VALUES ('<AUTH_USER_UUID>', 'superadmin', 'Víctor Chaves', 'victxrchaves@gmail.com', NULL);
```

### 4.2 `011_handle_new_user_skip_staff.sql`

Reescribe `handle_new_user` partiendo de la versión vigente de **009** (la
fail-closed), dejando todo byte a byte igual salvo una salida temprana insertada
justo después del bloque `DECLARE`, antes del cálculo de `base_handle`:

```sql
BEGIN
  -- Los miembros del staff no son cuentas de producto: no se les crea fila en
  -- users/accounts ni se les reserva handle.
  IF COALESCE(meta->>'is_staff', '') = 'true' THEN
    RETURN NEW;
  END IF;
  ...
```

> **Importante para quien implemente:** partir del cuerpo de `009`, no del de
> `006`. Si se parte de `006` se revierte silenciosamente la unicidad fail-closed
> del username.

---

## 5. Auditoría

### 5.1 Contrato

`logAudit()` en `src/lib/admin/audit.ts` se invoca en el mismo flujo que la acción
con efecto. **Si la escritura de auditoría falla, la acción falla** y se devuelve
error: un rastro incompleto es peor que un error visible, porque hace creer que el
registro es fiable cuando no lo es.

### 5.2 Acciones registradas en la fundación

| `action` | `entity_type` | Cuándo |
|---|---|---|
| `staff.login` | `staff_member` | Sesión iniciada con MFA superado |
| `staff.create` | `staff_member` | Alta de un miembro |
| `staff.role_change` | `staff_member` | Cambio de rol (`diff` con antes/después) |
| `staff.deactivate` | `staff_member` | Baja lógica |
| `staff.reactivate` | `staff_member` | Reactivación |

Cada módulo añadirá sus propias acciones con el mismo formato `dominio.verbo`.

---

## 6. Estructura de archivos

```
src/middleware.ts                       ← nuevo: protege /admin/*, refresca sesión, exige aal2
src/lib/admin/
  capabilities.ts                       ← matriz §2.5 como dato + tipo Capability
  requireCapability.ts                  ← guarda de servidor; lanza/redirige si no procede
  session.ts                            ← resuelve sesión → { staffId, role, displayName }
  audit.ts                              ← logAudit()
  supabaseServer.ts                     ← cliente con cookies (@supabase/ssr)
src/app/admin/
  layout.tsx                            ← shell + navegación filtrada por capacidades
  page.tsx                              ← portada del panel
  login/page.tsx                        ← email + contraseña
  mfa/page.tsx                          ← enrolamiento y verificación TOTP
  team/page.tsx                         ← Superadmin: alta, cambio de rol, baja
  audit/page.tsx                        ← Superadmin: feed cronológico
src/app/api/admin/staff/route.ts        ← POST crear · PATCH rol · DELETE baja lógica
supabase/migrations/
  010_staff_identity_and_audit.sql
  011_handle_new_user_skip_staff.sql
```

Todo lo de staff queda aislado bajo `admin/`, de modo que el límite es explícito y
ningún módulo futuro necesita tocar la web pública. `capabilities.ts` no importa
nada del resto de la app: es una tabla de datos pura, y por eso se puede testear
sola.

---

## 7. Pruebas

Ya se usa **vitest** en el repo (`src/lib/*.test.ts`), así que las pruebas unitarias
encajan sin infraestructura nueva.

**1. Matriz de capacidades (la prueba de mayor valor).** La tabla de §2.5 se
codifica como caso de test y se afirma **cada par (rol, capacidad)**, los 64.
Es la política de seguridad escrita como código: si alguien la cambia sin querer,
debe romperse sola. Incluye explícitamente:

- `accounts.edit` concedida **solo** a `superadmin` (regla de oro).
- `team.manage` y `audit.view` concedidas **solo** a `superadmin`.
- `verifier` no tiene ninguna capacidad de `reports.*`.
- `support` no tiene `accounts.ban` pero sí `accounts.ban_propose`.

**2. `requireCapability`.** Concede con capacidad presente; deniega con capacidad
ausente; deniega si el miembro está inactivo.

**3. Triggers de base de datos** (contra una rama de Supabase, nunca producción):

- Desactivar o degradar al último Superadmin activo → excepción; con dos
  Superadmins activos, la operación pasa.
- `UPDATE` y `DELETE` sobre `staff_audit_log` → excepción.
- Alta de auth con `is_staff: true` → **cero** filas nuevas en `users` y `accounts`.
- Alta normal (sin `is_staff`) → sigue creando cuenta y handle como antes
  (no regresión de 009).

**4. Verificación manual del flujo:** login → enrolamiento TOTP → acceso; y que un
Verificador no vea en la navegación las secciones de equipo ni de auditoría.

**5. Comandos:** `npx tsc --noEmit` y `npx eslint` (nunca `next lint`) limpios.

---

## 8. Casos límite

- **Miembro desactivado con sesión viva:** el middleware comprueba `is_active` en
  cada request, así que la sesión deja de servir de inmediato; no hay que esperar a
  que caduque el token.
- **Usuario de auth sin fila de staff** (p. ej. un usuario normal que descubre
  `/admin`): el middleware cierra su sesión y lo manda a `/admin/login`. Nunca ve
  contenido del panel.
- **MFA a medio enrolar:** queda en `aal1`, y el middleware lo retiene en
  `/admin/mfa`. No puede alcanzar ninguna otra ruta de `/admin`.
- **Fallo al insertar en `staff_members` tras crear el usuario de auth:** se borra
  el usuario recién creado (§3.1, paso 3) para no dejar huérfanos.
- **Bootstrap ejecutado dos veces:** la PK sobre `id` lo convierte en un error de
  clave duplicada, no en una segunda fila.
- **Miembro que además es usuario de producto:** no está soportado en la fundación.
  La marca `is_staff` es por usuario de auth, así que quien necesite ambas cosas
  usa dos correos distintos. Queda anotado como limitación conocida.

---

## 9. Decisiones registradas

| # | Decisión | Motivo |
|---|---|---|
| 1 | Panel en `/admin` del mismo Next.js | Reutiliza infra; PII no sale a terceros; audit log propio |
| 2 | Supabase Auth + `staff_members` | Reutiliza el motor existente; MFA nativo; baja = una fila |
| 3 | MFA (TOTP) obligatorio para todos los roles | El panel expone documentos de identidad y permite banear |
| 4 | Audit log genérico + vistas por módulo | Añadir un módulo no exige migración de auditoría |
| 5 | Autorización en servidor con punto único | `service_role` se salta RLS: RLS no puede ser la autoridad |
| 6 | Baja lógica de staff, nunca borrado | Preserva la integridad del rastro de auditoría |
| 7 | Analítica no concedida a Verificador/Soporte | Mínimo privilegio; la exploración lo dejaba opcional |

---

## 10. Después de esto

Cada módulo funcional sigue el ciclo spec → plan → implementación por separado,
enchufándose al shell y a `capabilities.ts`. Orden sugerido por valor operativo:
**Verificaciones** (desbloquea a usuarios reales), **Waitlist + invite codes**
(controla el crecimiento), **Reportes**, **Cuentas**, y después analítica y export.
