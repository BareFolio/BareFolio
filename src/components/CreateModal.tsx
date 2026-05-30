'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Search, ImagePlus } from 'lucide-react';

const MAX_CHARS = 500;

export default function CreateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { currentUser, profile } = useApp();
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [visibility, setVisibility] = useState<'everyone' | 'followers'>('everyone');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animation state: rendered keeps element in DOM during exit transition
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      // Double rAF ensures the element is painted before we add the visible classes
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 350);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!rendered || !profile) return null;

  const displayName = profile.full_name || profile.username;
  const initials = displayName.slice(0, 2).toUpperCase();
  const projectCount = 0; // placeholder until we fetch it

  async function uploadImages(files: File[]): Promise<string[]> {
    const uploads = files.map(async (file) => {
      const ext = file.name.split('.').pop();
      const path = `${currentUser!.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from('project-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('project-images').getPublicUrl(path);
      return data.publicUrl;
    });
    return Promise.all(uploads);
  }

  const handlePublish = async () => {
    if (!currentUser || !content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const mediaUrls = selectedFiles.length > 0 ? await uploadImages(selectedFiles) : [];
      const { error: insertError } = await supabase.from('posts').insert({
        creator_id: currentUser.id,
        content: content.trim(),
        media_urls: mediaUrls,
        link: link.trim() || null,
        visibility,
      });
      if (insertError) throw insertError;
      setContent('');
      setLink('');
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      console.error('Error creating post:', err);
      const msg = err instanceof Error ? err.message : 'Failed to publish. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setLink('');
    setSelectedFiles([]);
    setError(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 z-50 w-[420px] bg-white flex flex-col shadow-2xl transition-transform duration-[350ms] ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <button
            onClick={handleClose}
            className="text-sm text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <span className="text-sm font-bold text-text-primary">New post</span>
          <button className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer">
            Draft
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Author row */}
          <div className="flex items-center gap-3 px-6 py-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-11 h-11 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600 uppercase flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary leading-tight">{displayName}</p>
              <p className="text-xs text-neutral-400 leading-tight mt-0.5">
                {profile.disciplines?.[0] || 'Creative'}
                {profile.location && (
                  <span className="text-neutral-300 mx-1.5">·</span>
                )}
                {profile.location && <span>{profile.location}</span>}
              </p>
            </div>
          </div>

          {/* Text area */}
          <div className="px-6 pb-2">
            <textarea
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setContent(e.target.value);
              }}
              placeholder="What's on your mind about your creative process?"
              rows={6}
              className="w-full text-sm text-text-primary placeholder-neutral-300 resize-none focus:outline-none leading-relaxed"
            />
            <div className="text-xs text-neutral-300 text-right mt-1">
              {content.length} / {MAX_CHARS}
            </div>
          </div>

          <div className="mx-6 border-t border-neutral-100" />

          {/* Media preview */}
          {selectedFiles.length > 0 && (
            <div className="px-6 py-3 flex gap-2 flex-wrap">
              {selectedFiles.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white text-[9px] flex items-center justify-center cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Link */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Add Link</p>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-300 pointer-events-none" />
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Add Link (Optional)"
                className="w-full bg-neutral-50 border border-neutral-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder-neutral-300 focus:outline-none focus:border-neutral-300 transition-colors"
              />
            </div>
          </div>

          <div className="mx-6 border-t border-neutral-100" />

          {/* Visible To */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">Visible To</p>
            <div className="flex gap-2">
              <button
                onClick={() => setVisibility('everyone')}
                className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all cursor-pointer ${
                  visibility === 'everyone'
                    ? 'border-text-primary bg-text-primary text-white'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                }`}
              >
                Everyone
              </button>
              <button
                onClick={() => setVisibility('followers')}
                className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all cursor-pointer ${
                  visibility === 'followers'
                    ? 'border-text-primary bg-text-primary text-white'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
                }`}
              >
                Followers
              </button>
            </div>
          </div>

          <div className="mx-6 border-t border-neutral-100" />
        </div>

        {/* Error message */}
        {error && (
          <p className="px-6 pb-2 text-xs text-red-500">{error}</p>
        )}

        {/* Bottom actions */}
        <div className="px-6 py-4 border-t border-neutral-100 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 border border-neutral-200 text-sm font-semibold text-text-primary px-5 py-3 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer flex-1 justify-center"
          >
            <ImagePlus className="w-4 h-4" />
            Add Media
          </button>
          <button
            onClick={handlePublish}
            disabled={loading || !content.trim()}
            className="flex-1 bg-[#101010] text-white text-sm font-semibold px-5 py-3 rounded-full hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </>
  );
}
