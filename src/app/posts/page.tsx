'use client';

import { useState, useRef } from 'react';
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { useApp } from '@/lib/store';

// ── Types ─────────────────────────────────────────────────────────────────────

type PostType = 'fullsize' | 'carousel' | 'image-text' | 'text' | 'text-link';

interface PostAuthor {
  name: string;
  initials: string;
  avatarUrl?: string;
}

interface Post {
  id: string;
  type: PostType;
  author: PostAuthor;
  location: string;
  year: number;
  content: string;
  link?: string;
  images?: string[];
  tags?: string[];
  liked: boolean;
  saved: boolean;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_POSTS: Post[] = [
  {
    id: 'p1',
    type: 'fullsize',
    author: { name: 'Victor Chaves', initials: 'VC' },
    location: 'Barcelona',
    year: 2025,
    content: 'This advanced facial serum delivers intense hydration while improving skin tone texture. Powered by antioxidants and botanical extracts, it helps reduce the look of fine lines and dullness.',
    images: ['https://picsum.photos/seed/serum-dark/800/1000'],
    tags: ['Project', 'Graphic Design', 'Packaging'],
    liked: false,
    saved: false,
  },
  {
    id: 'p2',
    type: 'carousel',
    author: { name: 'Victor Chaves', initials: 'VC' },
    location: 'Barcelona',
    year: 2025,
    content: 'This advanced facial serum delivers intense hydration while improving skin tone texture. Powered by antioxidants and botanical extracts, it helps reduce the look of fine lines and dullness.',
    images: [
      'https://picsum.photos/seed/serum-a/800/700',
      'https://picsum.photos/seed/serum-b/800/700',
      'https://picsum.photos/seed/serum-c/800/700',
    ],
    tags: ['Project', 'Graphic Design', 'Packaging'],
    liked: false,
    saved: false,
  },
  {
    id: 'p3',
    type: 'image-text',
    author: { name: 'Victor Chaves', initials: 'VC' },
    location: 'Barcelona',
    year: 2025,
    content: 'This advanced facial serum delivers intense hydration while improving skin tone texture. Powered by antioxidants and botanical extracts, it helps reduce the look of fine lines and dullness.',
    images: ['https://picsum.photos/seed/serum-e/800/700'],
    liked: false,
    saved: false,
  },
  {
    id: 'p4',
    type: 'text-link',
    author: { name: 'Victor Chaves', initials: 'VC' },
    location: 'Barcelona',
    year: 2025,
    content: 'This advanced facial serum delivers intense hydration while improving skin tone texture. Powered by antioxidants and botanical extracts, it helps reduce the look of fine lines and dullness.',
    link: 'victxrchaves.com',
    liked: false,
    saved: false,
  },
  {
    id: 'p5',
    type: 'text',
    author: { name: 'Victor Chaves', initials: 'VC' },
    location: 'Barcelona',
    year: 2025,
    content: 'This advanced facial serum delivers intense hydration while improving skin tone texture. Powered by antioxidants and botanical extracts, it helps reduce the look of fine lines and dullness.',
    liked: false,
    saved: false,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ author }: { author: PostAuthor }) {
  return author.avatarUrl ? (
    <img src={author.avatarUrl} alt={author.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-600 uppercase flex-shrink-0">
      {author.initials}
    </div>
  );
}

function PostHeader({
  author,
  location,
  year,
  showMenu = true,
  overlay = false,
}: {
  author: PostAuthor;
  location: string;
  year: number;
  showMenu?: boolean;
  overlay?: boolean;
}) {
  const textColor = overlay ? 'text-white' : 'text-text-primary';
  const subColor = overlay ? 'text-white/70' : 'text-neutral-400';

  return (
    <div className={`flex items-center justify-between px-4 py-3 ${overlay ? 'absolute top-0 left-0 right-0 z-10' : ''}`}>
      <div className="flex items-center gap-2.5">
        {overlay ? (
          <div className="w-9 h-9 rounded-full bg-neutral-500 border-2 border-white/30 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0">
            {author.initials}
          </div>
        ) : (
          <Avatar author={author} />
        )}
        <span className={`text-sm font-semibold ${textColor}`}>{author.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`text-xs text-right ${subColor}`}>
          <p>{location}</p>
          <p>Created in {year}</p>
        </div>
        {showMenu && (
          <button className={`p-0.5 cursor-pointer ${subColor}`}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ActionBar({
  liked,
  saved,
  onLike,
  onSave,
  showViewMore = false,
}: {
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
  showViewMore?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-5">
        <button onClick={onLike} className="cursor-pointer">
          <Heart className={`w-5 h-5 ${liked ? 'fill-text-primary text-text-primary' : 'text-text-primary'}`} />
        </button>
        <button className="cursor-pointer">
          <MessageSquare className="w-5 h-5 text-text-primary" />
        </button>
        <button className="cursor-pointer">
          <Share2 className="w-5 h-5 text-text-primary" />
        </button>
      </div>
      <div className="flex items-center gap-2.5">
        {showViewMore && (
          <button className="border border-neutral-300 text-sm text-text-primary font-medium px-3 py-1 rounded-full cursor-pointer hover:bg-neutral-50 transition-colors">
            View More
          </button>
        )}
        <button onClick={onSave} className="cursor-pointer">
          <Bookmark className={`w-5 h-5 ${saved ? 'fill-text-primary text-text-primary' : 'text-text-primary'}`} />
        </button>
      </div>
    </div>
  );
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <p className="px-4 pb-4 text-sm text-text-primary">
      {tags.map((t, i) => (
        <span key={t}>
          {i > 0 && <span className="mx-2 text-neutral-300">|</span>}
          {t}
        </span>
      ))}
    </p>
  );
}

// ── Post card variants ────────────────────────────────────────────────────────

function FullsizePost({ post, onLike, onSave }: { post: Post; onLike: () => void; onSave: () => void }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
      {/* Image with overlaid header */}
      <div className="relative">
        {/* Dark gradient for header legibility */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-[1]" />
        <PostHeader author={post.author} location={post.location} year={post.year} overlay />
        <img
          src={post.images![0]}
          alt=""
          className="w-full object-cover block"
          style={{ maxHeight: '70vh' }}
        />
      </div>
      <ActionBar liked={post.liked} saved={post.saved} onLike={onLike} onSave={onSave} />
      <p className="px-4 pb-3 text-sm text-text-primary leading-relaxed">{post.content}</p>
      {post.tags && <Tags tags={post.tags} />}
    </div>
  );
}

function CarouselPost({ post, onLike, onSave }: { post: Post; onLike: () => void; onSave: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
      <PostHeader author={post.author} location={post.location} year={post.year} />
      {/* Horizontal scroll strip */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {post.images!.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="flex-shrink-0 rounded-xl object-cover snap-start"
            style={{ width: 'calc(100% - 32px)', height: '260px' }}
          />
        ))}
      </div>
      <ActionBar liked={post.liked} saved={post.saved} onLike={onLike} onSave={onSave} showViewMore />
      <p className="px-4 pb-3 text-sm text-text-primary leading-relaxed">{post.content}</p>
      {post.tags && <Tags tags={post.tags} />}
    </div>
  );
}

function ImageTextPost({ post, onLike, onSave }: { post: Post; onLike: () => void; onSave: () => void }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
      <PostHeader author={post.author} location={post.location} year={post.year} />
      <div className="px-4 pb-2">
        <img src={post.images![0]} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: '360px' }} />
      </div>
      <ActionBar liked={post.liked} saved={post.saved} onLike={onLike} onSave={onSave} />
      <p className="px-4 pb-4 text-sm text-text-primary leading-relaxed">{post.content}</p>
    </div>
  );
}

function TextPost({ post, onLike, onSave }: { post: Post; onLike: () => void; onSave: () => void }) {
  return (
    <div className="bg-neutral-50 rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
      <PostHeader author={post.author} location={post.location} year={post.year} showMenu={false} />
      <p className="px-4 pb-4 text-[15px] text-text-primary leading-relaxed">{post.content}</p>
      {post.link && (
        <p className="px-4 pb-4">
          <a href={`https://${post.link}`} className="text-[15px] text-[#5B5BD6] underline underline-offset-2">
            {post.link}
          </a>
        </p>
      )}
      <ActionBar liked={post.liked} saved={post.saved} onLike={onLike} onSave={onSave} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>(DEMO_POSTS);
  const { setCreatePickerOpen } = useApp();

  const toggle = (id: string, field: 'liked' | 'saved') => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, [field]: !p[field] } : p));
  };

  return (
    <>
    <div className="max-w-md mx-auto space-y-4">
      {posts.map(post => {
        const props = {
          post,
          onLike: () => toggle(post.id, 'liked'),
          onSave: () => toggle(post.id, 'saved'),
        };

        if (post.type === 'fullsize') return <FullsizePost key={post.id} {...props} />;
        if (post.type === 'carousel') return <CarouselPost key={post.id} {...props} />;
        if (post.type === 'image-text') return <ImageTextPost key={post.id} {...props} />;
        return <TextPost key={post.id} {...props} />;
      })}
    </div>

    {/* Fixed FAB */}
    <button
      onClick={() => setCreatePickerOpen(true)}
      className="fixed bottom-10 right-8 z-50 flex items-center gap-2 bg-[#101010] text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg hover:bg-neutral-700 transition-all duration-200 cursor-pointer"
    >
      <span className="text-lg leading-none">+</span>
      New post
    </button>
    </>
  );
}
