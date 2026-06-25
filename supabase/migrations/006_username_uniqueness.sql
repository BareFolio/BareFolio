-- 006_username_uniqueness.sql
-- Enforce true username uniqueness at the database layer.
--
-- Applied to project mzyhiyleoktpeamwjjse as migration version 20260625122437
-- ("username_uniqueness"). This file mirrors that already-applied migration so
-- the repo stays the source of truth.
--
-- Two parts:
--   (a) a case-insensitive UNIQUE index on lower(handle) — the ultimate guard;
--   (b) a rewrite of handle_new_user() so the clean base handle is used in the
--       normal case, with a numeric suffix appended only on a real collision
--       (race safety net). The app layers (onboarding live check + register
--       route) normally guarantee the base handle is free before insert.

-- (a) Case-insensitive uniqueness guard. Handles are already stored lowercase,
-- so this is non-breaking; it is the ultimate authority on uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS accounts_handle_lower_key
  ON public.accounts (lower(handle));

-- (b) Rewrite the trigger: try the clean base handle, suffix numerically only
-- on collision (race safety net; the app layers normally guarantee freedom).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  meta            jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role          text  := meta->>'role';
  base_handle     text;
  final_handle    text;
  handle_seq      int   := 1;
  new_account_id  uuid  := NEW.id;
  v_account_type  public.account_type_enum;
  v_birth_year    int;
BEGIN
  base_handle := COALESCE(
    NULLIF(meta->>'username', ''),
    REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );
  IF base_handle = '' OR base_handle IS NULL THEN base_handle := 'user'; END IF;
  base_handle := lower(base_handle);

  -- Try the clean base first; only on collision append 2, 3, ... This loop is a
  -- safety net for two simultaneous identical signups; the unique index below
  -- is the final guard if two transactions race past this check.
  final_handle := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.accounts WHERE lower(handle) = final_handle) LOOP
    handle_seq := handle_seq + 1;
    final_handle := base_handle || handle_seq::text;
  END LOOP;

  v_birth_year := NULLIF(meta->>'birth_year', '')::int;

  v_account_type := CASE
    WHEN v_role = 'seeker'            THEN 'seeker'::public.account_type_enum
    WHEN v_role IN ('studio','brand') THEN 'organization'::public.account_type_enum
    ELSE 'creator'::public.account_type_enum
  END;

  INSERT INTO public.users (id, email, first_name, last_name, birth_year, country_at_signup, auth_provider, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(meta->>'first_name', ''), base_handle),
    NULLIF(meta->>'last_name', ''),
    v_birth_year,
    NULLIF(meta->>'country', ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.accounts (id, owner_user_id, account_type, handle, display_name, location, website_url, plan, created_at)
  VALUES (
    NEW.id,
    NEW.id,
    v_account_type,
    final_handle,
    COALESCE(NULLIF(meta->>'display_name', ''), base_handle),
    NULLIF(meta->>'country', ''),
    NULLIF(meta->>'website_url', ''),
    'free'::public.account_plan_enum,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_role = 'seeker' THEN
    INSERT INTO public.seeker_profiles (account_id, scout_practice, disciplines)
    VALUES (
      new_account_id,
      NULLIF(meta->>'scout_practice', '')::public.seeker_practice_enum,
      COALESCE((SELECT array_agg(value) FROM jsonb_array_elements_text(meta->'disciplines')), ARRAY[]::text[])
    )
    ON CONFLICT (account_id) DO NOTHING;

  ELSIF v_role IN ('studio','brand') THEN
    INSERT INTO public.organization_profiles (account_id, org_type, disciplines, industries, team_size)
    VALUES (
      new_account_id,
      v_role::public.org_type_enum,
      COALESCE((SELECT array_agg(value) FROM jsonb_array_elements_text(meta->'disciplines')), ARRAY[]::text[]),
      COALESCE((SELECT array_agg(value) FROM jsonb_array_elements_text(meta->'industries')), ARRAY[]::text[]),
      NULLIF(meta->>'team_size', '')::public.team_size_enum
    )
    ON CONFLICT (account_id) DO NOTHING;

    IF NULLIF(meta->>'verification_method', '') IS NOT NULL THEN
      INSERT INTO public.organization_verifications (account_id, method, status, verification_data, submitted_at)
      VALUES (
        new_account_id,
        meta->>'verification_method',
        'pending'::public.verif_status_enum,
        COALESCE(meta->'verification_data', '{}'::jsonb),
        now()
      );
    END IF;

  ELSE
    INSERT INTO public.creator_profiles (account_id, practice, disciplines)
    VALUES (
      new_account_id,
      NULLIF(meta->>'practice', '')::public.practice_enum,
      COALESCE((SELECT array_agg(value) FROM jsonb_array_elements_text(meta->'disciplines')), ARRAY[]::text[])
    )
    ON CONFLICT (account_id) DO NOTHING;

    INSERT INTO public.creator_employment (account_id, open_to_work)
    VALUES (
      new_account_id,
      NULLIF(meta->>'open_to_work', '')::public.open_to_work_enum
    )
    ON CONFLICT (account_id) DO NOTHING;

    IF NULLIF(meta->>'verification_file', '') IS NOT NULL THEN
      INSERT INTO public.creator_verifications (account_id, status, submission_files, submitted_at)
      VALUES (
        new_account_id,
        'pending'::public.verif_status_enum,
        ARRAY[meta->>'verification_file']::text[],
        now()
      );
    END IF;
  END IF;

  UPDATE public.users SET active_account_id = new_account_id WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;
