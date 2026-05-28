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
          { name: 'Branding' },
          { name: 'Logo Design' },
          { name: 'Typography' },
          { name: 'Identity Systems' },
          { name: 'Poster Design' },
          { name: 'Print' },
          { name: 'Art Direction' },
          { name: 'Packaging' },
        ],
      },
      {
        name: 'Product',
        count: '3k works',
        children: [
          { name: 'Consumer Products' },
          { name: 'Furniture' },
          { name: 'Footwear' },
          { name: 'Wearables' },
          { name: 'Toys' },
          { name: 'Accessories' },
        ],
      },
      { name: 'Interior', count: '906 works' },
      {
        name: 'Fashion',
        count: '2.3k works',
        children: [
          { name: 'Ready-to-wear' },
          { name: 'Accessories' },
          { name: 'Footwear' },
          { name: 'Textile' },
          { name: 'Couture' },
        ],
      },
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
  const [selection, setSelection] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNavPath([])
      setSelection(selectedDiscipline)
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

  const parentNode = getNodeByPath(CATEGORY_TREE, navPath)
  const currentItems: TreeNode[] =
    navPath.length === 0 ? CATEGORY_TREE : (parentNode?.children ?? [])

  const handleCardClick = (item: TreeNode) => {
    const hasChildren = (item.children?.length ?? 0) > 0
    if (hasChildren) {
      setNavPath((prev) => [...prev, item.name])
      setSelection(null)
    } else {
      setSelection((prev) => (prev === item.name ? null : item.name))
    }
  }

  const handleNavChipRemove = (index: number) => {
    setNavPath((prev) => prev.slice(0, index))
    setSelection(null)
  }

  const handleReset = () => {
    setNavPath([])
    setSelection(null)
  }

  const handleFilter = () => {
    const filterValue =
      selection ?? (navPath.length > 0 ? navPath[navPath.length - 1] : null)
    onSelectDiscipline(filterValue)
    onClose()
  }

  const handleAdvanced = () => {
    onAdvanced()
    onClose()
  }

  const breadcrumbs = [...navPath, ...(selection ? [selection] : [])]
  const hasActiveFilter = breadcrumbs.length > 0

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
              hasActiveFilter
                ? 'text-[#101010] hover:text-neutral-500'
                : 'text-neutral-300 cursor-default'
            }`}
          >
            Reset
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex flex-col overflow-hidden px-5 py-5">
          {/* Breadcrumb chips */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 mb-4 flex-shrink-0">
              {breadcrumbs.map((crumb, i) => {
                const isSelectionChip = i === navPath.length
                return (
                  <div key={i} className="flex items-center">
                    {i > 0 && (
                      <ChevronRight className="w-3 h-3 text-neutral-400 mx-0.5 flex-shrink-0" />
                    )}
                    <button
                      onClick={() => {
                        if (isSelectionChip) setSelection(null)
                        else handleNavChipRemove(i)
                      }}
                      className="flex items-center gap-1 bg-[#101010] text-white text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-neutral-700 transition-colors"
                    >
                      <span>{crumb}</span>
                      <X className="w-2.5 h-2.5 flex-shrink-0" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Section title */}
          <h2 className="text-xl font-bold text-[#101010] mb-4 flex-shrink-0">
            {navPath.length === 0
              ? 'What are you looking for?'
              : navPath[navPath.length - 1]}
          </h2>

          {/* Cards grid — featured parent (black, double height) + children */}
          <div
            className="flex-1 grid grid-cols-2 gap-2 min-h-0"
            style={{ gridAutoRows: '1fr' }}
          >
            {/* Featured parent card when drilled in */}
            {parentNode && (
              <button
                type="button"
                onClick={() => handleNavChipRemove(navPath.length - 1)}
                className="row-span-2 relative rounded-2xl overflow-hidden cursor-pointer bg-[#101010] text-left transition-all duration-150"
              >
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <p className="font-semibold text-sm leading-snug text-white">
                    {parentNode.name}
                  </p>
                  {parentNode.count && (
                    <p className="text-xs mt-0.5 text-white/50">{parentNode.count}</p>
                  )}
                </div>
              </button>
            )}

            {/* Children / current level cards */}
            {currentItems.map((item) => {
              const isSelected = item.name === selection
              const hasChildren = (item.children?.length ?? 0) > 0

              return (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => handleCardClick(item)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 w-full h-full text-left ${
                    isSelected
                      ? 'bg-[#101010]'
                      : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
                >
                  {hasChildren && (
                    <ChevronRight
                      className={`absolute top-3 right-3 w-4 h-4 transition-colors ${
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
                      <p
                        className={`text-xs mt-0.5 ${
                          isSelected ? 'text-white/50' : 'text-neutral-500'
                        }`}
                      >
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
              onClick={handleAdvanced}
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
