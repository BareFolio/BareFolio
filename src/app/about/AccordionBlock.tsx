'use client';

import { useState } from 'react';

const B = 'var(--font-sans), -apple-system, sans-serif';
const D = 'var(--font-display), -apple-system, sans-serif';

type Item = { title: string; body: string };

function AccordionItem({ title, body }: Item) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: '1px solid #e7e7e7',
        cursor: 'pointer',
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', gap: '12px',
      }}>
        <span style={{ fontFamily: B, fontSize: '13px', fontWeight: 600, color: '#101010', lineHeight: 1.3 }}>
          {title}
        </span>
        <span style={{
          fontSize: '18px', color: '#a3a3a3', lineHeight: 1,
          flexShrink: 0, transition: 'transform 0.2s',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>+</span>
      </div>
      <div style={{
        maxHeight: open ? '200px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <p style={{
          fontFamily: B, fontSize: '13px', color: '#737373',
          lineHeight: 1.7, margin: 0, padding: '0 20px 18px',
        }}>
          {body}
        </p>
      </div>
    </div>
  );
}

export function PrinciplesBlock() {
  const items: Item[] = [
    {
      title: 'No engagement algorithm',
      body: "Visibility is earned by what you've made, not by how often you post or how many followers you have. The feed doesn't decide what gets seen — quality does.",
    },
    {
      title: 'Process is first-class content',
      body: 'Sketches, iterations, decisions, discards — every step of your creative process has a place here. The journey matters as much as the final deliverable.',
    },
    {
      title: 'Quality as the only criterion',
      body: 'Access to BareFolio is curated by a human team. Not by your follower count, your background, or your years of experience. The work is what speaks.',
    },
    {
      title: 'AI as silent infrastructure',
      body: "AI makes your work more findable and helps brands discover the right talent — but it doesn't curate what's valuable. That judgment stays human.",
    },
    {
      title: 'The creator as author, not producer',
      body: 'BareFolio is designed around creative authorship — not content output. You control how your work is presented, in full context, without platform-imposed formats.',
    },
  ];

  return (
    <div>
      <p style={{ fontFamily: B, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#a3a3a3', margin: '0 0 16px', paddingLeft: '20px' }}>
        PRINCIPLES
      </p>
      <div style={{ border: '1px solid #e7e7e7', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
        {items.map(item => <AccordionItem key={item.title} {...item} />)}
      </div>
    </div>
  );
}

export function FeaturesBlock() {
  const items: Item[] = [
    {
      title: 'Portfolio',
      body: 'Your work, presented as authored work. Publish projects with full context — concept, process, and result — without being forced into a grid or a social feed format.',
    },
    {
      title: 'Process documentation',
      body: 'Share your creative process in real time or after the fact. Sketches, mood references, work-in-progress, and final output all live in the same project.',
    },
    {
      title: 'Curated inspiration',
      body: 'A visual library built around quality, not engagement. Save and organise references without algorithmic interference or trending noise.',
    },
    {
      title: 'Professional discovery',
      body: 'Brands, studios, and recruiters can search for creative talent by discipline, style, and process — not by follower count or platform popularity.',
    },
    {
      title: 'Creative network',
      body: 'Connect with other creatives based on shared practice and mutual respect — not social media mechanics. Peer connection built around the work.',
    },
  ];

  return (
    <div>
      <p style={{ fontFamily: B, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#a3a3a3', margin: '0 0 16px', paddingLeft: '20px' }}>
        WHAT'S INSIDE
      </p>
      <div style={{ border: '1px solid #e7e7e7', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
        {items.map(item => <AccordionItem key={item.title} {...item} />)}
      </div>
    </div>
  );
}
