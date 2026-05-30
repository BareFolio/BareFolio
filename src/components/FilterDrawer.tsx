'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronDown } from 'lucide-react'

interface TreeNode {
  name: string
  count?: string
  children?: TreeNode[]
}

const CATEGORY_TREE: TreeNode[] = [
  {
    name: 'Design',
    count: '450k works',
    children: [
      {
        name: 'Graphic',
        count: '1.2k works',
        children: [
          { name: 'Editorial Design', children: [{ name: 'Magazine Layout' }, { name: 'Newspaper' }, { name: 'Cover Design' }, { name: 'Spread Design' }, { name: 'Annual Reports' }, { name: 'Newsletter' }] },
          { name: 'UX/UI Design', children: [{ name: 'Mobile Apps' }, { name: 'Web Apps' }, { name: 'Design Systems' }, { name: 'Prototyping' }, { name: 'User Research' }, { name: 'Interaction Design' }] },
          { name: 'Branding', children: [{ name: 'Logo design' }, { name: 'Identity systems' }, { name: 'Brand guidelines' }, { name: 'Rebranding' }, { name: 'Visual naming' }, { name: 'Editorial branding' }] },
          { name: 'Packaging', children: [{ name: 'Food & Beverage' }, { name: 'Cosmetics' }, { name: 'Retail' }, { name: 'Industrial' }, { name: 'Luxury' }, { name: 'Sustainable' }] },
          { name: 'Typography', children: [{ name: 'Typeface Design' }, { name: 'Lettering' }, { name: 'Calligraphy' }, { name: 'Display Type' }, { name: 'Type Systems' }, { name: 'Variable Fonts' }] },
          { name: 'Motion Graphics', children: [{ name: 'Title Sequences' }, { name: 'Brand Animation' }, { name: 'Social Content' }, { name: 'Explainers' }, { name: 'UI Motion' }, { name: 'Broadcast' }] },
          { name: 'Digital Design', children: [{ name: 'Social Media' }, { name: 'Email Design' }, { name: 'Digital Ads' }, { name: 'Web Banners' }, { name: 'App Icons' }, { name: 'Data Viz' }] },
          { name: 'Print Design', children: [{ name: 'Posters' }, { name: 'Brochures' }, { name: 'Zines' }, { name: 'Signage' }, { name: 'Stationery' }, { name: 'Infographics' }] },
        ],
      },
      {
        name: 'Product',
        count: '3k works',
        children: [
          { name: 'Industrial Product', children: [{ name: 'Appliances' }, { name: 'Tools' }, { name: 'Medical Devices' }, { name: 'Transport' }, { name: 'Sports' }, { name: 'Furniture' }] },
          { name: 'Furniture', children: [{ name: 'Seating' }, { name: 'Tables' }, { name: 'Storage' }, { name: 'Outdoor' }, { name: "Children's" }, { name: 'Office' }] },
          { name: 'Consumer Electronics', children: [{ name: 'Wearables' }, { name: 'Audio' }, { name: 'Computing' }, { name: 'Smart Home' }, { name: 'Mobile' }, { name: 'Gaming' }] },
          { name: 'Jewelry & Accessories', children: [{ name: 'Fine Jewelry' }, { name: 'Fashion Jewelry' }, { name: 'Watches' }, { name: 'Bags' }, { name: 'Eyewear' }, { name: 'Hats' }] },
          { name: 'Footwear', children: [{ name: 'Athletic' }, { name: 'Casual' }, { name: 'Formal' }, { name: 'Boots' }, { name: 'Sandals' }, { name: 'Sustainable' }] },
          { name: 'Automotive', children: [{ name: 'Exterior' }, { name: 'Interior' }, { name: 'Concept' }, { name: 'Electric' }, { name: 'Racing' }, { name: 'Motorcycle' }] },
        ],
      },
      {
        name: 'Interior',
        count: '906 works',
        children: [
          { name: 'Residential', children: [{ name: 'Living Room' }, { name: 'Bedroom' }, { name: 'Kitchen' }, { name: 'Bathroom' }, { name: 'Home Office' }, { name: 'Outdoor' }] },
          { name: 'Commercial', children: [{ name: 'Offices' }, { name: 'Retail' }, { name: 'Healthcare' }, { name: 'Educational' }, { name: 'Cultural' }, { name: 'F&B' }] },
          { name: 'Hospitality', children: [{ name: 'Hotels' }, { name: 'Restaurants' }, { name: 'Bars' }, { name: 'Spas' }, { name: 'Clubs' }, { name: 'Cafes' }] },
          { name: 'Retail', children: [{ name: 'Fashion Retail' }, { name: 'Food Retail' }, { name: 'Electronics' }, { name: 'Beauty' }, { name: 'Bookstores' }, { name: 'Concept Stores' }] },
          { name: 'Office Space', children: [{ name: 'Open Plan' }, { name: 'Private Offices' }, { name: 'Meeting Rooms' }, { name: 'Co-working' }, { name: 'Reception' }, { name: 'Breakout' }] },
          { name: 'Exhibition', children: [{ name: 'Museum' }, { name: 'Gallery' }, { name: 'Trade Show' }, { name: 'Pop-up' }, { name: 'Brand Experience' }, { name: 'Science' }] },
        ],
      },
      {
        name: 'Fashion',
        count: '2.3k works',
        children: [
          { name: 'Ready-to-Wear', children: [{ name: 'Casual' }, { name: 'Smart Casual' }, { name: 'Business' }, { name: 'Party' }, { name: 'Resort' }, { name: 'Transitional' }] },
          { name: 'Haute Couture', children: [{ name: 'Evening Wear' }, { name: 'Bridal' }, { name: 'Theatrical' }, { name: 'Sculptural' }, { name: 'Archive' }, { name: 'Custom' }] },
          { name: 'Accessories', children: [{ name: 'Bags' }, { name: 'Shoes' }, { name: 'Jewelry' }, { name: 'Hats' }, { name: 'Scarves' }, { name: 'Belts' }] },
          { name: 'Sportswear', children: [{ name: 'Running' }, { name: 'Yoga' }, { name: 'Team Sports' }, { name: 'Swimming' }, { name: 'Cycling' }, { name: 'Outdoor' }] },
          { name: 'Sustainable', children: [{ name: 'Upcycling' }, { name: 'Natural Fibres' }, { name: 'Zero Waste' }, { name: 'Deadstock' }, { name: 'Rental' }, { name: 'Second-hand' }] },
          { name: 'Streetwear', children: [{ name: 'Graphic Tees' }, { name: 'Hoodies' }, { name: 'Sneakers' }, { name: 'Caps' }, { name: 'Denim' }, { name: 'Outerwear' }] },
        ],
      },
      {
        name: 'Editorial',
        count: '256 works',
        children: [
          { name: 'Magazine', children: [{ name: 'Cover Design' }, { name: 'Feature Spreads' }, { name: 'Photo Direction' }, { name: 'Typography Layout' }, { name: 'Infographics' }, { name: 'Ad Layout' }] },
          { name: 'Book Design', children: [{ name: 'Cover' }, { name: 'Interior Layout' }, { name: 'Illustrations' }, { name: "Children's Books" }, { name: 'Art Books' }, { name: 'Self-publishing' }] },
          { name: 'Newspaper', children: [{ name: 'Front Page' }, { name: 'Feature' }, { name: 'Opinion' }, { name: 'Sport' }, { name: 'Data' }, { name: 'Digital Edition' }] },
          { name: 'Annual Reports', children: [{ name: 'Corporate' }, { name: 'NGO' }, { name: 'Financial' }, { name: 'Environmental' }, { name: 'Social Impact' }, { name: 'Cultural' }] },
          { name: 'Catalogs', children: [{ name: 'Fashion' }, { name: 'Product' }, { name: 'Art' }, { name: 'Architecture' }, { name: 'Retail' }, { name: 'Trade' }] },
          { name: 'Infographics', children: [{ name: 'Data Viz' }, { name: 'Explainers' }, { name: 'Maps' }, { name: 'Timelines' }, { name: 'Process' }, { name: 'Scientific' }] },
        ],
      },
      {
        name: 'Industrial',
        count: '256 works',
        children: [
          { name: 'Furniture', children: [{ name: 'Seating' }, { name: 'Tables' }, { name: 'Storage' }, { name: 'Lighting' }, { name: 'Outdoor' }, { name: 'Contract' }] },
          { name: 'Lighting', children: [{ name: 'Pendant' }, { name: 'Floor' }, { name: 'Wall' }, { name: 'Table' }, { name: 'Architectural' }, { name: 'Outdoor' }] },
          { name: 'Medical Devices', children: [{ name: 'Diagnostic' }, { name: 'Therapeutic' }, { name: 'Wearable' }, { name: 'Surgical' }, { name: 'Rehabilitation' }, { name: 'Monitoring' }] },
          { name: 'Transportation', children: [{ name: 'Automotive' }, { name: 'Aviation' }, { name: 'Marine' }, { name: 'Rail' }, { name: 'Micro-mobility' }, { name: 'Future Concept' }] },
          { name: 'Kitchenware', children: [{ name: 'Cookware' }, { name: 'Cutlery' }, { name: 'Storage' }, { name: 'Appliances' }, { name: 'Tableware' }, { name: 'Barware' }] },
          { name: 'Tools', children: [{ name: 'Hand Tools' }, { name: 'Power Tools' }, { name: 'Garden' }, { name: 'Professional' }, { name: 'Smart Tools' }, { name: 'Measuring' }] },
        ],
      },
      {
        name: 'Video Games',
        count: '547 works',
        children: [
          { name: 'Concept Art', children: [{ name: 'Environment' }, { name: 'Character' }, { name: 'Vehicle' }, { name: 'Weapon' }, { name: 'Creature' }, { name: 'UI/UX' }] },
          { name: 'UI/UX', children: [{ name: 'HUD' }, { name: 'Menus' }, { name: 'Icons' }, { name: 'Loading Screens' }, { name: 'Inventory' }, { name: 'Map' }] },
          { name: 'Character Design', children: [{ name: 'Hero' }, { name: 'Villain' }, { name: 'NPC' }, { name: 'Creature' }, { name: 'Fantasy' }, { name: 'Sci-fi' }] },
          { name: 'Environment', children: [{ name: 'Outdoor' }, { name: 'Indoor' }, { name: 'Sci-fi' }, { name: 'Fantasy' }, { name: 'Post-apocalyptic' }, { name: 'Urban' }] },
          { name: '3D Assets', children: [{ name: 'Characters' }, { name: 'Props' }, { name: 'Environments' }, { name: 'Vehicles' }, { name: 'Weapons' }, { name: 'Architecture' }] },
          { name: 'Animation', children: [{ name: 'Character Anim' }, { name: 'Cutscene' }, { name: 'Idle' }, { name: 'Combat' }, { name: 'Cinematic' }, { name: 'VFX' }] },
        ],
      },
      {
        name: '3D',
        count: '547 works',
        children: [
          { name: 'Product Visualization', children: [{ name: 'Commercial' }, { name: 'Technical' }, { name: 'E-commerce' }, { name: 'Lifestyle' }, { name: 'Exploded View' }, { name: 'Animation' }] },
          { name: 'Architectural 3D', children: [{ name: 'Exterior' }, { name: 'Interior' }, { name: 'Aerial' }, { name: 'Section' }, { name: 'Detail' }, { name: 'Construction' }] },
          { name: 'Character Modeling', children: [{ name: 'Realistic' }, { name: 'Stylized' }, { name: 'Game Ready' }, { name: 'VFX' }, { name: 'Sculpting' }, { name: 'Rigging' }] },
          { name: 'Environment Design', children: [{ name: 'Natural' }, { name: 'Urban' }, { name: 'Sci-fi' }, { name: 'Fantasy' }, { name: 'Interior' }, { name: 'Abstract' }] },
          { name: 'Motion 3D', children: [{ name: 'Logo Anim' }, { name: 'Product' }, { name: 'Abstract' }, { name: 'Architectural' }, { name: 'Character' }, { name: 'Data Viz' }] },
          { name: 'VR/AR', children: [{ name: 'Spatial Design' }, { name: 'Interactive' }, { name: 'Training' }, { name: 'Retail' }, { name: 'Real Estate' }, { name: 'Events' }] },
        ],
      },
      {
        name: 'Experimental',
        count: '547 works',
        children: [
          { name: 'Generative Art', children: [{ name: 'Code-based' }, { name: 'AI-assisted' }, { name: 'Parametric' }, { name: 'Algorithmic' }, { name: 'Random Systems' }, { name: 'Data Art' }] },
          { name: 'Interactive', children: [{ name: 'Installations' }, { name: 'Web Experiences' }, { name: 'Touch' }, { name: 'Voice' }, { name: 'Sensor-based' }, { name: 'Gamified' }] },
          { name: 'Data Visualization', children: [{ name: 'Information Design' }, { name: 'Network Maps' }, { name: 'Flow' }, { name: 'Cartography' }, { name: 'Statistical' }, { name: 'Real-time' }] },
          { name: 'Mixed Disciplines', children: [{ name: 'Art-Science' }, { name: 'Design-Music' }, { name: 'Fashion-Tech' }, { name: 'Food-Design' }, { name: 'Bio-Design' }, { name: 'Spatial-Digital' }] },
          { name: 'Net Art', children: [{ name: 'Browser-based' }, { name: 'Social Media Art' }, { name: 'Meme Art' }, { name: 'Hypertext' }, { name: 'Digital Archives' }, { name: 'Web Aesthetics' }] },
          { name: 'Bio Art', children: [{ name: 'Living Materials' }, { name: 'Biotech' }, { name: 'Ecology' }, { name: 'Speculative' }, { name: 'Tissue Culture' }, { name: 'Bio-fabrication' }] },
        ],
      },
      {
        name: 'Illustration',
        count: '547 works',
        children: [
          { name: 'Editorial', children: [{ name: 'Magazine' }, { name: 'News' }, { name: 'Opinion' }, { name: 'Feature' }, { name: "Children's" }, { name: 'Conceptual' }] },
          { name: 'Character', children: [{ name: 'Character Design' }, { name: 'Mascots' }, { name: 'Portraits' }, { name: 'Fantasy' }, { name: 'Sci-fi' }, { name: 'Cartoon' }] },
          { name: 'Conceptual', children: [{ name: 'Metaphorical' }, { name: 'Symbolic' }, { name: 'Abstract' }, { name: 'Narrative' }, { name: 'Surrealist' }, { name: 'Poetic' }] },
          { name: 'Technical', children: [{ name: 'Scientific' }, { name: 'Medical' }, { name: 'Architectural' }, { name: 'Engineering' }, { name: 'Botanical' }, { name: 'Archaeological' }] },
          { name: "Children's Book", children: [{ name: 'Picture Books' }, { name: 'Middle Grade' }, { name: 'Board Books' }, { name: 'Educational' }, { name: 'YA' }, { name: 'Graphic Novels' }] },
          { name: 'Scientific', children: [{ name: 'Natural History' }, { name: 'Astronomy' }, { name: 'Biology' }, { name: 'Chemistry' }, { name: 'Physics' }, { name: 'Medical' }] },
        ],
      },
    ],
  },
  {
    name: 'Visual Arts',
    count: '234k works',
    children: [
      {
        name: 'Illustration',
        children: [
          { name: 'Digital', children: [{ name: 'Digital Painting' }, { name: 'Vector Art' }, { name: 'Pixel Art' }, { name: 'Photo Manipulation' }, { name: 'Concept Art' }, { name: 'NFT Art' }] },
          { name: 'Traditional', children: [{ name: 'Pencil' }, { name: 'Ink' }, { name: 'Watercolor' }, { name: 'Gouache' }, { name: 'Oil' }, { name: 'Mixed' }] },
          { name: 'Editorial', children: [{ name: 'Magazine' }, { name: 'News' }, { name: 'Opinion' }, { name: 'Book Cover' }, { name: 'Feature' }, { name: 'Commentary' }] },
          { name: 'Concept Art', children: [{ name: 'Game' }, { name: 'Film' }, { name: 'Animation' }, { name: 'Environment' }, { name: 'Character' }, { name: 'Vehicle' }] },
          { name: "Children's Book", children: [{ name: 'Picture Books' }, { name: 'Board Books' }, { name: 'YA' }, { name: 'Educational' }, { name: 'Graphic Novels' }, { name: 'Wordless' }] },
          { name: 'Scientific', children: [{ name: 'Botanical' }, { name: 'Zoological' }, { name: 'Medical' }, { name: 'Astronomical' }, { name: 'Geological' }, { name: 'Archaeological' }] },
        ],
      },
      {
        name: 'Painting',
        children: [
          { name: 'Watercolor', children: [{ name: 'Landscape' }, { name: 'Portrait' }, { name: 'Abstract' }, { name: 'Still Life' }, { name: 'Urban' }, { name: 'Botanical' }] },
          { name: 'Oil', children: [{ name: 'Landscape' }, { name: 'Portrait' }, { name: 'Still Life' }, { name: 'Abstract' }, { name: 'Figurative' }, { name: 'Narrative' }] },
          { name: 'Acrylic', children: [{ name: 'Abstract' }, { name: 'Portrait' }, { name: 'Pop Art' }, { name: 'Street Art' }, { name: 'Realism' }, { name: 'Mixed Media' }] },
          { name: 'Gouache', children: [{ name: 'Illustration' }, { name: 'Landscape' }, { name: 'Portrait' }, { name: 'Pattern' }, { name: 'Editorial' }, { name: 'Animation' }] },
          { name: 'Abstract', children: [{ name: 'Geometric' }, { name: 'Lyrical' }, { name: 'Expressionist' }, { name: 'Minimalist' }, { name: 'Color Field' }, { name: 'Gestural' }] },
          { name: 'Portraiture', children: [{ name: 'Realistic' }, { name: 'Expressive' }, { name: 'Contemporary' }, { name: 'Classical' }, { name: 'Self-portrait' }, { name: 'Conceptual' }] },
        ],
      },
      {
        name: 'Sculpture',
        children: [
          { name: 'Stone', children: [{ name: 'Marble' }, { name: 'Granite' }, { name: 'Limestone' }, { name: 'Sandstone' }, { name: 'Relief' }, { name: 'Abstract' }] },
          { name: 'Metal', children: [{ name: 'Cast Iron' }, { name: 'Bronze' }, { name: 'Steel' }, { name: 'Aluminium' }, { name: 'Welded' }, { name: 'Kinetic' }] },
          { name: 'Wood', children: [{ name: 'Carved' }, { name: 'Turned' }, { name: 'Assembled' }, { name: 'Relief' }, { name: 'Folk' }, { name: 'Abstract' }] },
          { name: 'Ceramic', children: [{ name: 'Wheel-thrown' }, { name: 'Hand-built' }, { name: 'Sculptural' }, { name: 'Functional' }, { name: 'Raku' }, { name: 'Porcelain' }] },
          { name: 'Mixed Media', children: [{ name: 'Found Objects' }, { name: 'Assemblage' }, { name: 'Textile' }, { name: 'Paper' }, { name: 'Resin' }, { name: 'Digital+Physical' }] },
          { name: 'Installation', children: [{ name: 'Site-specific' }, { name: 'Immersive' }, { name: 'Interactive' }, { name: 'Outdoor' }, { name: 'Gallery' }, { name: 'Conceptual' }] },
        ],
      },
      {
        name: 'Pattern-making',
        children: [
          { name: 'Textile', children: [{ name: 'Weaving' }, { name: 'Knitting' }, { name: 'Embroidery' }, { name: 'Printing' }, { name: 'Dyeing' }, { name: 'Pleating' }] },
          { name: 'Surface Design', children: [{ name: 'Wallpaper' }, { name: 'Ceramic' }, { name: 'Fabric' }, { name: 'Paper' }, { name: 'Digital' }, { name: 'Product' }] },
          { name: 'Repeat Patterns', children: [{ name: 'Half-drop' }, { name: 'Full-drop' }, { name: 'Ogee' }, { name: 'Tossed' }, { name: 'Stripe' }, { name: 'Block' }] },
          { name: 'Digital Patterns', children: [{ name: 'Vector' }, { name: 'Generative' }, { name: 'Parametric' }, { name: 'Photo-based' }, { name: 'AI-assisted' }, { name: 'Mixed' }] },
          { name: 'Hand-drawn', children: [{ name: 'Botanical' }, { name: 'Geometric' }, { name: 'Abstract' }, { name: 'Folk' }, { name: 'Illustrative' }, { name: 'Continuous Line' }] },
          { name: 'Geometric', children: [{ name: 'Islamic' }, { name: 'Op-Art' }, { name: 'Minimalist' }, { name: 'Kaleidoscopic' }, { name: 'Fractal' }, { name: 'Modular' }] },
        ],
      },
      {
        name: 'Mixed Media',
        children: [
          { name: 'Collage', children: [{ name: 'Paper' }, { name: 'Digital' }, { name: 'Photo' }, { name: 'Magazine' }, { name: 'Vintage' }, { name: 'Abstract' }] },
          { name: 'Assemblage', children: [{ name: 'Found Objects' }, { name: 'Industrial' }, { name: 'Natural' }, { name: 'Domestic' }, { name: 'Cultural' }, { name: 'Conceptual' }] },
          { name: 'Photo-painting', children: [{ name: 'Overpainting' }, { name: 'Cyanotype' }, { name: 'Darkroom' }, { name: 'Digital Hybrid' }, { name: 'Toning' }, { name: 'Transfer' }] },
          { name: 'Digital + Analog', children: [{ name: 'Scan+Digital' }, { name: 'Print+Draw' }, { name: 'Photo+Paint' }, { name: 'Code+Physical' }, { name: 'Glitch' }, { name: 'Transfer' }] },
          { name: 'Found Objects', children: [{ name: 'Everyday' }, { name: 'Natural' }, { name: 'Industrial' }, { name: 'Vintage' }, { name: 'Cultural' }, { name: 'Abstract' }] },
          { name: 'Installation', children: [{ name: 'Immersive' }, { name: 'Participatory' }, { name: 'Site-specific' }, { name: 'Temporal' }, { name: 'Sound' }, { name: 'Light' }] },
        ],
      },
      {
        name: 'Printmaking',
        children: [
          { name: 'Screen Print', children: [{ name: 'Photographic' }, { name: 'Hand-drawn' }, { name: 'Multi-layer' }, { name: 'Poster' }, { name: 'Fashion' }, { name: 'Fine Art' }] },
          { name: 'Etching', children: [{ name: 'Dry Point' }, { name: 'Aquatint' }, { name: 'Mezzotint' }, { name: 'Soft Ground' }, { name: 'Spit Bite' }, { name: 'Line' }] },
          { name: 'Lithography', children: [{ name: 'Stone' }, { name: 'Plate' }, { name: 'Photo' }, { name: 'Offset' }, { name: "Artist's Book" }, { name: 'Colour' }] },
          { name: 'Woodcut', children: [{ name: 'Relief' }, { name: 'Reduction' }, { name: 'Japanese' }, { name: 'Expressionist' }, { name: 'Abstract' }, { name: 'Contemporary' }] },
          { name: 'Relief Print', children: [{ name: 'Linocut' }, { name: 'Woodcut' }, { name: 'Collagraph' }, { name: 'Metal Relief' }, { name: 'Stamping' }, { name: 'Embossing' }] },
          { name: 'Risograph', children: [{ name: '2-colour' }, { name: '3-colour' }, { name: 'Textured' }, { name: 'Gradient' }, { name: 'Illustration' }, { name: 'Poster' }] },
        ],
      },
    ],
  },
  {
    name: 'Audiovisuals',
    count: '657k works',
    children: [
      {
        name: 'FilmMaker',
        children: [
          { name: 'Short Film', children: [{ name: 'Drama' }, { name: 'Comedy' }, { name: 'Horror' }, { name: 'Documentary' }, { name: 'Animation' }, { name: 'Experimental' }] },
          { name: 'Documentary', children: [{ name: 'Observational' }, { name: 'Expository' }, { name: 'Participatory' }, { name: 'Reflexive' }, { name: 'Performative' }, { name: 'Poetic' }] },
          { name: 'Music Video', children: [{ name: 'Narrative' }, { name: 'Performance' }, { name: 'Animation' }, { name: 'Conceptual' }, { name: 'Dance' }, { name: 'Hybrid' }] },
          { name: 'Commercial', children: [{ name: 'Brand Story' }, { name: 'Product' }, { name: 'Social Media' }, { name: 'TV Spot' }, { name: 'Launch' }, { name: 'Corporate' }] },
          { name: 'Experimental Film', children: [{ name: 'Abstract' }, { name: 'Found Footage' }, { name: 'Essay Film' }, { name: 'Structural' }, { name: 'Expanded Cinema' }, { name: 'Video Art' }] },
          { name: 'Feature Film', children: [{ name: 'Drama' }, { name: 'Action' }, { name: 'Comedy' }, { name: 'Thriller' }, { name: 'Sci-fi' }, { name: 'Romance' }] },
        ],
      },
      {
        name: 'VFX',
        children: [
          { name: 'Compositing', children: [{ name: 'Green Screen' }, { name: 'Multi-pass' }, { name: 'Sky Replacement' }, { name: 'Crowd Duplication' }, { name: 'Environment' }, { name: 'Clean Plate' }] },
          { name: '3D Effects', children: [{ name: 'Destruction' }, { name: 'Fire & Smoke' }, { name: 'Water' }, { name: 'Creatures' }, { name: 'Vehicles' }, { name: 'Architecture' }] },
          { name: 'Motion Capture', children: [{ name: 'Full Body' }, { name: 'Facial' }, { name: 'Hand' }, { name: 'Realtime' }, { name: 'Optical' }, { name: 'Inertial' }] },
          { name: 'Color Grading', children: [{ name: 'Commercial' }, { name: 'Film' }, { name: 'TV Series' }, { name: 'Music Video' }, { name: 'Documentary' }, { name: 'Social Media' }] },
          { name: 'Particle Effects', children: [{ name: 'Fire' }, { name: 'Smoke' }, { name: 'Explosions' }, { name: 'Magic' }, { name: 'Abstract' }, { name: 'Atmospheric' }] },
          { name: 'Environment FX', children: [{ name: 'Weather' }, { name: 'Landscapes' }, { name: 'Space' }, { name: 'Underwater' }, { name: 'Crowd' }, { name: 'Simulation' }] },
        ],
      },
      {
        name: 'Video Editing',
        children: [
          { name: 'Narrative', children: [{ name: 'Short Film' }, { name: 'Feature' }, { name: 'Series' }, { name: 'Branded Content' }, { name: 'Web Series' }, { name: 'Pilot' }] },
          { name: 'Documentary', children: [{ name: 'Long-form' }, { name: 'Short' }, { name: 'Episodic' }, { name: 'Interactive' }, { name: 'Archive-based' }, { name: 'Observational' }] },
          { name: 'Commercial', children: [{ name: 'TV Spot' }, { name: 'Social Ad' }, { name: 'Product Demo' }, { name: 'Brand Film' }, { name: 'Launch' }, { name: 'Corporate' }] },
          { name: 'Social Media', children: [{ name: 'Reels' }, { name: 'TikTok' }, { name: 'YouTube' }, { name: 'Stories' }, { name: 'Live' }, { name: 'Short-form' }] },
          { name: 'Wedding & Events', children: [{ name: 'Weddings' }, { name: 'Concerts' }, { name: 'Sports' }, { name: 'Corporate Events' }, { name: 'Graduation' }, { name: 'Fashion Shows' }] },
          { name: 'Corporate', children: [{ name: 'Internal Comms' }, { name: 'Training' }, { name: 'Recruitment' }, { name: 'CEO Messages' }, { name: 'Brand' }, { name: 'CSR' }] },
        ],
      },
      {
        name: 'Podcast',
        children: [
          { name: 'Interview', children: [{ name: 'Long-form' }, { name: 'Roundtable' }, { name: 'Investigative' }, { name: 'Celebrity' }, { name: 'Expert' }, { name: 'Street' }] },
          { name: 'Narrative', children: [{ name: 'True Crime' }, { name: 'Story-driven' }, { name: 'Personal Essay' }, { name: 'Serialized' }, { name: 'Archive' }, { name: 'Fiction' }] },
          { name: 'Educational', children: [{ name: 'Science' }, { name: 'History' }, { name: 'Language' }, { name: 'Skills' }, { name: 'Finance' }, { name: 'Health' }] },
          { name: 'Comedy', children: [{ name: 'Improv' }, { name: 'Stand-up Clips' }, { name: 'Sketches' }, { name: 'Observational' }, { name: 'Pop Culture' }, { name: 'Friends' }] },
          { name: 'Technology', children: [{ name: 'AI' }, { name: 'Startups' }, { name: 'Dev' }, { name: 'Design' }, { name: 'Gaming' }, { name: 'Sci & Tech' }] },
          { name: 'Culture & Arts', children: [{ name: 'Film' }, { name: 'Music' }, { name: 'Books' }, { name: 'Art' }, { name: 'Fashion' }, { name: 'Theatre' }] },
        ],
      },
      {
        name: 'Sound Design',
        children: [
          { name: 'Film & TV', children: [{ name: 'SFX' }, { name: 'Foley' }, { name: 'Ambience' }, { name: 'Score Integration' }, { name: 'Dialogue' }, { name: 'Sound Editing' }] },
          { name: 'Video Games', children: [{ name: 'SFX' }, { name: 'Music' }, { name: 'Voice' }, { name: 'Ambience' }, { name: 'Interactive Audio' }, { name: 'Procedural' }] },
          { name: 'Music Production', children: [{ name: 'Mixing' }, { name: 'Mastering' }, { name: 'Synthesis' }, { name: 'Sampling' }, { name: 'Arrangement' }, { name: 'Recording' }] },
          { name: 'Podcast Production', children: [{ name: 'Recording' }, { name: 'Editing' }, { name: 'Mix' }, { name: 'Sound Branding' }, { name: 'Intro/Outro' }, { name: 'Chapter Marks' }] },
          { name: 'Spatial Audio', children: [{ name: 'Binaural' }, { name: 'Ambisonics' }, { name: 'Dolby Atmos' }, { name: 'Object-based' }, { name: 'VR Audio' }, { name: 'ASMR' }] },
          { name: 'Brand Sound', children: [{ name: 'Brand Music' }, { name: 'Sonic Logo' }, { name: 'UI Sound' }, { name: 'Product Sound' }, { name: 'Retail Ambience' }, { name: 'Notification' }] },
        ],
      },
    ],
  },
  {
    name: 'Architecture',
    count: '450k works',
    children: [
      {
        name: 'Residential',
        children: [
          { name: 'Single Family', children: [{ name: 'Minimalist' }, { name: 'Contemporary' }, { name: 'Traditional' }, { name: 'Eco' }, { name: 'Compact' }, { name: 'Luxury' }] },
          { name: 'Multi-family', children: [{ name: 'Apartments' }, { name: 'Condos' }, { name: 'Social Housing' }, { name: 'Mixed-use' }, { name: 'Tower' }, { name: 'Low-rise' }] },
          { name: 'Affordable Housing', children: [{ name: 'Social' }, { name: 'Co-housing' }, { name: 'Modular' }, { name: 'Prefab' }, { name: 'Community Land Trust' }, { name: 'Adaptive Reuse' }] },
          { name: 'Luxury', children: [{ name: 'Private Villas' }, { name: 'Penthouses' }, { name: 'Estates' }, { name: 'Smart Homes' }, { name: 'Resort' }, { name: 'Custom' }] },
          { name: 'Renovation', children: [{ name: 'Restoration' }, { name: 'Extension' }, { name: 'Conversion' }, { name: 'Interior Overhaul' }, { name: 'Heritage' }, { name: 'Adaptive' }] },
          { name: 'Passive House', children: [{ name: 'Zero Energy' }, { name: 'Solar' }, { name: 'Green Roof' }, { name: 'Mass Timber' }, { name: 'Earth' }, { name: 'Natural' }] },
        ],
      },
      {
        name: 'Commercial',
        children: [
          { name: 'Office Buildings', children: [{ name: 'Corporate HQ' }, { name: 'Co-working' }, { name: 'Tech Campus' }, { name: 'Creative Hub' }, { name: 'High-rise' }, { name: 'Adaptive' }] },
          { name: 'Retail', children: [{ name: 'Department Store' }, { name: 'Shopping Centre' }, { name: 'Flagship' }, { name: 'Pop-up' }, { name: 'Market' }, { name: 'Street Retail' }] },
          { name: 'Hotels', children: [{ name: 'Boutique' }, { name: 'Luxury' }, { name: 'Budget' }, { name: 'Resort' }, { name: 'Heritage' }, { name: 'Hostel' }] },
          { name: 'Cultural Centers', children: [{ name: 'Museum' }, { name: 'Gallery' }, { name: 'Library' }, { name: 'Theatre' }, { name: 'Concert Hall' }, { name: 'Community Centre' }] },
          { name: 'Healthcare', children: [{ name: 'Hospital' }, { name: 'Clinic' }, { name: 'Mental Health' }, { name: 'Elderly Care' }, { name: 'Research' }, { name: 'Sports Medicine' }] },
          { name: 'Educational', children: [{ name: 'School' }, { name: 'University' }, { name: 'Research' }, { name: 'Sports' }, { name: 'Early Years' }, { name: 'Special Needs' }] },
        ],
      },
      {
        name: 'Landscape',
        children: [
          { name: 'Parks & Gardens', children: [{ name: 'Public Park' }, { name: 'Botanical Garden' }, { name: 'Memorial' }, { name: 'Playground' }, { name: 'Community Garden' }, { name: 'Pocket Park' }] },
          { name: 'Urban Landscape', children: [{ name: 'Plazas' }, { name: 'Streetscapes' }, { name: 'Waterfront' }, { name: 'Green Corridors' }, { name: 'Rooftop' }, { name: 'Courtyard' }] },
          { name: 'Ecological Design', children: [{ name: 'Wetlands' }, { name: 'Forest Garden' }, { name: 'Rewilding' }, { name: 'Green Infrastructure' }, { name: 'Biophilic' }, { name: 'Remediation' }] },
          { name: 'Public Spaces', children: [{ name: 'Squares' }, { name: 'Promenades' }, { name: 'Markets' }, { name: 'Sports' }, { name: 'Cultural' }, { name: 'Transport Hub' }] },
          { name: 'Rooftop Gardens', children: [{ name: 'Food Growing' }, { name: 'Biodiversity' }, { name: 'Amenity' }, { name: 'Hospitality' }, { name: 'Private' }, { name: 'Public' }] },
          { name: 'Masterplanning', children: [{ name: 'New Towns' }, { name: 'Urban Regeneration' }, { name: 'Waterfront' }, { name: 'Campus' }, { name: 'Industrial' }, { name: 'Cultural Quarter' }] },
        ],
      },
      {
        name: 'Urban Planning',
        children: [
          { name: 'City Planning', children: [{ name: 'Master Plan' }, { name: 'Zoning' }, { name: 'Mixed-use' }, { name: 'Transport' }, { name: 'Density' }, { name: 'Heritage' }] },
          { name: 'Neighbourhood Design', children: [{ name: '15-min City' }, { name: 'Transit-oriented' }, { name: 'Walkable' }, { name: 'Mixed Community' }, { name: 'Green' }, { name: 'Historic' }] },
          { name: 'Transport Planning', children: [{ name: 'Cycling' }, { name: 'Walking' }, { name: 'Public Transport' }, { name: 'Road' }, { name: 'Logistics' }, { name: 'Mobility Hub' }] },
          { name: 'Smart Cities', children: [{ name: 'Data' }, { name: 'Sensors' }, { name: 'AI Planning' }, { name: 'Digital Twin' }, { name: 'Connected' }, { name: 'Responsive' }] },
          { name: 'Waterfront', children: [{ name: 'Port Regeneration' }, { name: 'Promenade' }, { name: 'Mixed-use' }, { name: 'Cultural' }, { name: 'Resilience' }, { name: 'Blue-green' }] },
          { name: 'Heritage Conservation', children: [{ name: 'Listed Buildings' }, { name: 'Historic Areas' }, { name: 'Adaptive Reuse' }, { name: 'Documentation' }, { name: 'Policy' }, { name: 'Tourism' }] },
        ],
      },
      {
        name: 'Interior Design',
        children: [
          { name: 'Residential Interior', children: [{ name: 'Living Room' }, { name: 'Bedroom' }, { name: 'Kitchen' }, { name: 'Home Office' }, { name: 'Children' }, { name: 'Outdoor' }] },
          { name: 'Commercial Interior', children: [{ name: 'Office' }, { name: 'Retail' }, { name: 'Hospitality' }, { name: 'Healthcare' }, { name: 'Education' }, { name: 'Cultural' }] },
          { name: 'Hospitality', children: [{ name: 'Hotel Lobby' }, { name: 'Restaurant' }, { name: 'Bar' }, { name: 'Spa' }, { name: 'Club' }, { name: 'Cafe' }] },
          { name: 'Retail Design', children: [{ name: 'Fashion' }, { name: 'Food' }, { name: 'Electronics' }, { name: 'Beauty' }, { name: 'Concept Store' }, { name: 'Pop-up' }] },
          { name: 'Exhibition Design', children: [{ name: 'Museum' }, { name: 'Gallery' }, { name: 'Trade Show' }, { name: 'Brand Experience' }, { name: 'Science' }, { name: 'Cultural' }] },
          { name: 'Set Design', children: [{ name: 'Film' }, { name: 'Theatre' }, { name: 'TV' }, { name: 'Events' }, { name: 'Photography' }, { name: 'Virtual Production' }] },
        ],
      },
    ],
  },
  {
    name: 'Photography',
    count: '312k works',
    children: [
      {
        name: 'Editorial',
        children: [
          { name: 'Magazine', children: [{ name: 'Cover' }, { name: 'Feature' }, { name: 'Fashion' }, { name: 'Lifestyle' }, { name: 'Beauty' }, { name: 'Culture' }] },
          { name: 'Newspaper', children: [{ name: 'News' }, { name: 'Feature' }, { name: 'Sport' }, { name: 'Culture' }, { name: 'Lifestyle' }, { name: 'Business' }] },
          { name: 'News Photography', children: [{ name: 'Breaking News' }, { name: 'Politics' }, { name: 'Sport' }, { name: 'Environment' }, { name: 'War' }, { name: 'Social' }] },
          { name: 'Feature Stories', children: [{ name: 'Long-form' }, { name: 'Portrait' }, { name: 'Place' }, { name: 'Social Issues' }, { name: 'Food' }, { name: 'Travel' }] },
          { name: 'Photo Essays', children: [{ name: 'Documentary' }, { name: 'Personal' }, { name: 'Social' }, { name: 'Environmental' }, { name: 'Cultural' }, { name: 'Conceptual' }] },
          { name: 'Political', children: [{ name: 'Campaign' }, { name: 'Policy' }, { name: 'Protest' }, { name: 'Diplomacy' }, { name: 'Satire' }, { name: 'War' }] },
        ],
      },
      {
        name: 'Fashion Photography',
        children: [
          { name: 'High Fashion', children: [{ name: 'Couture' }, { name: 'Designer' }, { name: 'Runway' }, { name: 'Campaign' }, { name: 'Avant-garde' }, { name: 'Fine Art' }] },
          { name: 'Street Style', children: [{ name: 'Candid' }, { name: 'Urban' }, { name: 'Cultural' }, { name: 'Music' }, { name: 'Youth' }, { name: 'Subculture' }] },
          { name: 'Lookbook', children: [{ name: 'Ready-to-Wear' }, { name: 'Accessories' }, { name: 'Seasonal' }, { name: 'Campaign' }, { name: 'E-commerce' }, { name: 'Lifestyle' }] },
          { name: 'Campaign', children: [{ name: 'Brand' }, { name: 'Product' }, { name: 'Seasonal' }, { name: 'Concept' }, { name: 'Celebrity' }, { name: 'Social Media' }] },
          { name: 'Editorial Fashion', children: [{ name: 'Magazine' }, { name: 'Story-driven' }, { name: 'Conceptual' }, { name: 'Narrative' }, { name: 'Artistic' }, { name: 'Cultural' }] },
          { name: 'Accessories', children: [{ name: 'Shoes' }, { name: 'Bags' }, { name: 'Jewelry' }, { name: 'Watches' }, { name: 'Hats' }, { name: 'Sunglasses' }] },
        ],
      },
      {
        name: 'Architectural Photography',
        children: [
          { name: 'Exterior', children: [{ name: 'Buildings' }, { name: 'Facades' }, { name: 'Urban' }, { name: 'Landscape' }, { name: 'Detail' }, { name: 'Night' }] },
          { name: 'Interior', children: [{ name: 'Residential' }, { name: 'Commercial' }, { name: 'Hospitality' }, { name: 'Cultural' }, { name: 'Religious' }, { name: 'Empty' }] },
          { name: 'Urban', children: [{ name: 'Cityscape' }, { name: 'Street' }, { name: 'Geometry' }, { name: 'Abstract' }, { name: 'People' }, { name: 'Night' }] },
          { name: 'Industrial', children: [{ name: 'Factories' }, { name: 'Infrastructure' }, { name: 'Energy' }, { name: 'Agriculture' }, { name: 'Mining' }, { name: 'Transport' }] },
          { name: 'Heritage', children: [{ name: 'Historic Buildings' }, { name: 'Ruins' }, { name: 'Details' }, { name: 'Vernacular' }, { name: 'Sacred' }, { name: 'Documentation' }] },
          { name: 'Detail', children: [{ name: 'Material' }, { name: 'Texture' }, { name: 'Shadow' }, { name: 'Structure' }, { name: 'Ornament' }, { name: 'Abstract' }] },
        ],
      },
      {
        name: 'Product Photography',
        children: [
          { name: 'Commercial', children: [{ name: 'Advertising' }, { name: 'Campaign' }, { name: 'Lifestyle' }, { name: 'Still Life' }, { name: 'Technical' }, { name: 'Concept' }] },
          { name: 'E-commerce', children: [{ name: 'White Background' }, { name: 'Ghost Mannequin' }, { name: 'Flat Lay' }, { name: 'Detail' }, { name: '360°' }, { name: 'Video' }] },
          { name: 'Food & Beverage', children: [{ name: 'Restaurant' }, { name: 'Packaged' }, { name: 'Ingredients' }, { name: 'Process' }, { name: 'Concept' }, { name: 'Social Media' }] },
          { name: 'Jewelry', children: [{ name: 'Fine Jewelry' }, { name: 'Fashion' }, { name: 'Detail' }, { name: 'Campaign' }, { name: 'Lifestyle' }, { name: 'E-commerce' }] },
          { name: 'Cosmetics', children: [{ name: 'Packaging' }, { name: 'Lifestyle' }, { name: 'Beauty Editorial' }, { name: 'Campaign' }, { name: 'Social Media' }, { name: 'Detail' }] },
          { name: 'Automotive', children: [{ name: 'Studio' }, { name: 'Outdoor' }, { name: 'Detail' }, { name: 'Interior' }, { name: 'Motion Blur' }, { name: 'Concept' }] },
        ],
      },
      {
        name: 'Portrait',
        children: [
          { name: 'Studio', children: [{ name: 'White' }, { name: 'Black' }, { name: 'Coloured' }, { name: 'Environmental' }, { name: 'High Fashion' }, { name: 'Fine Art' }] },
          { name: 'Environmental', children: [{ name: 'Workplace' }, { name: 'Home' }, { name: 'Outdoor' }, { name: 'Urban' }, { name: 'Industrial' }, { name: 'Rural' }] },
          { name: 'Corporate', children: [{ name: 'Headshot' }, { name: 'LinkedIn' }, { name: 'Team' }, { name: 'Event' }, { name: 'Lifestyle' }, { name: 'Brand' }] },
          { name: 'Family', children: [{ name: 'Newborn' }, { name: 'Children' }, { name: 'Maternity' }, { name: 'Generations' }, { name: 'Pets' }, { name: 'Lifestyle' }] },
          { name: 'Fine Art Portrait', children: [{ name: 'Conceptual' }, { name: 'Series' }, { name: 'Self-portrait' }, { name: 'Documentary' }, { name: 'Nude' }, { name: 'Staged' }] },
          { name: 'Street Portrait', children: [{ name: 'Candid' }, { name: 'Staged' }, { name: 'Cultural' }, { name: 'Urban' }, { name: 'Environmental' }, { name: 'Travel' }] },
        ],
      },
      {
        name: 'Documentary',
        children: [
          { name: 'Social Documentary', children: [{ name: 'Community' }, { name: 'Identity' }, { name: 'Migration' }, { name: 'Gender' }, { name: 'Class' }, { name: 'Environment' }] },
          { name: 'War Photography', children: [{ name: 'Conflict' }, { name: 'Aftermath' }, { name: 'Humanitarian' }, { name: 'Soldiers' }, { name: 'Civilians' }, { name: 'Displacement' }] },
          { name: 'Travel', children: [{ name: 'Culture' }, { name: 'Landscape' }, { name: 'People' }, { name: 'Food' }, { name: 'Architecture' }, { name: 'Wildlife' }] },
          { name: 'Nature', children: [{ name: 'Wildlife' }, { name: 'Landscape' }, { name: 'Macro' }, { name: 'Underwater' }, { name: 'Aerial' }, { name: 'Environmental' }] },
          { name: 'Street Photography', children: [{ name: 'Urban Life' }, { name: 'Candid' }, { name: 'Abstract' }, { name: 'Night' }, { name: 'Architecture' }, { name: 'People' }] },
          { name: 'Cultural', children: [{ name: 'Traditions' }, { name: 'Religion' }, { name: 'Music' }, { name: 'Food' }, { name: 'Festivals' }, { name: 'Subcultures' }] },
        ],
      },
    ],
  },
  {
    name: 'Motion',
    count: '198k works',
    children: [
      {
        name: 'Motion Design',
        children: [
          { name: 'Title Sequences', children: [{ name: 'Film' }, { name: 'TV Series' }, { name: 'Podcast' }, { name: 'Event' }, { name: 'Brand' }, { name: 'Award Show' }] },
          { name: 'UI Animation', children: [{ name: 'App' }, { name: 'Web' }, { name: 'Micro-interactions' }, { name: 'Onboarding' }, { name: 'Loading' }, { name: 'Navigation' }] },
          { name: 'Explainer Videos', children: [{ name: '2D' }, { name: '3D' }, { name: 'Mixed' }, { name: 'Whiteboard' }, { name: 'Infographic' }, { name: 'Product' }] },
          { name: 'Social Content', children: [{ name: 'Reels' }, { name: 'Stories' }, { name: 'TikTok' }, { name: 'YouTube Shorts' }, { name: 'Ads' }, { name: 'Branded' }] },
          { name: 'Brand Animation', children: [{ name: 'Logo' }, { name: 'Brand Identity' }, { name: 'Product' }, { name: 'Campaign' }, { name: 'Storytelling' }, { name: 'Manifesto' }] },
          { name: 'Infographic Animation', children: [{ name: 'Data' }, { name: 'Statistics' }, { name: 'Process' }, { name: 'Timeline' }, { name: 'Map' }, { name: 'Comparison' }] },
        ],
      },
      {
        name: 'Animation',
        children: [
          { name: '2D Animation', children: [{ name: 'Frame-by-frame' }, { name: 'Puppet' }, { name: 'Vector' }, { name: 'Rotoscope' }, { name: 'Cut-out' }, { name: 'Hybrid' }] },
          { name: 'Stop Motion', children: [{ name: 'Claymation' }, { name: 'Object Animation' }, { name: 'Pixilation' }, { name: 'Paper' }, { name: 'Food' }, { name: 'Toy' }] },
          { name: 'Frame-by-Frame', children: [{ name: 'Hand-drawn' }, { name: 'Digital' }, { name: 'Ink' }, { name: 'Watercolor' }, { name: 'Charcoal' }, { name: 'Mixed' }] },
          { name: 'Cut-out Animation', children: [{ name: 'Paper' }, { name: 'Digital' }, { name: 'Silhouette' }, { name: 'Multi-plane' }, { name: 'Abstract' }, { name: 'Character' }] },
          { name: 'Cel Animation', children: [{ name: 'Traditional' }, { name: 'Digital Cel' }, { name: 'Hand-painted' }, { name: 'Archive' }, { name: 'Restoration' }, { name: 'Contemporary' }] },
          { name: 'Mixed Media', children: [{ name: '2D+3D' }, { name: 'Live Action+Anim' }, { name: 'Stop Motion+Digital' }, { name: 'Paint on Glass' }, { name: 'Sand' }, { name: 'Direct on Film' }] },
        ],
      },
      {
        name: '3D Animation',
        children: [
          { name: 'Character Animation', children: [{ name: 'Feature Film' }, { name: 'Game' }, { name: 'VFX' }, { name: 'Commercial' }, { name: 'Short' }, { name: 'NFT' }] },
          { name: 'Product Animation', children: [{ name: 'Commercial' }, { name: 'E-commerce' }, { name: 'Launch' }, { name: 'Technical' }, { name: 'Lifestyle' }, { name: 'Configurator' }] },
          { name: 'Architectural Visualization', children: [{ name: 'Exterior' }, { name: 'Interior' }, { name: 'Walkthrough' }, { name: 'Aerial' }, { name: 'Detail' }, { name: 'Concept' }] },
          { name: 'VFX Animation', children: [{ name: 'Destruction' }, { name: 'Creatures' }, { name: 'Environments' }, { name: 'Abstract' }, { name: 'Simulations' }, { name: 'Title FX' }] },
          { name: 'Game Animation', children: [{ name: 'Character' }, { name: 'Environment' }, { name: 'UI' }, { name: 'Cutscene' }, { name: 'Procedural' }, { name: 'Realtime' }] },
          { name: 'Abstract 3D', children: [{ name: 'Generative' }, { name: 'Sculptural' }, { name: 'Fluid' }, { name: 'Data' }, { name: 'Geometric' }, { name: 'Conceptual' }] },
        ],
      },
      {
        name: 'Kinetic Typography',
        children: [
          { name: 'Lyric Videos', children: [{ name: 'Music' }, { name: 'Narrative' }, { name: 'Animated' }, { name: 'Conceptual' }, { name: 'Official' }, { name: 'Fan-made' }] },
          { name: 'Titles & Credits', children: [{ name: 'Film' }, { name: 'TV' }, { name: 'Podcast' }, { name: 'Event' }, { name: 'Brand' }, { name: 'Web Series' }] },
          { name: 'Advertising', children: [{ name: 'TV' }, { name: 'Social' }, { name: 'OOH' }, { name: 'Digital' }, { name: 'Brand' }, { name: 'Product' }] },
          { name: 'Educational', children: [{ name: 'Explainer' }, { name: 'Tutorial' }, { name: 'Data' }, { name: 'Science' }, { name: 'Language' }, { name: 'History' }] },
          { name: 'Experimental', children: [{ name: 'Abstract' }, { name: 'Glitch' }, { name: 'Generative' }, { name: 'Interactive' }, { name: 'Art' }, { name: 'Research' }] },
          { name: 'Social Media', children: [{ name: 'Reels' }, { name: 'Stories' }, { name: 'TikTok' }, { name: 'YouTube' }, { name: 'Quote Cards' }, { name: 'Memes' }] },
        ],
      },
      {
        name: 'VFX',
        children: [
          { name: 'Compositing', children: [{ name: 'Live Action' }, { name: 'CGI Integration' }, { name: 'Multi-layer' }, { name: 'Environment' }, { name: 'Invisible FX' }, { name: 'Matte Painting' }] },
          { name: 'CGI Integration', children: [{ name: 'Product' }, { name: 'Creature' }, { name: 'Environment' }, { name: 'Vehicle' }, { name: 'Architecture' }, { name: 'Human' }] },
          { name: 'Particle Systems', children: [{ name: 'Fire' }, { name: 'Smoke' }, { name: 'Explosions' }, { name: 'Magic' }, { name: 'Dust' }, { name: 'Cloth' }] },
          { name: 'Fluid Simulation', children: [{ name: 'Water' }, { name: 'Fire' }, { name: 'Smoke' }, { name: 'Blood' }, { name: 'Abstract' }, { name: 'Atmospheric' }] },
          { name: 'Motion Capture', children: [{ name: 'Character' }, { name: 'Facial' }, { name: 'Hand' }, { name: 'Realtime' }, { name: 'Sports' }, { name: 'Performance' }] },
          { name: 'Color Grading', children: [{ name: 'Film Look' }, { name: 'Commercial' }, { name: 'TV' }, { name: 'Music Video' }, { name: 'Social' }, { name: 'HDR' }] },
        ],
      },
    ],
  },
]

// ─── Advanced Filters ────────────────────────────────────────────────────────

type AdvancedFilter =
  | { key: string; label: string; type: 'color'; options: { name: string; hex: string }[] }
  | { key: string; label: string; type: 'chips'; options: string[] }

const ADVANCED_FILTERS: AdvancedFilter[] = [
  {
    key: 'color',
    label: 'Color',
    type: 'color',
    options: [
      { name: 'Black',   hex: '#101010' },
      { name: 'White',   hex: '#F5F5F5' },
      { name: 'Red',     hex: '#EF4444' },
      { name: 'Orange',  hex: '#F97316' },
      { name: 'Yellow',  hex: '#EAB308' },
      { name: 'Green',   hex: '#22C55E' },
      { name: 'Blue',    hex: '#3B82F6' },
      { name: 'Violet',  hex: '#8B5CF6' },
      { name: 'Pink',    hex: '#EC4899' },
      { name: 'Brown',   hex: '#92400E' },
      { name: 'Gray',    hex: '#9CA3AF' },
      { name: 'Beige',   hex: '#D4B896' },
    ],
  },
  {
    key: 'visualLanguage',
    label: 'Visual language',
    type: 'chips',
    options: ['Minimalist', 'Maximalist', 'Classic', 'Contemporary', 'Vintage', 'Abstract', 'Geometric', 'Organic', 'Bold', 'Expressive'],
  },
  {
    key: 'format',
    label: 'Format',
    type: 'chips',
    options: ['Portrait', 'Landscape', 'Square', 'Panoramic', 'Print', 'Digital', 'Social', 'Poster', 'Book'],
  },
  {
    key: 'composition',
    label: 'Composition',
    type: 'chips',
    options: ['Rule of Thirds', 'Centered', 'Symmetrical', 'Asymmetrical', 'Diagonal', 'Grid', 'Negative Space', 'Full Bleed'],
  },
  {
    key: 'typography',
    label: 'Typography',
    type: 'chips',
    options: ['Serif', 'Sans-serif', 'Display', 'Script', 'Monospace', 'Hand-lettering', 'Mixed', 'All-caps'],
  },
]

// ─────────────────────────────────────────────────────────────────────────────

function getNodeByPath(tree: TreeNode[], path: string[]): TreeNode | null {
  if (path.length === 0) return null
  const node = tree.find((n) => n.name === path[0])
  if (!node) return null
  if (path.length === 1) return node
  return getNodeByPath(node.children ?? [], path.slice(1))
}

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedDiscipline: string | null
  onSelectDiscipline: (d: string | null) => void
  onAdvanced: () => void
}

export default function FilterDrawer({
  isOpen,
  onClose,
  selectedDiscipline,
  onSelectDiscipline,
  onAdvanced,
}: FilterDrawerProps) {
  const [navPath, setNavPath] = useState<string[]>([])
  const [selections, setSelections] = useState<string[]>([])
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [advancedSelections, setAdvancedSelections] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (isOpen) {
      setNavPath([])
      setSelections(selectedDiscipline ? [selectedDiscipline] : [])
      setAdvancedOpen(false)
      setOpenAccordion(null)
      setAdvancedSelections({})
    }
  }, [isOpen, selectedDiscipline])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const currentNode = navPath.length > 0 ? getNodeByPath(CATEGORY_TREE, navPath) : null
  const currentItems: TreeNode[] =
    navPath.length === 0 ? CATEGORY_TREE : (currentNode?.children ?? [])

  const rootNode = navPath.length > 0 ? getNodeByPath(CATEGORY_TREE, [navPath[0]]) : null
  const pathItems = navPath.slice(1)

  const goBack = (i: number) => {
    setNavPath(navPath.slice(0, i))
    setSelections([])
  }

  const goToLevel = (i: number) => {
    setNavPath(navPath.slice(0, i + 1))
    setSelections([])
  }

  const handleCardClick = (item: TreeNode) => {
    const hasChildren = (item.children?.length ?? 0) > 0
    if (hasChildren) {
      setNavPath([...navPath, item.name])
      setSelections([])
    } else {
      setSelections((prev) =>
        prev.includes(item.name)
          ? prev.filter((s) => s !== item.name)
          : [...prev, item.name]
      )
    }
  }

  const handleReset = () => {
    setNavPath([])
    setSelections([])
  }

  const handleFilter = () => {
    const filterValue =
      selections.length > 0
        ? selections[0]
        : navPath.length > 0
        ? navPath[navPath.length - 1]
        : null
    onSelectDiscipline(filterValue)
    onClose()
  }

  const removeSelection = (name: string) => {
    setSelections((prev) => prev.filter((s) => s !== name))
  }

  const hasActiveFilter = navPath.length > 0 || selections.length > 0

  const navChips = navPath.map((name, i) => ({ name, type: 'nav' as const, idx: i }))
  const selChips = selections.map((name) => ({ name, type: 'sel' as const, idx: -1 }))
  const allChips = [...navChips, ...selChips]

  const toggleAccordion = (key: string) =>
    setOpenAccordion((prev) => (prev === key ? null : key))

  const toggleAdvancedOption = (key: string, value: string) => {
    setAdvancedSelections((prev) => {
      const current = prev[key] ?? []
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      }
    })
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Two-panel drawer: expands right when Advanced is open */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
        className="fixed right-0 top-0 h-full z-50 bg-white flex flex-row shadow-2xl overflow-hidden"
        style={{
          width: advancedOpen ? 'min(820px, 100vw)' : 'min(420px, 100vw)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out, width 0.3s ease-out',
        }}
      >
        {/* ── LEFT PANEL: category filter ───────────────────────────────── */}
        <div className="w-[420px] flex-shrink-0 flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 flex-shrink-0">
            <button onClick={onClose} aria-label="Close filters"
              className="text-neutral-500 hover:text-[#101010] transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <span id="filter-drawer-title" className="text-sm font-bold text-[#101010]">Filters</span>
            <button onClick={handleReset} disabled={!hasActiveFilter}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                hasActiveFilter ? 'text-[#101010] hover:text-neutral-500' : 'text-neutral-300 cursor-default'
              }`}>
              Reset
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col overflow-hidden px-5 py-5">

            {/* Chips */}
            {allChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
                {allChips.map((chip) => (
                  <button
                    key={`${chip.type}-${chip.name}`}
                    onClick={() => chip.type === 'nav' ? goBack(chip.idx) : removeSelection(chip.name)}
                    className="flex items-center gap-1 bg-[#101010] text-white text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-neutral-700 transition-colors"
                  >
                    <span>{chip.name}</span>
                    <X className="w-2.5 h-2.5 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Title — root only */}
            {navPath.length === 0 && (
              <h2 className="text-xl font-bold text-[#101010] mb-4 flex-shrink-0">
                What are you looking for?
              </h2>
            )}

            {/* ROOT grid: 160px rows */}
            {navPath.length === 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="grid grid-cols-2 gap-2 pb-2" style={{ gridAutoRows: '160px' }}>
                  {currentItems.map((item) => (
                    <button type="button" key={item.name}
                      onClick={() => handleCardClick(item)}
                      className="relative rounded-2xl overflow-hidden cursor-pointer text-left transition-colors bg-neutral-100 hover:bg-neutral-200">
                      <div className="absolute bottom-0 left-0 right-0 p-3.5">
                        <p className="font-semibold text-sm leading-snug text-[#101010]">{item.name}</p>
                        {item.count && <p className="text-xs mt-0.5 text-neutral-500">{item.count}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* DEEP grid: 76px rows, featured (row-span-2) = 160px = same as root */
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="grid grid-cols-2 gap-2 pb-2" style={{ gridAutoRows: '76px' }}>

                  {/* Root featured — col1, row-span-2 → 160px */}
                  {rootNode && (
                    <button key="root-featured" type="button"
                      onClick={() => goToLevel(0)}
                      style={{ gridColumn: 1, gridRow: '1 / span 2' }}
                      className="relative rounded-2xl overflow-hidden cursor-pointer bg-[#101010] text-left">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-semibold text-sm leading-snug text-white">{navPath[0]}</p>
                        {rootNode.count && <p className="text-xs mt-0.5 text-white/50">{rootNode.count}</p>}
                      </div>
                    </button>
                  )}

                  {/* Path items — col2, one per row */}
                  {pathItems.map((name, i) => {
                    const node = getNodeByPath(CATEGORY_TREE, navPath.slice(0, i + 2))
                    return (
                      <button key={`path-${name}`} type="button"
                        onClick={() => goToLevel(i + 1)}
                        style={{ gridColumn: 2, gridRow: i + 1 }}
                        className="relative rounded-2xl overflow-hidden cursor-pointer bg-[#101010] text-left">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="font-semibold text-sm leading-snug text-white">{name}</p>
                          {node?.count && <p className="text-xs mt-0.5 text-white/50">{node.count}</p>}
                        </div>
                      </button>
                    )
                  })}

                  {/* Current items — auto-placed */}
                  {currentItems.map((item) => {
                    const isSelected = selections.includes(item.name)
                    const hasChildren = (item.children?.length ?? 0) > 0
                    return (
                      <button type="button" key={item.name}
                        onClick={() => handleCardClick(item)}
                        className={`relative rounded-2xl overflow-hidden cursor-pointer text-left transition-colors w-full h-full ${
                          isSelected ? 'bg-[#101010]' : 'bg-neutral-100 hover:bg-neutral-200'
                        }`}>
                        {hasChildren && (
                          <ChevronRight className={`absolute top-2.5 right-2.5 w-3.5 h-3.5 ${
                            isSelected ? 'text-white/40' : 'text-neutral-400'
                          }`} />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className={`font-semibold text-sm leading-snug ${
                            isSelected ? 'text-white' : 'text-[#101010]'
                          }`}>{item.name}</p>
                          {item.count && (
                            <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/50' : 'text-neutral-500'}`}>
                              {item.count}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-100 px-6 py-5 flex-shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleFilter}
                className="border border-neutral-300 rounded-xl py-3 text-sm font-semibold cursor-pointer hover:border-[#101010] transition-colors">
                Filter
              </button>
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                className={`rounded-xl py-3 text-sm font-semibold cursor-pointer transition-colors ${
                  advancedOpen
                    ? 'bg-neutral-100 text-[#101010] hover:bg-neutral-200'
                    : 'bg-[#101010] text-white hover:bg-neutral-800'
                }`}
              >
                Advanced
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: advanced filters ─────────────────────────────── */}
        <div
          className="flex flex-col h-full border-l border-neutral-100 bg-white overflow-hidden"
          style={{
            width: advancedOpen ? '400px' : '0px',
            opacity: advancedOpen ? 1 : 0,
            transition: 'width 0.3s ease-out, opacity 0.2s ease-out',
          }}
        >
          {/* Panel header */}
          <div className="flex items-center px-6 py-5 border-b border-neutral-100 flex-shrink-0 min-w-[400px]">
            <h2 className="text-sm font-bold text-[#101010]">Advanced Filters</h2>
          </div>

          {/* Accordion list */}
          <div className="flex-1 overflow-y-auto min-w-[400px]">
            {ADVANCED_FILTERS.map((filter) => {
              const isAccordionOpen = openAccordion === filter.key
              const selected = advancedSelections[filter.key] ?? []

              return (
                <div key={filter.key} className="border-b border-neutral-100">
                  {/* Accordion header */}
                  <button
                    onClick={() => toggleAccordion(filter.key)}
                    className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors text-left"
                  >
                    <span className={`text-sm transition-colors ${selected.length > 0 ? 'font-semibold text-[#101010]' : 'font-medium text-[#101010]'}`}>
                      {filter.label}
                      {selected.length > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-[#101010] text-white text-[10px] font-bold rounded-full">
                          {selected.length}
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                        isAccordionOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Accordion content */}
                  <div
                    className="overflow-hidden transition-all duration-200"
                    style={{ maxHeight: isAccordionOpen ? '200px' : '0px' }}
                  >
                    <div className="px-6 pb-5 pt-1">
                      {filter.type === 'color' ? (
                        <div className="grid grid-cols-6 gap-2.5">
                          {filter.options.map((color) => (
                            <button
                              key={color.name}
                              onClick={() => toggleAdvancedOption(filter.key, color.name)}
                              title={color.name}
                              className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                                selected.includes(color.name)
                                  ? 'border-[#101010] scale-110 shadow-sm'
                                  : 'border-neutral-200 hover:border-neutral-400'
                              } ${color.name === 'White' ? 'border-neutral-200' : ''}`}
                              style={{ backgroundColor: color.hex }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {filter.options.map((option) => (
                            <button
                              key={option}
                              onClick={() => toggleAdvancedOption(filter.key, option)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                selected.includes(option)
                                  ? 'bg-[#101010] text-white border-[#101010]'
                                  : 'bg-white text-[#101010] border-neutral-200 hover:border-neutral-400'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
