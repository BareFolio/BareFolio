'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'

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
          { name: 'Editorial Design' },
          { name: 'UX/UI Design' },
          {
            name: 'Branding',
            children: [
              { name: 'Logo design' },
              { name: 'Identity systems' },
              { name: 'Brand guidelines' },
              { name: 'Rebranding' },
              { name: 'Visual naming' },
              { name: 'Editorial branding' },
            ],
          },
          { name: 'Packaging' },
          { name: 'Typography' },
          { name: 'Motion Graphics' },
          { name: 'Digital Design' },
          { name: 'Print Design' },
        ],
      },
      {
        name: 'Product',
        count: '3k works',
        children: [
          { name: 'Industrial Product' },
          { name: 'Furniture' },
          { name: 'Consumer Electronics' },
          { name: 'Jewelry & Accessories' },
          { name: 'Footwear' },
          { name: 'Automotive' },
        ],
      },
      {
        name: 'Interior',
        count: '906 works',
        children: [
          { name: 'Residential' },
          { name: 'Commercial' },
          { name: 'Hospitality' },
          { name: 'Retail' },
          { name: 'Office Space' },
          { name: 'Exhibition' },
        ],
      },
      {
        name: 'Fashion',
        count: '2.3k works',
        children: [
          { name: 'Ready-to-Wear' },
          { name: 'Haute Couture' },
          { name: 'Accessories' },
          { name: 'Sportswear' },
          { name: 'Sustainable' },
          { name: 'Streetwear' },
        ],
      },
      {
        name: 'Editorial',
        count: '256 works',
        children: [
          { name: 'Magazine' },
          { name: 'Book Design' },
          { name: 'Newspaper' },
          { name: 'Annual Reports' },
          { name: 'Catalogs' },
          { name: 'Infographics' },
        ],
      },
      {
        name: 'Industrial',
        count: '256 works',
        children: [
          { name: 'Furniture' },
          { name: 'Lighting' },
          { name: 'Medical Devices' },
          { name: 'Transportation' },
          { name: 'Kitchenware' },
          { name: 'Tools' },
        ],
      },
      {
        name: 'Video Games',
        count: '547 works',
        children: [
          { name: 'Concept Art' },
          { name: 'UI/UX' },
          { name: 'Character Design' },
          { name: 'Environment' },
          { name: '3D Assets' },
          { name: 'Animation' },
        ],
      },
      {
        name: '3D',
        count: '547 works',
        children: [
          { name: 'Product Visualization' },
          { name: 'Architectural 3D' },
          { name: 'Character Modeling' },
          { name: 'Environment Design' },
          { name: 'Motion 3D' },
          { name: 'VR/AR' },
        ],
      },
      {
        name: 'Experimental',
        count: '547 works',
        children: [
          { name: 'Generative Art' },
          { name: 'Interactive' },
          { name: 'Data Visualization' },
          { name: 'Mixed Disciplines' },
          { name: 'Net Art' },
          { name: 'Bio Art' },
        ],
      },
      {
        name: 'Illustration',
        count: '547 works',
        children: [
          { name: 'Editorial' },
          { name: 'Character' },
          { name: 'Conceptual' },
          { name: 'Technical' },
          { name: "Children's Book" },
          { name: 'Scientific' },
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
          { name: 'Digital' },
          { name: 'Traditional' },
          { name: 'Editorial' },
          { name: 'Concept Art' },
          { name: "Children's Book" },
          { name: 'Scientific' },
        ],
      },
      {
        name: 'Painting',
        children: [
          { name: 'Watercolor' },
          { name: 'Oil' },
          { name: 'Acrylic' },
          { name: 'Gouache' },
          { name: 'Abstract' },
          { name: 'Portraiture' },
        ],
      },
      {
        name: 'Sculpture',
        children: [
          { name: 'Stone' },
          { name: 'Metal' },
          { name: 'Wood' },
          { name: 'Ceramic' },
          { name: 'Mixed Media' },
          { name: 'Installation' },
        ],
      },
      {
        name: 'Pattern-making',
        children: [
          { name: 'Textile' },
          { name: 'Surface Design' },
          { name: 'Repeat Patterns' },
          { name: 'Digital Patterns' },
          { name: 'Hand-drawn' },
          { name: 'Geometric' },
        ],
      },
      {
        name: 'Mixed Media',
        children: [
          { name: 'Collage' },
          { name: 'Assemblage' },
          { name: 'Photo-painting' },
          { name: 'Digital + Analog' },
          { name: 'Found Objects' },
          { name: 'Installation' },
        ],
      },
      {
        name: 'Printmaking',
        children: [
          { name: 'Screen Print' },
          { name: 'Etching' },
          { name: 'Lithography' },
          { name: 'Woodcut' },
          { name: 'Relief Print' },
          { name: 'Risograph' },
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
          { name: 'Short Film' },
          { name: 'Documentary' },
          { name: 'Music Video' },
          { name: 'Commercial' },
          { name: 'Experimental Film' },
          { name: 'Feature Film' },
        ],
      },
      {
        name: 'VFX',
        children: [
          { name: 'Compositing' },
          { name: '3D Effects' },
          { name: 'Motion Capture' },
          { name: 'Color Grading' },
          { name: 'Particle Effects' },
          { name: 'Environment FX' },
        ],
      },
      {
        name: 'Video Editing',
        children: [
          { name: 'Narrative' },
          { name: 'Documentary' },
          { name: 'Commercial' },
          { name: 'Social Media' },
          { name: 'Wedding & Events' },
          { name: 'Corporate' },
        ],
      },
      {
        name: 'Podcast',
        children: [
          { name: 'Interview' },
          { name: 'Narrative' },
          { name: 'Educational' },
          { name: 'Comedy' },
          { name: 'Technology' },
          { name: 'Culture & Arts' },
        ],
      },
      {
        name: 'Sound Design',
        children: [
          { name: 'Film & TV' },
          { name: 'Video Games' },
          { name: 'Music Production' },
          { name: 'Podcast Production' },
          { name: 'Spatial Audio' },
          { name: 'Brand Sound' },
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
          { name: 'Single Family' },
          { name: 'Multi-family' },
          { name: 'Affordable Housing' },
          { name: 'Luxury' },
          { name: 'Renovation' },
          { name: 'Passive House' },
        ],
      },
      {
        name: 'Commercial',
        children: [
          { name: 'Office Buildings' },
          { name: 'Retail' },
          { name: 'Hotels' },
          { name: 'Cultural Centers' },
          { name: 'Healthcare' },
          { name: 'Educational' },
        ],
      },
      {
        name: 'Landscape',
        children: [
          { name: 'Parks & Gardens' },
          { name: 'Urban Landscape' },
          { name: 'Ecological Design' },
          { name: 'Public Spaces' },
          { name: 'Rooftop Gardens' },
          { name: 'Masterplanning' },
        ],
      },
      {
        name: 'Urban Planning',
        children: [
          { name: 'City Planning' },
          { name: 'Neighbourhood Design' },
          { name: 'Transport Planning' },
          { name: 'Smart Cities' },
          { name: 'Waterfront' },
          { name: 'Heritage Conservation' },
        ],
      },
      {
        name: 'Interior Design',
        children: [
          { name: 'Residential Interior' },
          { name: 'Commercial Interior' },
          { name: 'Hospitality' },
          { name: 'Retail Design' },
          { name: 'Exhibition Design' },
          { name: 'Set Design' },
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
          { name: 'Magazine' },
          { name: 'Newspaper' },
          { name: 'News Photography' },
          { name: 'Feature Stories' },
          { name: 'Photo Essays' },
          { name: 'Political' },
        ],
      },
      {
        name: 'Fashion Photography',
        children: [
          { name: 'High Fashion' },
          { name: 'Street Style' },
          { name: 'Lookbook' },
          { name: 'Campaign' },
          { name: 'Editorial Fashion' },
          { name: 'Accessories' },
        ],
      },
      {
        name: 'Architectural Photography',
        children: [
          { name: 'Exterior' },
          { name: 'Interior' },
          { name: 'Urban' },
          { name: 'Industrial' },
          { name: 'Heritage' },
          { name: 'Detail' },
        ],
      },
      {
        name: 'Product Photography',
        children: [
          { name: 'Commercial' },
          { name: 'E-commerce' },
          { name: 'Food & Beverage' },
          { name: 'Jewelry' },
          { name: 'Cosmetics' },
          { name: 'Automotive' },
        ],
      },
      {
        name: 'Portrait',
        children: [
          { name: 'Studio' },
          { name: 'Environmental' },
          { name: 'Corporate' },
          { name: 'Family' },
          { name: 'Fine Art Portrait' },
          { name: 'Street Portrait' },
        ],
      },
      {
        name: 'Documentary',
        children: [
          { name: 'Social Documentary' },
          { name: 'War Photography' },
          { name: 'Travel' },
          { name: 'Nature' },
          { name: 'Street Photography' },
          { name: 'Cultural' },
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
          { name: 'Title Sequences' },
          { name: 'UI Animation' },
          { name: 'Explainer Videos' },
          { name: 'Social Content' },
          { name: 'Brand Animation' },
          { name: 'Infographic Animation' },
        ],
      },
      {
        name: 'Animation',
        children: [
          { name: '2D Animation' },
          { name: 'Stop Motion' },
          { name: 'Frame-by-Frame' },
          { name: 'Cut-out Animation' },
          { name: 'Cel Animation' },
          { name: 'Mixed Media' },
        ],
      },
      {
        name: '3D Animation',
        children: [
          { name: 'Character Animation' },
          { name: 'Product Animation' },
          { name: 'Architectural Visualization' },
          { name: 'VFX Animation' },
          { name: 'Game Animation' },
          { name: 'Abstract 3D' },
        ],
      },
      {
        name: 'Kinetic Typography',
        children: [
          { name: 'Lyric Videos' },
          { name: 'Titles & Credits' },
          { name: 'Advertising' },
          { name: 'Educational' },
          { name: 'Experimental' },
          { name: 'Social Media' },
        ],
      },
      {
        name: 'VFX',
        children: [
          { name: 'Compositing' },
          { name: 'CGI Integration' },
          { name: 'Particle Systems' },
          { name: 'Fluid Simulation' },
          { name: 'Motion Capture' },
          { name: 'Color Grading' },
        ],
      },
    ],
  },
]

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

  useEffect(() => {
    if (isOpen) {
      setNavPath([])
      setSelections(selectedDiscipline ? [selectedDiscipline] : [])
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

  // Navigate TO level i (keep navPath[0..i] inclusive)
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

  // All chips: navPath (every level) + leaf selections
  const navChips = navPath.map((name, i) => ({ name, type: 'nav' as const, idx: i }))
  const selChips = selections.map((name) => ({ name, type: 'sel' as const, idx: -1 }))
  const allChips = [...navChips, ...selChips]

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
        className={`fixed right-0 top-0 h-full z-50 bg-white w-full sm:w-[420px] flex flex-col shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 flex-shrink-0">
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="text-neutral-500 hover:text-[#101010] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <span id="filter-drawer-title" className="text-sm font-bold text-[#101010]">
            Filters
          </span>
          <button
            onClick={handleReset}
            disabled={!hasActiveFilter}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              hasActiveFilter ? 'text-[#101010] hover:text-neutral-500' : 'text-neutral-300 cursor-default'
            }`}
          >
            Reset
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex flex-col overflow-hidden px-5 py-5">

          {/* Chips — navPath levels + selections */}
          {allChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
              {allChips.map((chip) => (
                <button
                  key={`${chip.type}-${chip.name}`}
                  onClick={() =>
                    chip.type === 'nav' ? goBack(chip.idx) : removeSelection(chip.name)
                  }
                  className="flex items-center gap-1 bg-[#101010] text-white text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-neutral-700 transition-colors"
                >
                  <span>{chip.name}</span>
                  <X className="w-2.5 h-2.5 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Title — only at root */}
          {navPath.length === 0 && (
            <h2 className="text-xl font-bold text-[#101010] mb-4 flex-shrink-0">
              What are you looking for?
            </h2>
          )}

          {/* ── ROOT grid: 160px rows, scrollable if needed ── */}
          {navPath.length === 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div
                className="grid grid-cols-2 gap-2 pb-2"
                style={{ gridAutoRows: '160px' }}
              >
                {currentItems.map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => handleCardClick(item)}
                    className="relative rounded-2xl overflow-hidden cursor-pointer text-left transition-colors bg-neutral-100 hover:bg-neutral-200"
                  >
                    <div className="absolute bottom-0 left-0 right-0 p-3.5">
                      <p className="font-semibold text-sm leading-snug text-[#101010]">{item.name}</p>
                      {item.count && (
                        <p className="text-xs mt-0.5 text-neutral-500">{item.count}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── DEEP grid: fixed row heights, scrollable ── */
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div
                className="grid grid-cols-2 gap-2 pb-2"
                style={{ gridAutoRows: '76px' }}
              >
                {/* Root featured — col1, row-span-2 → same visual height as level-1 cards */}
                {rootNode && (
                  <button
                    key="root-featured"
                    type="button"
                    onClick={() => goToLevel(0)}
                    style={{ gridColumn: 1, gridRow: '1 / span 2' }}
                    className="relative rounded-2xl overflow-hidden cursor-pointer bg-[#101010] text-left"
                  >
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-semibold text-sm leading-snug text-white">{navPath[0]}</p>
                      {rootNode.count && (
                        <p className="text-xs mt-0.5 text-white/50">{rootNode.count}</p>
                      )}
                    </div>
                  </button>
                )}

                {/* Path items — col2, one per row (75px each), always black */}
                {pathItems.map((name, i) => {
                  const node = getNodeByPath(CATEGORY_TREE, navPath.slice(0, i + 2))
                  return (
                    <button
                      key={`path-${name}`}
                      type="button"
                      onClick={() => goToLevel(i + 1)}
                      style={{ gridColumn: 2, gridRow: i + 1 }}
                      className="relative rounded-2xl overflow-hidden cursor-pointer bg-[#101010] text-left"
                    >
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-semibold text-sm leading-snug text-white">{name}</p>
                        {node?.count && (
                          <p className="text-xs mt-0.5 text-white/50">{node.count}</p>
                        )}
                      </div>
                    </button>
                  )
                })}

                {/* Current level items — auto-placed */}
                {currentItems.map((item) => {
                  const isSelected = selections.includes(item.name)
                  const hasChildren = (item.children?.length ?? 0) > 0
                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => handleCardClick(item)}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer text-left transition-colors w-full h-full ${
                        isSelected ? 'bg-[#101010]' : 'bg-neutral-100 hover:bg-neutral-200'
                      }`}
                    >
                      {hasChildren && (
                        <ChevronRight
                          className={`absolute top-2.5 right-2.5 w-3.5 h-3.5 ${
                            isSelected ? 'text-white/40' : 'text-neutral-400'
                          }`}
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p
                          className={`font-semibold text-sm leading-snug ${
                            isSelected ? 'text-white' : 'text-[#101010]'
                          }`}
                        >
                          {item.name}
                        </p>
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

        {/* ── Footer ── */}
        <div className="border-t border-neutral-100 px-6 py-5 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleFilter}
              className="border border-neutral-300 rounded-xl py-3 text-sm font-semibold cursor-pointer hover:border-[#101010] transition-colors"
            >
              Filter
            </button>
            <button
              onClick={() => { onAdvanced(); onClose() }}
              className="bg-[#101010] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer hover:bg-neutral-800 transition-colors"
            >
              Advanced
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
