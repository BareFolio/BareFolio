const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file to extract Supabase credentials
const envPath = path.join(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verified user ID from query profiles check
const MAIN_USER_ID = "9473a28d-7f24-4c60-9d4a-312e10a94bfe";

// Predefined 20 valid UUID strings for deterministic and idempotent project seeding
const PROJECTS_DATA = [
  // ── 1. Photography (Alex McQueen theme) ─────────────────────────────────────
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a01",
    userId: MAIN_USER_ID,
    title: "Quietude",
    discipline: "Project / Fine Art / Landscape Photography",
    atmosphere: "Nordic Silence & Mist",
    description: "A visual study of absolute silence. Exploring the raw, quiet landscapes of the Nordic regions under heavy overcast skies and cold mist.",
    cover_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "National Nordic Museum",
    visual_language: "Stark contrast, low exposure, desaturated green-blue tones, and vast atmospheric scale.",
    palette: ["#1D2A2B", "#4A5A58", "#A2B3B0", "#EAEFEF"],
    tags: ["Photography", "Landscape", "Nordic", "Fine Art"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a02",
    userId: MAIN_USER_ID,
    title: "Sartorial Portraits",
    discipline: "Project / Studio Portraiture / Fashion",
    atmosphere: "High-Contrast Monochrome",
    description: "High-fashion studio portraiture focusing on sharp sartorial tailoring, harsh shadows, and intense raw human micro-expressions.",
    cover_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2024,
    client: "Dansk Magazine",
    visual_language: "Chiaroscuro studio lighting, rich deep black levels, and highly structured clothing textiles.",
    palette: ["#0B0B0B", "#3A3A3A", "#8F8F8F", "#FAFAFA"],
    tags: ["Photography", "Portrait", "Monochrome", "Fashion"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a03",
    userId: MAIN_USER_ID,
    title: "Brutalist Forms",
    discipline: "Project / Architecture / Fine Art",
    atmosphere: "Raw Concrete Geometry",
    description: "A architectural photography series exploring structural weight, structural shadows, and the tactile concrete details of European Brutalist landmarks.",
    cover_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Danish Architecture Institute",
    visual_language: "Strict geometric alignment, high-noon hard lighting, and high-grain matte print simulation.",
    palette: ["#444444", "#777777", "#B8B8B8", "#F2F2F2"],
    tags: ["Photography", "Architecture", "Brutalisim", "Concrete"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7a04",
    userId: MAIN_USER_ID,
    title: "Interlocking Shadows",
    discipline: "Project / Street / Documentary",
    atmosphere: "High-Contrast Urban Canvas",
    description: "Capturing the transient interlocking shadows cast by high concrete architectures on lone walkers in street landscapes.",
    cover_url: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1496568818309-53d7c7753022?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2024,
    client: "Self-Published Specimen",
    visual_language: "Extreme dynamic range, isolated highlights, deep black graphic forms.",
    palette: ["#050505", "#2C221E", "#C7B299", "#FFFFFF"],
    tags: ["Photography", "Street", "Shadows", "Minimalism"]
  },

  // ── 2. Interior Design (Luisa Barriga theme) ────────────────────────────────
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b01",
    userId: MAIN_USER_ID,
    title: "Nordic Haven",
    discipline: "Project / Residential Lounge / Warm Minimalism",
    atmosphere: "Organic Warmth & Light",
    description: "A private residential lounge designed around the concepts of thermal comfort, natural daylight optimization, and warm light-oak furnishings.",
    cover_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1616166330003-8e550d40b0f8?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Hansen Residence",
    visual_language: "Soft diffuse lighting, rich textured wool fabrics, pale oak paneling, and floating curves.",
    palette: ["#DED8CE", "#C6B9A8", "#8B7D6C", "#3C352A"],
    tags: ["Interiors", "Lounge", "Scandinavian", "Oak"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b02",
    userId: MAIN_USER_ID,
    title: "The Concrete Loft",
    discipline: "Project / Apartment / Brutalist",
    atmosphere: "Industrial Steel & Warm Walnut",
    description: "An industrial modern loft apartment detailed with micro-cement floor plaster, raw steel partitions, and floor-to-ceiling walnut cabinets.",
    cover_url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2024,
    client: "Vessel Capital Ltd",
    visual_language: "Strong volumetric contrast, black steel profiles, warm walnut offsets, brutalist raw walls.",
    palette: ["#4F4F4F", "#78604B", "#A89481", "#EAEAEA"],
    tags: ["Interiors", "Loft", "Concrete", "Brutalist"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b03",
    userId: MAIN_USER_ID,
    title: "Atelier Ocre",
    discipline: "Project / Creative Office / Mediterranean",
    atmosphere: "Terracotta & Natural Rattan",
    description: "A boutique workspace designed with textured Mediterranean ochre plasters, built-in shelving, and earthy rattan and linen accents.",
    cover_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1618221381711-42ca8ab6e908?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1618219942942-dd91450b36ef?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Ocre Creative Agency",
    visual_language: "Warm sunlit angles, clay plaster textures, organic materials, earth-toned gradients.",
    palette: ["#C57D5D", "#D8B29A", "#ECE0D1", "#765847"],
    tags: ["Interiors", "Office", "Mediterranean", "Plaster"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7b04",
    userId: MAIN_USER_ID,
    title: "Monochromatic Den",
    discipline: "Project / Executive Study / Dark Room",
    atmosphere: "Charcoal Velvet & Leather",
    description: "A private study room finished in deep charcoal velvet wall linings, patinated leather armchairs, and direct low-voltage spotlights.",
    cover_url: "https://images.unsplash.com/photo-1618219942942-dd91450b36ef?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Secretariat Holding",
    visual_language: "High shadows, warm brass nodes, rich black velvet textures, intimate direct spotlighting.",
    palette: ["#141414", "#2B2A28", "#8C7C72", "#FFFFFF"],
    tags: ["Interiors", "Den", "Leather", "Charcoal"]
  },

  // ── 3. 3D Modeling / CGI (Yanis theme) ──────────────────────────────────────
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c01",
    userId: MAIN_USER_ID,
    title: "Vessel Studies",
    discipline: "Project / CGI Simulation / Ceramic Art",
    atmosphere: "Digital Physicality & Glazes",
    description: "Abstract CGI explorations of physical clay vessel responses, digital zero-gravity, and procedural matte and glossy volcanic glazes.",
    cover_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1618005198143-e5283b519a7f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Galerie Digital",
    visual_language: "Soft global illumination, highly tactile micro-displacement glazes, structural balance.",
    palette: ["#CDA291", "#3C3F4A", "#E6E2DF", "#101216"],
    tags: ["CGI", "3D", "Ceramics", "Simulation"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c02",
    userId: MAIN_USER_ID,
    title: "Specular Chrome",
    discipline: "Project / Motion CGI / Metallic Fluid",
    atmosphere: "Mercury Refractions",
    description: "High-specularity fluid simulation renders exploring metallic surfaces, curved mercury flows, and architectural neon reflections.",
    cover_url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2024,
    client: "Node Motion Festival",
    visual_language: "High reflection values, high contrast hdri environment maps, fluid mercury curves.",
    palette: ["#1B1B1D", "#EBEBEB", "#FF007F", "#00F0FF"],
    tags: ["CGI", "3D", "Fluid", "Chrome"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c03",
    userId: MAIN_USER_ID,
    title: "Tactile Tech",
    discipline: "Project / Product 3D / Concept",
    atmosphere: "Retro-Futuristic Matte Hardware",
    description: "Conceptual 3D product rendering of modular portable audio recording hardware, featuring high-fidelity matte plastic textures and vintage steel dials.",
    cover_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Teenage Sound Concept",
    visual_language: "Hard shadows, clinical studio product lighting, orange tactile accents, micro text engraving.",
    palette: ["#2B2B2D", "#FAFAFA", "#E05A3E", "#A0A5AA"],
    tags: ["CGI", "3D", "Product", "Hardware"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7c04",
    userId: MAIN_USER_ID,
    title: "Mineral Landscapes",
    discipline: "Project / Landscape CGI / Environmental",
    atmosphere: "Basalt Monoliths & Reflective Sea",
    description: "CGI virtual environment featuring geometric volcanic basalt monoliths emerging from perfectly calm, mirrored digital waters.",
    cover_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Metaspace Art",
    visual_language: "Ethereal sunset lighting, perfect flat mirror reflections, crisp mineral volcanic textures.",
    palette: ["#1F1D2B", "#394E68", "#D9E4EC", "#14151B"],
    tags: ["CGI", "3D", "Landscape", "Monolith"]
  },

  // ── 4. Graphic Design (Raw Lab theme) ───────────────────────────────────────
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d01",
    userId: MAIN_USER_ID,
    title: "STOW Coffee Branding",
    discipline: "Project / Visual Identity / Video Design",
    atmosphere: "Swiss Editorial & Premium Metal",
    description: "Restoring coffee branding to its raw, monospaced typography roots. Featuring custom silver tin boxes with debossed letterforms and high-contrast grids.",
    cover_url: "/images/stow/stow-boxes.png",
    images: [
      "/images/stow/stow-nestor-lasso.png",
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2024,
    client: "Stow, Coffee Ltd",
    visual_language: "Massive Switzer headers, technical monospaced descriptors, high-end metallic mockups.",
    palette: ["#101010", "#EAEAEA", "#E5DCD3", "#FF5F1F"],
    tags: ["Identity", "Branding", "Swiss", "Packaging"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d02",
    userId: MAIN_USER_ID,
    title: "Chronicle Typeface",
    discipline: "Project / Editorial / Typography",
    atmosphere: "Strict Grids & Book Structures",
    description: "Specimen design for Chronicle, a custom sharp serif typeface. The book layout explores line tension, margin structures, and book spines.",
    cover_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2024,
    client: "Zurich Typography Press",
    visual_language: "Strict baseline alignment, oversized type, deep charcoal ink ink-spread simulations.",
    palette: ["#151515", "#F7F5F0", "#8E8D88", "#C3B195"],
    tags: ["Design", "Typography", "Editorial", "Book"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d03",
    userId: MAIN_USER_ID,
    title: "Duality Identity",
    discipline: "Project / Corporate Branding / Gallery",
    atmosphere: "Ultra-High Contrast Gallery Systems",
    description: "Branding system for Duality Gallery, utilizing bold black-and-white layouts, modular envelope shapes, and custom embossing.",
    cover_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Duality Art Gallery",
    visual_language: "Extreme solid ink fills, strict margins, premium matte paper finishes.",
    palette: ["#000000", "#FFFFFF", "#E1E1E1", "#333333"],
    tags: ["Design", "Branding", "Identity", "Gallery"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7d04",
    userId: MAIN_USER_ID,
    title: "Kinetica Posters",
    discipline: "Project / Poster Art / International Style",
    atmosphere: "Asymmetric Swiss Type Motion",
    description: "A tribute poster series to the Swiss International Style. Features hard-angled geometric blocks, red highlights, and Helvetica structures.",
    cover_url: "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2024,
    client: "Kinetica Sound Festival",
    visual_language: "Swiss Grid system, bright primary red spots, modular geometry, dynamic type hierarchy.",
    palette: ["#101010", "#FAFAFA", "#E02A24", "#3A3C40"],
    tags: ["Design", "Poster", "Swiss", "Typography"]
  },

  // ── 5. UI/UX Design (Chronos Lab theme) ─────────────────────────────────────
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e01",
    userId: MAIN_USER_ID,
    title: "Aura Fintech App",
    discipline: "Project / Mobile Interface / Wealth Management",
    atmosphere: "Glassmorphic Financial Arcs",
    description: "Redefining digital wealth management with Aura. Introducing neumorphic dashboard cards, fluid financial arcs, and ultra-high contrast dark modes.",
    cover_url: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Aura Capital Inc",
    visual_language: "Sleek dark themes, smooth neon progress indicators, glassmorphism overlays, soft shadows.",
    palette: ["#0B0C10", "#1F2833", "#66FCF1", "#45A29E"],
    tags: ["UI/UX", "Mobile", "Fintech", "Dark Mode"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e02",
    userId: MAIN_USER_ID,
    title: "Sonder e-Commerce",
    discipline: "Project / Web Experience / High-Fashion",
    atmosphere: "Oversized Minimalist Grids",
    description: "Web experience architecture for Sonder e-Store, highlighting oversized imagery borders, fluid product transitions, and dynamic responsive masonry grids.",
    cover_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2024,
    client: "Sonder Wear Europe",
    visual_language: "Asymmetric grid alignments, high-resolution organic fashion overlays, clean typography.",
    palette: ["#121212", "#FAFAFA", "#C2B29F", "#4E4E4E"],
    tags: ["UI/UX", "Web", "Fashion", "Grid"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e03",
    userId: MAIN_USER_ID,
    title: "Synapse Notes App",
    discipline: "Project / Product / Knowledge Web",
    atmosphere: "Focused Typography & Nodes",
    description: "Product design layout for Synapse Notes. Featuring an interactive node-graph visualizer, clean focus-mode serif typefaces, and modular side panels.",
    cover_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Synapse Labs",
    visual_language: "Elegantly spaced layout, node graph UI simulation, focus-mode typography grids.",
    palette: ["#16161D", "#FFFFFF", "#6F42C1", "#E9ECEF"],
    tags: ["UI/UX", "Product", "Notes", "Graph"]
  },
  {
    id: "d0a92d8f-74fa-4e0d-b86e-b6a2f4fa7e04",
    userId: MAIN_USER_ID,
    title: "Chronos Calendar",
    discipline: "Project / Web App / Interaction",
    atmosphere: "Fluid Motion Timeline Calendar",
    description: "Designing calendar schedules as a continuous, fluid timeline. Chronos removes calendar grid stress using fluid motion-driven timeline boxes.",
    cover_url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80"
    ],
    year: 2025,
    client: "Chronos Time Systems",
    visual_language: "Dynamic timeline animations, rounded scheduling boxes, soft colorful event tags.",
    palette: ["#0D0D0D", "#FAFAFA", "#6B7280", "#10B981"],
    tags: ["UI/UX", "Web App", "Calendar", "Motion"]
  }
];

async function runSeed() {
  console.log('--- STARTING CORRECTED PREMIUM SEED (UUID COMPLIANT) ---');

  // Prepare database connection check
  console.log(`Verifying connection. Inserting into main user account: @victxrchaves...`);

  // 1. Delete existing seeded UUID projects to prevent conflicts
  const projectIdsToDelete = PROJECTS_DATA.map(p => p.id);
  console.log(`Cleaning up old demo projects...`);
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .in('id', projectIdsToDelete);

  if (deleteError) {
    console.warn('Warning during deletion cleanup:', deleteError.message);
  } else {
    console.log('Old demo projects successfully removed from Supabase.');
  }

  // 2. Insert all projects deterministically
  let successCount = 0;
  for (const proj of PROJECTS_DATA) {
    try {
      const projectPayload = {
        id: proj.id,
        user_id: proj.userId,
        title: proj.title,
        discipline: proj.discipline,
        atmosphere: proj.atmosphere,
        description: proj.description,
        cover_url: proj.cover_url,
        images: proj.images,
        year: proj.year,
        client: proj.client,
        visual_language: proj.visual_language,
        palette: proj.palette,
        tags: proj.tags,
        verification_status: 'approved',
        ai_tags: {}
      };

      const { error: insertError } = await supabase
        .from('projects')
        .insert(projectPayload);

      if (insertError) {
        console.error(`Error inserting "${proj.title}":`, insertError.message);
      } else {
        console.log(`Success: Loaded project "${proj.title}" into Supabase.`);
        successCount++;
      }
    } catch (err) {
      console.error(`Catch failure on "${proj.title}":`, err.message);
    }
  }

  console.log(`--- SEED PROCEDURE COMPLETE ---`);
  console.log(`Successfully populated ${successCount}/20 projects into Supabase database!`);
}

runSeed();
