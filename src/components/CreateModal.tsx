'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { ImagePlus } from 'lucide-react';
import FloatingField from '@/components/FloatingField';

const MAX_CHARS = 500;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

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
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
        'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm',
        'video/quicktime': 'mov',
      };
      const ext = mimeToExt[file.type] ?? 'bin';
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
        author_account_id: currentUser.id,
        body: content.trim(),
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
            <FloatingField
              label="Add Link (Optional)" type="url"
              value={link} onValue={setLink}
            />
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
            onChange={(e) => {
              const incoming = Array.from(e.target.files ?? []);
              const rejected: string[] = [];
              const valid = incoming.filter((f) => {
                if (!ALLOWED_MIME_TYPES.has(f.type)) {
                  rejected.push(`${f.name}: unsupported file type`);
                  return false;
                }
                if (f.size > MAX_FILE_BYTES) {
                  rejected.push(`${f.name}: exceeds 50 MB limit`);
                  return false;
                }
                return true;
              });
              if (rejected.length > 0) setError(rejected[0]);
              if (valid.length > 0) setSelectedFiles((prev) => [...prev, ...valid]);
              // Reset so the same file can be re-selected after an error
              e.target.value = '';
            }}
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
