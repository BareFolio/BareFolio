'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { LayoutGrid, FileText } from 'lucide-react';


const OPTIONS = [
  {
    key: 'project' as const,
    label: 'Project',
    description: 'Share your work, process and case studies with the world.',
    icon: LayoutGrid,
  },
  {
    key: 'post' as const,
    label: 'Post',
    description: 'Tell more about you to the others.',
    icon: FileText,
  },
];

export default function CreatePicker({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { setNewPostOpen } = useApp();
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<'project' | 'post'>('project');

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!rendered) return null;

  const handleSelect = (key: 'project' | 'post') => {
    setActive(key);
    if (key === 'post') {
      onClose();
      // Small gap so picker exits before drawer enters
      setTimeout(() => setNewPostOpen(true), 80);
    }
    // 'project' creation flow can be added later
  };

  return (
    <>
      {/* Invisible backdrop to close on outside click */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Picker card */}
      <div
        className={`fixed top-[80px] right-4 z-50 w-[320px] bg-white rounded-2xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          visible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-[0.97]'
        }`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-base font-bold text-text-primary">
            What do you want to create?
          </p>
        </div>

        {/* Options */}
        <div className="px-3 pb-3 space-y-1.5">
          {OPTIONS.map(({ key, label, description, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#101010]'
                    : 'bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 mt-0.5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-text-primary'
                  }`}
                  style={{ width: '18px', height: '18px' }}
                />
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      isActive ? 'text-white' : 'text-text-primary'
                    }`}
                  >
                    {label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 leading-snug ${
                      isActive ? 'text-white/60' : 'text-neutral-400'
                    }`}
                  >
                    {description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </>
  );
}
