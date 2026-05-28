'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'

interface TreeNode {
  name: string
  count?: string
  children?: TreeNode[]
}

// Tree matching the reference flow exactly
const CATEGORY_TREE: TreeNode[] = [
  {
    name: 'Design',
    count: '450k works',
    children: [
      {
        name: 'Graphic',
        count: '1.2k works',
        children: [
          { name: 'Editorial' },
          { name: 'UX/UI' },
          { name: 'Interior' },
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
          { name: 'Motion' },
          { name: 'Digital' },
          { name: 'Identity' },
        ],
      },
      { name: 'Product', count: '3k works' },
      { name: 'Interior', count: '906 works' },
      { name: 'Fashion', count: '2.3k works' },
      { name: 'Editorial', count: '256 works' },
      { name: 'Industrial', count: '256 works' },
      { name: 'Video Games', count: '547 works' },
      { name: '3D', count: '547 works' },
      { name: 'Experimental', count: '547 works' },
      { name: 'Illustration', count: '547 works' },
    ],
  },
  {
    name: 'Visual Arts',
    count: '234k works',
    children: [
      { name: 'Illustration' },
      { name: 'Painting' },
      { name: 'Sculpture' },
      { name: 'Pattern-making' },
      { name: 'Mixed Media' },
      { name: 'Printmaking' },
    ],
  },
  {
    name: 'Audiovisuals',
    count: '657k works',
    children: [
      { name: 'FilmMaker' },
      { name: 'VFX' },
      { name: 'Video Editing' },
      { name: 'Podcast' },
      { name: 'Sound Design' },
    ],
  },
  {
    name: 'Architecture',
    count: '450k works',
    children: [
      { name: 'Residential' },
      { name: 'Commercial' },
      { name: 'Landscape' },
      { name: 'Urban Planning' },
      { name: 'Interior Design' },
    ],
  },
  {
    name: 'Photography',
    count: '312k works',
    children: [
      { name: 'Editorial' },
      { name: 'Fashion Photography' },
      { name: 'Architectural Photography' },
      { name: 'Product Photography' },
      { name: 'Portrait' },
      { name: 'Documentary' },
    ],
  },
  {
    name: 'Motion',
    count: '198k works',
    children: [
      { name: 'Motion Design' },
      { name: 'Animation' },
      { name: '3D Animation' },
      { name: 'Kinetic Typography' },
      { name: 'VFX' },
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

  // Current level items
  const currentNode = navPath.length > 0 ? getNodeByPath(CATEGORY_TREE, navPath) : null
  const currentItems: TreeNode[] =
    navPath.length === 0 ? CATEGORY_TREE : (currentNode?.children ?? [])

  // Root featured node (always navPath[0])
  const rootNode = navPath.length > 0 ? getNodeByPath(CATEGORY_TREE, [navPath[0]]) : null

  // Navigate to position i in navPath (going back)
  const goBack = (i: number) => {
    setNavPath(navPath.slice(0, i))
    setSelections([])
  }

  const handleCardClick = (item: TreeNode) => {
    const hasChildren = (item.children?.length ?? 0) > 0
    if (hasChildren) {
      setNavPath([...navPath, item.name])
      setSelections([])
    } else {
      // Multi-select toggle at leaf level
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

  const hasActiveFilter = navPath.length > 0 || selections.length > 0

  // Non-root path items (for chips + explicit grid placement)
  const pathItems = navPath.slice(1) // ["Graphic"] or ["Graphic", "Branding"]

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

          {/* Breadcrumb chips (level 3+: non-root path items) */}
          {pathItems.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 mb-2 flex-shrink-0">
              {pathItems.map((name, i) => (
                <button
                  key={name}
                  onClick={() => goBack(i + 1)} // go back to before this item
                  className="flex items-center gap-1 bg-[#101010] text-white text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-neutral-700 transition-colors"
                >
                  <span>{name}</span>
                  <X className="w-2.5 h-2.5 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Path text (level 3+) or title */}
          {navPath.length >= 2 ? (
            <p className="text-xs text-neutral-400 mb-4 flex-shrink-0">
              {navPath.map((seg, i) => (
                <span key={seg}>
                  {i > 0 && <span className="mx-1">›</span>}
                  <span className={i === navPath.length - 1 ? 'text-[#101010] font-semibold' : ''}>
                    {seg}
                  </span>
                </span>
              ))}
            </p>
          ) : (
            <h2 className="text-xl font-bold text-[#101010] mb-4 flex-shrink-0">
              {navPath.length === 0 ? 'What are you looking for?' : navPath[0]}
            </h2>
          )}

          {/* ── Grid ── */}
          <div
            className="flex-1 grid grid-cols-2 gap-2 min-h-0"
            style={{ gridAutoRows: '1fr' }}
          >
            {/* ROOT featured card — col 1, always row-span-2 */}
            {rootNode && (
              <button
                key="root"
                type="button"
                onClick={() => goBack(0)}
                style={{ gridColumn: 1, gridRow: '1 / span 2' }}
                className="relative rounded-2xl overflow-hidden cursor-pointer bg-[#101010] text-left"
              >
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <p className="font-semibold text-sm leading-snug text-white">{navPath[0]}</p>
                  {rootNode.count && (
                    <p className="text-xs mt-0.5 text-white/50">{rootNode.count}</p>
                  )}
                </div>
              </button>
            )}

            {/* PATH items (navPath[1..]) — col 2, one row each, stacked */}
            {pathItems.map((name, i) => {
              const node = getNodeByPath(CATEGORY_TREE, navPath.slice(0, i + 2))
              return (
                <button
                  key={`path-${name}`}
                  type="button"
                  onClick={() => goBack(i + 1)}
                  style={{ gridColumn: 2, gridRow: i + 1 }}
                  className="relative rounded-2xl overflow-hidden cursor-pointer bg-[#101010] text-left"
                >
                  <div className="absolute bottom-0 left-0 right-0 p-3.5">
                    <p className="font-semibold text-sm leading-snug text-white">{name}</p>
                    {node?.count && (
                      <p className="text-xs mt-0.5 text-white/50">{node.count}</p>
                    )}
                  </div>
                </button>
              )
            })}

            {/* CURRENT LEVEL items — auto-placed after explicit items */}
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
                      className={`absolute top-3 right-3 w-4 h-4 ${
                        isSelected ? 'text-white/40' : 'text-neutral-400'
                      }`}
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3.5">
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
