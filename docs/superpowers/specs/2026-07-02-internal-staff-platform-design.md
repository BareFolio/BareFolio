# Plataforma interna de staff (BareFolio Admin) — Documento de exploración

**Fecha:** 2026-07-02
**Rama:** `develop`
**Estado:** Exploración / ideación (NO es un plan de implementación)
**Autor de la idea:** Víctor Chaves

> ⚠️ **Alcance de este documento.** Esto es una exploración para *validar qué debería
> incluir* la plataforma interna, no una orden de construir. No hay código, ni
> migraciones, ni plan de tareas asociado todavía. Cualquier persona debería poder
> leer este documento y entender **qué es** la plataforma, **para quién**, **qué
> módulos tiene**, **qué datos usa cada uno** y **quién puede tocar qué**. Cuando se
> decida construir, este documento será la base del diseño técnico y del plan.

---

## 1. Resumen en una frase

Una plataforma web interna, separada del producto público, donde un equipo pequeño
(1–5 personas de confianza) revisa verificaciones de perfiles, gestiona reportes y
soporte, controla la waitlist y los códigos de invitación, consulta analítica y
envía comunicaciones a las cuentas — todo con permisos por rol y con registro de
quién hizo qué.

## 2. Propósito y usuarios

**Problema que resuelve.** Hoy las tareas de back-office (aceptar una verificación,
atender una denuncia, invitar a alguien de la waitlist, mirar cuánta gente se dio de
alta) o no tienen interfaz, o se hacen a mano en Supabase Studio / Airtable. Eso es
lento, propenso a errores, no deja rastro de quién hizo qué, y da a cualquiera con
acceso a Studio poder total sobre datos sensibles (documentos de verificación, PII).

**Usuarios.** Equipo interno de **1 a 5 personas de confianza**. No es una
herramienta pública ni para clientes. La prioridad es que sea **simple, segura y
auditable**, no que escale a cientos de operadores.

**Principios de diseño.**
- **Mínimo privilegio.** Cada quien ve y hace solo lo de su función.
- **Rastro de todo.** Toda acción con efecto (aceptar, rechazar, banear, invitar,
  enviar correo) queda registrada con actor, fecha y objeto.
- **Una sola regla de oro:** *solo el Superadmin edita datos de usuarios/cuentas.*
  Todos los demás son de lectura sobre las cuentas (con matices por rol, ver §5).
- **Apoyarse en lo que ya existe** (tablas de Supabase, Airtable, Resend) en vez de
  reinventar.

---

## 3. Infraestructura actual (lo que ya existe hoy)

Esto es clave: buena parte de los *datos* ya existen. Lo que falta casi por completo
es la **capa de staff** (identidad del equipo, roles, auditoría) y la **interfaz**.

### 3.1 Ya existe en Supabase (Postgres, proyecto `mzyhiyleoktpeamwjjse`)

| Tabla / objeto | Para qué sirve | Campos relevantes |
|---|---|---|
| `creator_verifications` | Verificación de creadores | `account_id`, `status` (`verif_status_enum`: pending/approved/rejected/not_applicable), `submission_files TEXT[]`, `submission_note`, `reviewer_note`, `submitted_at`, `reviewed_at`, `attempt_number` |
| `organization_verifications` | Verificación de estudios/marcas | `account_id`, `method` (email_domain / social_instagram / social_linkedin / documentation), `status`, `verification_data JSONB`, `document_url`, `reviewer_note`, `submitted_at`, `reviewed_at` |
| `content_reports` | Denuncias de contenido/cuentas | `reporter_account_id`, `target_type`, `target_id`, `reason` (`report_reason_enum`), `description`, `status` (`report_status_enum`: pending/reviewing/resolved), `resolution` (`resolution_enum`), `resolver_note`, `reported_at`, `resolved_at` |
| `notifications` | Notificaciones in-app | `recipient_account_id`, `actor_account_id`, `type` (`notification_type_enum`), `source_type`, `source_id`, `is_read`, `created_at` |
| `subscriptions` | Suscripciones de pago | `account_id` (UNIQUE), `plan`, `billing_cycle`, `status` (`subscription_status_enum`: active/cancelled/expired/past_due), `current_period_start/end`, `cancelled_at`, `external_subscription_id`, timestamps |
| `accounts` | Cuentas (creator/seeker/organization) | incluye `verification_status`, `handle`, `plan`, `account_type`, `display_name`… |
| `users` | Datos de persona detrás de la cuenta | email, nombre/apellidos, país, año de nacimiento, proveedor de auth… |
| `invite_codes` | Códigos de invitación de un solo uso | `code`, `used_at`, `used_by` (uuid), `note`, `created_at` |
| Vistas `creator_registrations`, `seeker_registrations`, `organization_registrations` (migración 008) | Resumen de altas por rol para back-office | email + nombres + rol + verificación; **solo `service_role`** (fuera de la API pública) |

**Nota de seguridad ya presente:** las vistas de registro (008) ya están revocadas
de `anon`/`authenticated` y solo son accesibles por `service_role`. Es el patrón que
la plataforma interna debe seguir para *todo* lo sensible.

### 3.2 Ya existe fuera de Supabase

- **Waitlist → Airtable.** La lista de espera NO está en Supabase. Vive en Airtable,
  tabla **"Waitlist"**, con campos `Email`, `Account Type`, `Nombre`, `Apellidos`,
  `Fecha de inscripción`. La escribe `src/app/api/waitlist/route.ts` (con honeypot y
  rate-limit). Roles mapeados: creator→"Creator", seeker→"Seeker",
  studio→"Studio - Brand".
- **Correo transaccional → Resend.** Los emails (confirmación de waitlist, etc.) se
  envían con Resend (`RESEND_API_KEY`, `RESEND_FROM`). La plantilla vive en
  `src/emails/`.

### 3.3 Lo que NO existe todavía (hay que construirlo)

- **Identidad y roles del staff.** No hay tabla de miembros del equipo ni de roles.
  Hoy "ser admin" = tener la service-role key o acceso a Studio/Airtable.
- **Registro de auditoría (audit log).** No hay rastro de quién aceptó/rechazó/baneó.
- **Interfaz interna.** No hay panel; todo se haría a mano en Studio/Airtable.
- **Estado de baneo de cuentas** como concepto de producto (hay que decidir cómo se
  representa: campo en `accounts`, tabla de sanciones, etc. — a definir en el diseño
  técnico).
- **Puente waitlist ↔ invite codes** (generar un código y enviarlo a alguien de la
  lista de Airtable de forma asistida).

---

## 4. Los cuatro roles del staff

Equipo pequeño, así que un RBAC ligero de **cuatro roles**. Un miembro tiene
exactamente un rol.

1. **Superadmin.** Control total. Único que puede **editar cuentas/usuarios**,
   gestionar al propio equipo (altas/bajas de staff y cambios de rol) y ver el
   registro de auditoría completo. Puede hacer todo lo de los demás roles.

2. **Staff general (operador de confianza).** Rol amplio y operativo. Hace casi todo
   el trabajo del día a día: revisar verificaciones, atender reportes, ver la
   waitlist e invitar, consultar analítica, **e incluso banear** cuentas (actúa como
   "segundos ojos" del Superadmin). Lo que **no** puede: **editar** datos de
   cuentas/usuarios, gestionar al equipo, ni ver el audit log completo.

3. **Verificador.** Especializado y **restringido**: solo el módulo de
   **verificaciones** (aceptar/rechazar con nota). Sobre las cuentas, **solo
   lectura**. No banea, no invita, no toca reportes.

4. **Soporte / Moderación.** Especializado en **reportes y soporte**. Sobre las
   cuentas es de **solo lectura**, pero **puede añadir notas internas y crear una
   ficha** del caso. No puede editar usuarios ni banear directamente: si cree que
   hay que banear, lo hace como **propuesta** para que el Superadmin (o Staff
   general) la ejecute.

> **Verificador y Soporte son versiones restringidas y especializadas** de lo que el
> Staff general puede hacer de forma amplia. El Staff general es la versión "broad";
> los otros dos son "narrow".

---

## 5. Matriz de accesos

Leyenda: ✅ permitido · 👁️ solo lectura · ⚠️ solo como propuesta · ❌ no.

| Capacidad | Superadmin | Staff general | Verificador | Soporte/Mod |
|---|:--:|:--:|:--:|:--:|
| Ver verificaciones | ✅ | ✅ | ✅ | 👁️ |
| Aceptar/rechazar verificación | ✅ | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ✅ | ❌ | ✅ |
| Resolver reportes | ✅ | ✅ | ❌ | ✅ |
| Añadir nota interna / ficha a una cuenta | ✅ | ✅ | ❌ | ✅ |
| Banear cuenta | ✅ | ✅ | ❌ | ⚠️ (propuesta) |
| **Editar datos de cuenta/usuario** | ✅ | ❌ | ❌ | ❌ |
| Ver cuentas y usuarios | ✅ | 👁️ | 👁️ | 👁️ |
| Ver waitlist | ✅ | ✅ | ❌ | ❌ |
| Generar/enviar invite codes | ✅ | ✅ | ❌ | ❌ |
| Ver analítica / estadísticas | ✅ | ✅ | 👁️ (opcional) | 👁️ (opcional) |
| Enviar comunicaciones manuales de soporte | ✅ | ✅ | ❌ | ✅ |
| Exportar datos (CSV) | ✅ | ✅ | ❌ | ✅ (de su ámbito) |
| Gestionar equipo (altas/bajas/rol de staff) | ✅ | ❌ | ❌ | ❌ |
| Ver registro de auditoría | ✅ | ❌ | ❌ | ❌ |

> **Regla de oro (repetida a propósito):** *ninguno edita cuentas/usuarios excepto el
> Superadmin.* Todo lo demás sobre cuentas es lectura (con notas internas donde se
> indique).

---

## 6. Módulos de la plataforma

Cada módulo describe: **qué hace**, **qué datos usa** (de §3) y **quién accede** (de §5).

### 6.1 Acceso y seguridad del staff
- **Qué hace:** login del equipo, asignación de rol, gestión de miembros (solo
  Superadmin), y el **registro de auditoría** que sella cada acción con efecto.
- **Datos:** nueva capa de identidad de staff + nueva tabla de audit log (no existen
  hoy, §3.3). Debe vivir tras `service_role` / autenticación de staff, nunca expuesto
  al público.
- **Acceso:** todos entran; solo el Superadmin gestiona equipo y ve el audit log.

### 6.2 Verificaciones
- **Qué hace:** cola de solicitudes pendientes de creadores y de organizaciones;
  abrir una solicitud, ver los archivos/`document_url`, y aceptar o rechazar con
  `reviewer_note`. Al aceptar/rechazar dispara comunicación a la cuenta (§6.6).
- **Datos:** `creator_verifications`, `organization_verifications`,
  `accounts.verification_status`.
- **Acceso:** Superadmin, Staff general y Verificador operan; Soporte solo lee.

### 6.3 Reportes y moderación (de cuentas)
- **Qué hace:** panel de alertas de denuncias entrantes; triage (pending → reviewing
  → resolved), asignar `resolution` y `resolver_note`, y crear ficha del caso.
- **Datos:** `content_reports` (+ lectura de `accounts`/`users` del objeto
  reportado).
- **Acceso:** Superadmin, Staff general y Soporte/Mod. Verificador no entra.
- **Nota:** la **moderación fina de contenido** (revisar posts/proyectos concretos
  con reglas detalladas) queda **aparcada** por ahora (§8).

### 6.4 Waitlist + códigos de invitación
- **Qué hace:** ver la lista de espera (correos, nombres, rol), y **generar un invite
  code y enviárselo** a una persona concreta de forma asistida.
- **Datos:** **Airtable** (tabla "Waitlist") como origen; `invite_codes` en Supabase
  para generar/marcar códigos; **Resend** para el envío.
- **Acceso:** Superadmin y Staff general.

### 6.5 Cuentas y usuarios
- **Qué hace:** buscar y ver una cuenta (datos, plan, estado de verificación,
  historial de reportes), añadir **notas internas / ficha**, y **editar** (solo
  Superadmin). Banear según la matriz.
- **Datos:** `accounts`, `users`, vistas de registro (008), + nueva capa de notas
  internas y de estado de baneo (§3.3).
- **Acceso:** ver = todos (lectura); notas = Superadmin/Staff/Soporte; editar = solo
  Superadmin; banear = Superadmin/Staff (Soporte solo propone).

### 6.6 Notificaciones / Comunicaciones
- **Qué hace:** dos tipos de envío.
  - **Automáticas por evento:** (1) al **aceptar** una verificación → correo de
    "cuenta verificada"; (2) al **banear** una cuenta → correo/comunicación de aviso.
  - **Manuales de soporte:** el equipo redacta y envía una comunicación puntual a una
    cuenta.
- **Canales:** **email vía Resend** e **in-app vía tabla `notifications`**.
- **Datos:** `notifications`, Resend, + los eventos que las disparan (verificaciones,
  baneo).
- **Acceso:** automáticas las dispara el sistema; manuales las envían
  Superadmin/Staff/Soporte.

### 6.7 Analítica / estadísticas
- **Qué hace:** **altas de cuentas por día**, KPIs generales (totales por rol, plan,
  verificaciones pendientes, reportes abiertos) y embudo básico
  (waitlist → invitados → registrados → verificados).
- **Datos:** agregados sobre `accounts`/`users`/vistas de registro; conteos de
  `creator_verifications`/`content_reports`; waitlist de Airtable.
- **Acceso:** Superadmin y Staff general; Verificador/Soporte opcional en solo
  lectura.

### 6.8 Exportar datos (CSV)
- **Qué hace:** exportar a CSV los listados relevantes (cuentas, waitlist,
  verificaciones, reportes) para análisis externo.
- **Datos:** los de cada módulo, respetando permisos (cada rol exporta solo lo que
  puede ver).
- **Acceso:** Superadmin, Staff general y Soporte (dentro de su ámbito).

### 6.9 (Futuro) Suscripciones — registro de estados
- **Qué hace:** cuando Stripe esté conectado, mostrar el **registro de cambios de
  estado de suscripción** (active → past_due → cancelled…) por cuenta.
- **Datos:** `subscriptions` (ya existe la tabla y el enum; falta la integración con
  Stripe y el histórico de cambios).
- **Acceso:** Superadmin y Staff general (a definir cuando llegue Stripe).

---

## 7. Reglas de oro (resumen)

1. **Solo el Superadmin edita cuentas/usuarios.** Todos los demás, lectura.
2. **Todo lo sensible vive tras `service_role` / auth de staff**, nunca en la API
   pública (mismo patrón que las vistas 008).
3. **Toda acción con efecto se audita** (actor, acción, objeto, fecha).
4. **Soporte no banea directamente:** propone; ejecuta Superadmin o Staff general.
5. **Reutilizar infraestructura existente** (Supabase, Airtable, Resend) antes que
   crear nueva.

---

## 8. Aparcado / fuera de alcance (por ahora)

- **Moderación fina de contenido** (revisión detallada de posts/proyectos con reglas
  propias). Se retoma más adelante.
- **Plantillas de comunicación** reutilizables. Es viable y deseable, pero se deja
  para una fase posterior; de momento, envíos manuales redactados al momento.
- **Integración con Stripe** y el histórico de suscripciones (§6.9): depende de que
  Stripe esté conectado.

---

## 9. Preguntas abiertas (a resolver en el diseño técnico)

Estas NO se deciden aquí; se listan para no olvidarlas cuando se pase a construir:

1. **Identidad del staff:** ¿usuarios de Supabase Auth marcados con rol, tabla propia
   de staff, o un proveedor externo (p. ej. SSO)?
2. **Representación del baneo:** ¿un campo de estado en `accounts`, una tabla de
   sanciones con motivo/fecha/actor, o ambos?
3. **Notas internas / ficha de cuenta:** ¿tabla nueva (`account_notes`) con autor y
   timestamp? ¿visibles para qué roles?
4. **Estructura del audit log:** ¿una tabla genérica (actor, acción, entidad, id,
   diff, fecha) o específica por módulo?
5. **Puente waitlist↔invite:** ¿la generación del código marca algo en Airtable para
   no reinvitar dos veces?
6. **Ubicación de la interfaz:** ¿subruta protegida del mismo Next.js (`/admin`),
   app separada, o herramienta como Retool para acelerar?
7. **Histórico de suscripciones:** ¿se guarda cada transición o se lee el estado
   actual de Stripe bajo demanda?

---

## 10. Qué NO es este documento

- No es un plan de implementación (sin tareas, sin código, sin migraciones).
- No compromete un stack de UI concreto ni un esquema de tablas final.
- No aprueba construir nada: es material para decidir el alcance con calma.
