'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  selectedDiscipline: string | null
  onSelectDiscipline: (d: string | null) => void
  onAdvanced: () => void
}

const CATEGORIES = [
  { name: 'Design',       count: '450k works', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80' },
  { name: 'Visual Arts',  count: '234k works', img: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&q=80' },
  { name: 'Audiovisuals', count: '657k works', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80' },
  { name: 'Architecture', count: '450k works', img: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&q=80' },
  { name: 'Photography',  count: '312k works', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
  { name: 'Motion',       count: '198k works', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80' },
  { name: 'Branding',     count: '389k works', img: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=600&q=80' },
  { name: 'Packaging',    count: '276k works', img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80' },
]

export default function FilterDrawer({
  isOpen,
  onClose,
  selectedDiscipline,
  onSelectDiscipline,
  onAdvanced,
}: FilterDrawerProps) {
  const [pending, setPending] = useState<string | null>(selectedDiscipline)

  // Sync pending with selectedDiscipline when drawer opens
  useEffect(() => {
    if (isOpen) {
      setPending(selectedDiscipline)
    }
  }, [isOpen, selectedDiscipline])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleCardClick = (name: string) => {
    setPending(prev => (prev === name ? null : name))
  }

  const handleFilter = () => {
    onSelectDiscipline(pending)
    onClose()
  }

  const handleAdvanced = () => {
    onAdvanced()
    onClose()
  }

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 flex-shrink-0">
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="text-neutral-500 hover:text-[#101010] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <span id="filter-drawer-title" className="text-sm font-bold text-[#101010]">Filters</span>
          <button
            onClick={() => setPending(null)}
            className="text-sm font-medium text-neutral-500 hover:text-[#101010] transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <h2 className="text-xl font-bold text-[#101010] mb-6">What are you looking for?</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = pending === cat.name
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => handleCardClick(cat.name)}
                  className={`relative aspect-[4/3] rounded-2xl overflow-hidden group ${
                    isSelected ? 'ring-2 ring-[#101010] ring-offset-2' : ''
                  }`}
                >
                  {/* Background image */}
                  <img
                    src={cat.img}
                    alt={cat.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Bottom-left text */}
                  <div className="absolute bottom-0 left-0 p-3">
                    <p className="text-white font-bold text-sm leading-tight">{cat.name}</p>
                    <p className="text-white/60 text-xs">{cat.count}</p>
                  </div>
                  {/* Checkmark circle top-right when selected */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#101010]" strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
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
