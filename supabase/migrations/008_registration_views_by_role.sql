-- 008_registration_views_by_role.sql
-- Mirrors the live migration `split_registration_overview_by_role` applied to
-- Supabase project mzyhiyleoktpeamwjjse.
--
-- Supersedes the single all-roles `registration_overview` (007). A relational
-- view has fixed columns, so the unified overview showed every role's columns
-- on every row (foreign-role columns just came back NULL). Splitting into one
-- view per role means each row carries ONLY the fields of that user's selected
-- role — nothing from the other roles' flows.
--
-- PII guard: all three expose email + names, so access is revoked from anon
-- and authenticated — reachable only via service_role (Supabase Studio).

DROP VIEW IF EXISTS public.registration_overview;

-- ── Creators ─────────────────────────────────────────────────────────────
CREATE VIEW public.creator_registrations AS
SELECT
  a.id                AS account_id,
  u.id                AS user_id,
  u.email,
  u.first_name,
  u.last_name,
  a.display_name      AS full_name,
  u.birth_year,
  u.country_at_signup AS country,
  a.handle,
  a.plan,
  u.auth_provider,
  u.created_at        AS registered_at,
  cp.practice,
  cp.disciplines,
  ce.open_to_work,
  cv.status           AS verification_status
FROM public.accounts a
JOIN public.users u                    ON u.id = a.owner_user_id
LEFT JOIN public.creator_profiles cp   ON cp.account_id = a.id
LEFT JOIN public.creator_employment ce ON ce.account_id = a.id
LEFT JOIN LATERAL (
  SELECT status FROM public.creator_verifications x
  WHERE x.account_id = a.id
  ORDER BY x.submitted_at DESC NULLS LAST LIMIT 1
) cv ON true
WHERE a.account_type = 'creator';

-- ── Seekers ──────────────────────────────────────────────────────────────
CREATE VIEW public.seeker_registrations AS
SELECT
  a.id                AS account_id,
  u.id                AS user_id,
  u.email,
  u.first_name,
  u.last_name,
  a.display_name      AS full_name,
  u.birth_year,
  u.country_at_signup AS country,
  a.handle,
  a.plan,
  u.auth_provider,
  u.created_at        AS registered_at,
  sp.scout_practice,
  sp.disciplines
FROM public.accounts a
JOIN public.users u                 ON u.id = a.owner_user_id
LEFT JOIN public.seeker_profiles sp ON sp.account_id = a.id
WHERE a.account_type = 'seeker';

-- ── Organizations (studio / brand) ───────────────────────────────────────
CREATE VIEW public.organization_registrations AS
SELECT
  a.id                AS account_id,
  u.id                AS user_id,
  u.email,
  u.first_name,
  u.last_name,
  a.display_name      AS org_name,
  u.birth_year,
  u.country_at_signup AS country,
  a.handle,
  a.website_url,
  a.plan,
  u.auth_provider,
  u.created_at        AS registered_at,
  op.org_type,
  op.disciplines,
  op.industries,
  op.team_size,
  ov.method           AS verification_method,
  ov.status           AS verification_status
FROM public.accounts a
JOIN public.users u                       ON u.id = a.owner_user_id
LEFT JOIN public.organization_profiles op ON op.account_id = a.id
LEFT JOIN LATERAL (
  SELECT method, status FROM public.organization_verifications x
  WHERE x.account_id = a.id
  ORDER BY x.submitted_at DESC NULLS LAST LIMIT 1
) ov ON true
WHERE a.account_type = 'organization';

-- PII guard: keep all three off the public API; service_role only.
REVOKE ALL ON public.creator_registrations       FROM anon, authenticated;
REVOKE ALL ON public.seeker_registrations         FROM anon, authenticated;
REVOKE ALL ON public.organization_registrations   FROM anon, authenticated;
GRANT SELECT ON public.creator_registrations      TO service_role;
GRANT SELECT ON public.seeker_registrations        TO service_role;
GRANT SELECT ON public.organization_registrations  TO service_role;
