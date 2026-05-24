-- =============================================================================
-- BAREFOLIO: ADVANCED 20 PREMIUM SWISS PROJECTS & DIVERSE CREATIVE PROFILES SEED
-- =============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select your project ("BareFolio" or "creativos-app").
-- 3. Click on the "SQL Editor" in the left sidebar navigation menu.
-- 4. Click "+ New query", paste this entire SQL script, and click "Run".
-- =============================================================================

-- Enable pgcrypto extension for gen_salt if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_alex_id UUID := '63b827ac-44b4-4b53-83ef-74f07a216b7e';
  v_luisa_id UUID := '8c5a9be7-e547-4cfb-b8a7-3be4db0869a8';
  v_yanis_id UUID := '4e9a3bdf-9b22-4876-b52b-2a74cde78fb2';
  v_raw_id UUID := 'f7b5a8e0-47b2-4d2a-a92c-0e31e5bc1d0a';
  v_chronos_id UUID := 'a3d9b1c7-7e24-4f0d-9b16-e5c824fb72a1';
BEGIN
  -- 1. SEED AUTH USERS (Allows bypassing foreign key profiles.id constraint)
  -- Alex McQueen (Creator - Photographer)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_alex_id) THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES (v_alex_id, 'alex@barefolio.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated');
  END IF;

  -- Luisa Barriga (Studio - Interior Designer)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_luisa_id) THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES (v_luisa_id, 'luisa@barefolio.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated');
  END IF;

  -- Yanis CGI (Creator - 3D Sculptor)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_yanis_id) THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES (v_yanis_id, 'yanis@barefolio.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated');
  END IF;

  -- Raw Lab (Studio - Graphic Design & Swiss Typography)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_raw_id) THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES (v_raw_id, 'rawlab@barefolio.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated');
  END IF;

  -- Chronos Lab (Brand - UI/UX & Interaction Design)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_chronos_id) THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    VALUES (v_chronos_id, 'chronos@barefolio.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated');
  END IF;

  -- 2. SEED/UPDATE CREATIVE PROFILES
  INSERT INTO public.profiles (id, username, full_name, profile_type, bio, location, website, disciplines, verified, created_at)
  VALUES 
    (v_alex_id, 'alex_mcqueen', 'Alex McQueen', 'creator', 'Minimalist landscape and architectural photographer based in Copenhagen. Capturing quiet geometries.', 'Copenhagen, Denmark', 'alexmcqueen.com', ARRAY['Photography', 'Fine Art'], true, now()),
    (v_luisa_id, 'luisa_barriga', 'Luisa Barriga Studio', 'studio', 'Interior designer specialized in warm minimalism, concrete structures, and Mediterranean organic materials.', 'Madrid, Spain', 'luisabarrigastudio.com', ARRAY['Interior Design', 'Architectural Direction'], true, now()),
    (v_yanis_id, 'yanis_cgi', 'Yanis CGI', 'creator', 'Digital sculptor and simulator. Exploring ceramic physics, mercury surfaces, and retro-futuristic audio gadgets.', 'Berlin, Germany', 'yaniscgi.xyz', ARRAY['3D Modeling', 'CGI Art'], true, now()),
    (v_raw_id, 'raw_lab_studio', 'Raw Lab', 'studio', 'Swiss typographic studio and visual architects. Restoring coffee, books, and corporate identities to high-contrast structures.', 'Zurich, Switzerland', 'rawlabdesign.ch', ARRAY['Graphic Design', 'Branding', 'Packaging'], true, now()),
    (v_chronos_id, 'chronos_interfaces', 'Chronos Lab', 'brand', 'Designing digital time management portals, fluid calendars, and glassmorphic wealth management frameworks.', 'San Francisco, USA', 'chronoslab.design', ARRAY['UI/UX Design', 'Interaction Design'], true, now())
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    profile_type = EXCLUDED.profile_type,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    website = EXCLUDED.website,
    disciplines = EXCLUDED.disciplines,
    verified = EXCLUDED.verified;

  RAISE NOTICE 'Profiles seeded successfully.';

  -- 3. CLEAN UP PREVIOUS DEMO PROJECTS TO AVOID CONFLICTS
  DELETE FROM public.projects WHERE id IN (
    'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a01', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a02', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a03', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a04',
    'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b01', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b02', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b03', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b04',
    'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c01', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c02', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c03', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c04',
    'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d01', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d02', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d03', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d04',
    'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e01', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e02', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e03', 'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e04'
  );

  -- 4. SEED PROJECTS DIRECTLY LINKED TO THEIR SPECIFIC AUTH CREATORS
  INSERT INTO public.projects (id, user_id, title, discipline, atmosphere, description, cover_url, images, year, client, visual_language, palette, tags, verification_status, ai_tags)
  VALUES 
    -- ── 1. Photography (Alex McQueen) ────────────────────────────────────────
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a01',
      v_alex_id,
      'Quietude',
      'Project / Fine Art / Landscape Photography',
      'Nordic Silence & Mist',
      'A visual study of absolute silence. Exploring the raw, quiet landscapes of the Nordic regions under heavy overcast skies and cold mist.',
      '/images/quietude-cover.png',
      ARRAY[
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'National Nordic Museum',
      'Stark contrast, low exposure, desaturated green-blue tones, and vast atmospheric scale.',
      ARRAY['#1D2A2B', '#4A5A58', '#A2B3B0', '#EAEFEF'],
      ARRAY['Photography', 'Landscape', 'Nordic', 'Fine Art'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a02',
      v_alex_id,
      'Sartorial Portraits',
      'Project / Studio Portraiture / Fashion',
      'High-Contrast Monochrome',
      'High-fashion studio portraiture focusing on sharp sartorial tailoring, harsh shadows, and intense raw human micro-expressions.',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=80'
      ],
      2024,
      'Dansk Magazine',
      'Chiaroscuro studio lighting, rich deep black levels, and highly structured clothing textiles.',
      ARRAY['#0B0B0B', '#3A3A3A', '#8F8F8F', '#FAFAFA'],
      ARRAY['Photography', 'Portrait', 'Monochrome', 'Fashion'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a03',
      v_alex_id,
      'Brutalist Forms',
      'Project / Architecture / Fine Art',
      'Raw Concrete Geometry',
      'A architectural photography series exploring structural weight, structural shadows, and the tactile concrete details of European Brutalist landmarks.',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Danish Architecture Institute',
      'Strict geometric alignment, high-noon hard lighting, and high-grain matte print simulation.',
      ARRAY['#444444', '#777777', '#B8B8B8', '#F2F2F2'],
      ARRAY['Photography', 'Architecture', 'Brutalisim', 'Concrete'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a04',
      v_alex_id,
      'Interlocking Shadows',
      'Project / Street / Documentary',
      'High-Contrast Urban Canvas',
      'Capturing the transient interlocking shadows cast by high concrete architectures on lone walkers in street landscapes.',
      'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1496568818309-53d7c7753022?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&w=1000&q=80'
      ],
      2024,
      'Self-Published Specimen',
      'Extreme dynamic range, isolated highlights, deep black graphic forms.',
      ARRAY['#050505', '#2C221E', '#C7B299', '#FFFFFF'],
      ARRAY['Photography', 'Street', 'Shadows', 'Minimalism'],
      'approved',
      '{}'::jsonb
    ),

    -- ── 2. Interior Design (Luisa Barriga Studio) ────────────────────────────
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b01',
      v_luisa_id,
      'Nordic Haven',
      'Project / Residential Lounge / Warm Minimalism',
      'Organic Warmth & Light',
      'A private residential lounge designed around the concepts of thermal comfort, natural daylight optimization, and warm light-oak furnishings.',
      '/images/nordic-haven.png',
      ARRAY[
        'https://images.unsplash.com/photo-1616166330003-8e550d40b0f8?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Hansen Residence',
      'Soft diffuse lighting, rich textured wool fabrics, pale oak paneling, and floating curves.',
      ARRAY['#DED8CE', '#C6B9A8', '#8B7D6C', '#3C352A'],
      ARRAY['Interiors', 'Lounge', 'Scandinavian', 'Oak'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b02',
      v_luisa_id,
      'The Concrete Loft',
      'Project / Apartment / Brutalist',
      'Industrial Steel & Warm Walnut',
      'An industrial modern loft apartment detailed with micro-cement floor plaster, raw steel partitions, and floor-to-ceiling walnut cabinets.',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1000&q=80'
      ],
      2024,
      'Vessel Capital Ltd',
      'Strong volumetric contrast, black steel profiles, warm walnut offsets, brutalist raw walls.',
      ARRAY['#4F4F4F', '#78604B', '#A89481', '#EAEAEA'],
      ARRAY['Interiors', 'Loft', 'Concrete', 'Brutalist'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b03',
      v_luisa_id,
      'Atelier Ocre',
      'Project / Creative Office / Mediterranean',
      'Terracotta & Natural Rattan',
      'A boutique workspace designed with textured Mediterranean ochre plasters, built-in shelving, and earthy rattan and linen accents.',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1618221381711-42ca8ab6e908?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1618219942942-dd91450b36ef?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Ocre Creative Agency',
      'Warm sunlit angles, clay plaster textures, organic materials, earth-toned gradients.',
      ARRAY['#C57D5D', '#D8B29A', '#ECE0D1', '#765847'],
      ARRAY['Interiors', 'Office', 'Mediterranean', 'Plaster'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b04',
      v_luisa_id,
      'Monochromatic Den',
      'Project / Executive Study / Dark Room',
      'Charcoal Velvet & Leather',
      'A private study room finished in deep charcoal velvet wall linings, patinated leather armchairs, and direct low-voltage spotlights.',
      'https://images.unsplash.com/photo-1618219942942-dd91450b36ef?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Secretariat Holding',
      'High shadows, warm brass nodes, rich black velvet textures, intimate direct spotlighting.',
      ARRAY['#141414', '#2B2A28', '#8C7C72', '#FFFFFF'],
      ARRAY['Interiors', 'Den', 'Leather', 'Charcoal'],
      'approved',
      '{}'::jsonb
    ),

    -- ── 3. 3D Modeling / CGI (Yanis CGI) ─────────────────────────────────────
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c01',
      v_yanis_id,
      'Vessel Studies',
      'Project / CGI Simulation / Ceramic Art',
      'Digital Physicality & Glazes',
      'Abstract CGI explorations of physical clay vessel responses, digital zero-gravity, and procedural matte and glossy volcanic glazes.',
      '/images/vessel-studies.png',
      ARRAY[
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Galerie Digital',
      'Soft global illumination, highly tactile micro-displacement glazes, structural balance.',
      ARRAY['#CDA291', '#3C3F4A', '#E6E2DF', '#101216'],
      ARRAY['CGI', '3D', 'Ceramics', 'Simulation'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c02',
      v_yanis_id,
      'Specular Chrome',
      'Project / Motion CGI / Metallic Fluid',
      'Mercury Refractions',
      'High-specularity fluid simulation renders exploring metallic surfaces, curved mercury flows, and architectural neon reflections.',
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=80'
      ],
      2024,
      'Node Motion Festival',
      'High reflection values, high contrast hdri environment maps, fluid mercury curves.',
      ARRAY['#1B1B1D', '#EBEBEB', '#FF007F', '#00F0FF'],
      ARRAY['CGI', '3D', 'Fluid', 'Chrome'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c03',
      v_yanis_id,
      'Tactile Tech',
      'Project / Product 3D / Concept',
      'Retro-Futuristic Matte Hardware',
      'Conceptual 3D product rendering of modular portable audio recording hardware, featuring high-fidelity matte plastic textures and vintage steel dials.',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Teenage Sound Concept',
      'Hard shadows, clinical studio product lighting, orange tactile accents, micro text engraving.',
      ARRAY['#2B2B2D', '#FAFAFA', '#E05A3E', '#A0A5AA'],
      ARRAY['CGI', '3D', 'Product', 'Hardware'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c04',
      v_yanis_id,
      'Mineral Landscapes',
      'Project / Landscape CGI / Environmental',
      'Basalt Monoliths & Reflective Sea',
      'CGI virtual environment featuring geometric volcanic basalt monoliths emerging from perfectly calm, mirrored digital waters.',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Metaspace Art',
      'Ethereal sunset lighting, perfect flat mirror reflections, crisp mineral volcanic textures.',
      ARRAY['#1F1D2B', '#394E68', '#D9E4EC', '#14151B'],
      ARRAY['CGI', '3D', 'Landscape', 'Monolith'],
      'approved',
      '{}'::jsonb
    ),

    -- ── 4. Graphic Design (Raw Lab) ──────────────────────────────────────────
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d01',
      v_raw_id,
      'STOW Coffee Branding',
      'Project / Visual Identity / Video Design',
      'Swiss Editorial & Premium Metal',
      'Restoring coffee branding to its raw, monospaced typography roots. Featuring custom silver tin boxes with debossed letterforms and high-contrast grids.',
      '/images/stow/stow-boxes.png',
      ARRAY[
        '/images/stow/stow-nestor-lasso.png',
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1000&q=80'
      ],
      2024,
      'Stow, Coffee Ltd',
      'Massive Switzer headers, technical monospaced descriptors, high-end metallic mockups.',
      ARRAY['#101010', '#EAEAEA', '#E5DCD3', '#FF5F1F'],
      ARRAY['Identity', 'Branding', 'Swiss', 'Packaging'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d02',
      v_raw_id,
      'Chronicle Typeface',
      'Project / Editorial / Typography',
      'Strict Grids & Book Structures',
      'Specimen design for Chronicle, a custom sharp serif typeface. The book layout explores line tension, margin structures, and book spines.',
      '/images/chronicle-specimen.png',
      ARRAY[
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1000&q=80'
      ],
      2024,
      'Zurich Typography Press',
      'Strict baseline alignment, oversized type, deep charcoal ink ink-spread simulations.',
      ARRAY['#151515', '#F7F5F0', '#8E8D88', '#C3B195'],
      ARRAY['Design', 'Typography', 'Editorial', 'Book'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d03',
      v_raw_id,
      'Duality Identity',
      'Project / Corporate Branding / Gallery',
      'Ultra-High Contrast Gallery Systems',
      'Branding system for Duality Gallery, utilizing bold black-and-white layouts, modular envelope shapes, and custom embossing.',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Duality Art Gallery',
      'Extreme solid ink fills, strict margins, premium matte paper finishes.',
      ARRAY['#000000', '#FFFFFF', '#E1E1E1', '#333333'],
      ARRAY['Design', 'Branding', 'Identity', 'Gallery'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d04',
      v_raw_id,
      'Kinetica Posters',
      'Project / Poster Art / International Style',
      'Asymmetric Swiss Type Motion',
      'A tribute poster series to the Swiss International Style. Features hard-angled geometric blocks, red highlights, and Helvetica structures.',
      'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80'
      ],
      2024,
      'Kinetica Sound Festival',
      'Swiss Grid system, bright primary red spots, modular geometry, dynamic type hierarchy.',
      ARRAY['#101010', '#FAFAFA', '#E02A24', '#3A3C40'],
      ARRAY['Design', 'Poster', 'Swiss', 'Typography'],
      'approved',
      '{}'::jsonb
    ),

    -- ── 5. UI/UX Design (Chronos Lab) ────────────────────────────────────────
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e01',
      v_chronos_id,
      'Aura Fintech App',
      'Project / Mobile Interface / Wealth Management',
      'Glassmorphic Financial Arcs',
      'Redefining digital wealth management with Aura. Introducing neumorphic dashboard cards, fluid financial arcs, and ultra-high contrast dark modes.',
      '/images/aura-interface.png',
      ARRAY[
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Aura Capital Inc',
      'Sleek dark themes, smooth neon progress indicators, glassmorphism overlays, soft shadows.',
      ARRAY['#0B0C10', '#1F2833', '#66FCF1', '#45A29E'],
      ARRAY['UI/UX', 'Mobile', 'Fintech', 'Dark Mode'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e02',
      v_chronos_id,
      'Sonder e-Commerce',
      'Project / Web Experience / High-Fashion',
      'Oversized Minimalist Grids',
      'Web experience architecture for Sonder e-Store, highlighting oversized imagery borders, fluid product transitions, and dynamic responsive masonry grids.',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1000&q=80'
      ],
      2024,
      'Sonder Wear Europe',
      'Asymmetric grid alignments, high-resolution organic fashion overlays, clean typography.',
      ARRAY['#121212', '#FAFAFA', '#C2B29F', '#4E4E4E'],
      ARRAY['UI/UX', 'Web', 'Fashion', 'Grid'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e03',
      v_chronos_id,
      'Synapse Notes App',
      'Project / Product / Knowledge Web',
      'Focused Typography & Nodes',
      'Product design layout for Synapse Notes. Featuring an interactive node-graph visualizer, clean focus-mode serif typefaces, and modular side panels.',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Synapse Labs',
      'Elegantly spaced layout, node graph UI simulation, focus-mode typography grids.',
      ARRAY['#16161D', '#FFFFFF', '#6F42C1', '#E9ECEF'],
      ARRAY['UI/UX', 'Product', 'Notes', 'Graph'],
      'approved',
      '{}'::jsonb
    ),
    (
      'd0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e04',
      v_chronos_id,
      'Chronos Calendar',
      'Project / Web App / Interaction',
      'Fluid Motion Timeline Calendar',
      'Designing calendar schedules as a continuous, fluid timeline. Chronos removes calendar grid stress using fluid motion-driven timeline boxes.',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=85',
      ARRAY[
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80'
      ],
      2025,
      'Chronos Time Systems',
      'Dynamic timeline animations, rounded scheduling boxes, soft colorful event tags.',
      ARRAY['#0D0D0D', '#FAFAFA', '#6B7280', '#10B981'],
      ARRAY['UI/UX', 'Web App', 'Calendar', 'Motion'],
      'approved',
      '{}'::jsonb
    );

  RAISE NOTICE '20 Premium Projects successfully seeded for diverse creative creators, brands, and studios!';
END $$;
