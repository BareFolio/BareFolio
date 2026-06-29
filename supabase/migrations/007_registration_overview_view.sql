-- 007_registration_overview_view.sql
-- Mirrors the live migration `create_registration_overview_view` applied to
-- Supabase project mzyhiyleoktpeamwjjse.
--
-- A read-only consolidation of every field collected during signup into ONE
-- flat row per user. The registration data itself stays normalized across
-- users/accounts/<role>_profiles/<role>_verifications; this view just joins
-- them so the full registration of each user can be read in one place. Because
-- it reads live from the source tables it can never desync.
--
-- PII guard: the view exposes email + names, so access is revoked from anon
-- and authenticated — it is reachable only via service_role (Supabase Studio /
-- admin), never through the public API.

CREATE OR REPLACE VIEW public.registration_overview AS
SELECT
  a.id                       AS account_id,
  u.id                       AS user_id,
  u.email,
  a.account_type             AS role,
  u.first_name,
  u.last_name,
  a.display_name             AS full_name,
  u.birth_year,
  u.country_at_signup        AS country,
  a.handle,
  a.website_url,
  a.plan,
  u.auth_provider,
  u.created_at               AS registered_at,
  -- creator
  cp.practice                AS creator_practice,
  cp.disciplines             AS creator_disciplines,
  ce.open_to_work            AS creator_open_to_work,
  cv.status                  AS creator_verification_status,
  -- seeker
  sp.scout_practice          AS seeker_practice,
  sp.disciplines             AS seeker_disciplines,
  -- organization (studio / brand)
  op.org_type                AS org_type,
  op.disciplines             AS org_disciplines,
  op.industries              AS org_industries,
  op.team_size               AS org_team_size,
  ov.method                  AS org_verification_method,
  ov.status                  AS org_verification_status
FROM public.accounts a
JOIN public.users u                       ON u.id = a.owner_user_id
LEFT JOIN public.creator_profiles cp      ON cp.account_id = a.id
LEFT JOIN public.creator_employment ce    ON ce.account_id = a.id
LEFT JOIN public.seeker_profiles sp       ON sp.account_id = a.id
LEFT JOIN public.organization_profiles op ON op.account_id = a.id
-- Verification tables can hold multiple attempts; take the latest only so the
-- view stays exactly one row per user.
LEFT JOIN LATERAL (
  SELECT status FROM public.creator_verifications x
  WHERE x.account_id = a.id
  ORDER BY x.submitted_at DESC NULLS LAST LIMIT 1
) cv ON true
LEFT JOIN LATERAL (
  SELECT method, status FROM public.organization_verifications x
  WHERE x.account_id = a.id
  ORDER BY x.submitted_at DESC NULLS LAST LIMIT 1
) ov ON true;

-- PII guard: never expose this overview through the public API.
REVOKE ALL ON public.registration_overview FROM anon, authenticated;
GRANT SELECT ON public.registration_overview TO service_role;
