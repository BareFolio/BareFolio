'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { X, Briefcase, FileText, Image as ImageIcon } from 'lucide-react';

export default function CreateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { currentUser, profile } = useApp();
  const [contentType, setContentType] = useState<'project' | 'post' | 'brief'>('project');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [technique, setTechnique] = useState('Graphic Design');
  const [mood, setMood] = useState('Minimalist');
  const [budget, setBudget] = useState('$2,500');
  const [modality, setModality] = useState('Remote');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !profile) return null;

  const canCreateBrief = profile.profile_type === 'studio' || profile.profile_type === 'brand';
  const canCreateProject = profile.profile_type !== 'brand';

  async function uploadImages(files: File[]): Promise<string[]> {
    const uploads = files.map(async (file) => {
      const ext = file.name.split('.').pop()
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('project-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('project-images').getPublicUrl(path)
      return data.publicUrl
    })
    return Promise.all(uploads)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setLoading(true)
    try {
      if (contentType === 'project') {
        const imageUrls = selectedFiles.length > 0 ? await uploadImages(selectedFiles) : []
        const coverUrl = imageUrls[0] ?? null
        const verStatus = profile?.verified ? 'approved' : 'pending'
        const { error } = await supabase.from('projects').insert({
          user_id: currentUser.id,
          title: title.trim(),
          description: desc.trim() || null,
          cover_url: coverUrl,
          images: imageUrls,
          discipline: technique || null,
          atmosphere: mood || null,
          tags: [],
          verification_status: verStatus,
        })
        if (error) throw error
      } else if (contentType === 'post') {
        const mediaUrls = selectedFiles.length > 0 ? await uploadImages(selectedFiles) : []
        const { error } = await supabase.from('posts').insert({
          user_id: currentUser.id,
          content: desc.trim(),
          media_urls: mediaUrls,
        })
        if (error) throw error
      } else if (contentType === 'brief') {
        const { error } = await supabase.from('briefs').insert({
          user_id: currentUser.id,
          title: title.trim(),
          description: desc.trim() || null,
          disciplines: [],
          budget: budget || null,
          tags: [],
        })
        if (error) throw error
      }
      setTitle('')
      setDesc('')
      setSelectedFiles([])
      onClose()
    } catch (err: any) {
      console.error('Error creating publication:', err)
      onClose()
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass rounded-3xl p-6 shadow-2xl relative border border-borderGlass">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-display font-black text-neutral-900 dark:text-white mb-5">
          New Publication
        </h2>

        {/* Tab Selection */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl gap-1 mb-6 overflow-x-auto">
          {canCreateProject && (
            <button 
              type="button"
              onClick={() => setContentType('project')} 
              className={`flex-1 min-w-[70px] py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${contentType === 'project' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Project</span>
            </button>
          )}
          
          <button 
            type="button"
            onClick={() => setContentType('post')} 
            className={`flex-1 min-w-[70px] py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${contentType === 'post' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
          
          {canCreateBrief && (
            <button 
              type="button"
              onClick={() => setContentType('brief')} 
              className={`flex-1 min-w-[70px] py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${contentType === 'brief' ? 'bg-accent text-white shadow' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Brief</span>
            </button>
          )}

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {contentType !== 'post' && (
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={
                  contentType === 'project'
                    ? "e.g. Atmospheric Brand Visual Identity"
                    : "e.g. Conceptual Cosmetic Box Redesign"
                }
                className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm text-neutral-900 dark:text-white" 
              />
            </div>
          )}

          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">
              {contentType === 'post' ? 'What are you working on today?' : 'Description'}
            </label>
            <textarea 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)} 
              required 
              rows={4} 
              placeholder={
                contentType === 'post'
                  ? "Share a quick design update, work-in-progress link, or creative thought..."
                  : contentType === 'project'
                  ? "Describe the creative direction of this project, concept, process and toolstack..."
                  : "Detail the project scope, expected results, talent requirements, and deadlines..."
              }
              className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm resize-none text-neutral-900 dark:text-white" 
            />
          </div>

          {(contentType === 'project' || contentType === 'post') && (
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">
                Images <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => setSelectedFiles(Array.from(e.target.files ?? []))}
                className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 dark:file:bg-neutral-800 file:text-neutral-700 dark:file:text-neutral-300 cursor-pointer"
              />
              {selectedFiles.length > 0 && (
                <p className="text-[10px] text-neutral-400 mt-1">{selectedFiles.length} file(s) selected</p>
              )}
            </div>
          )}

          {contentType === 'project' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">Core Discipline</label>
                <select 
                  value={technique}
                  onChange={(e) => setTechnique(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl text-sm text-neutral-900 dark:text-white"
                >
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Photography">Photography</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Motion">Motion Design</option>
                  <option value="UX/UI">UX/UI Design</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">Visual Atmosphere</label>
                <select 
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl text-sm text-neutral-900 dark:text-white"
                >
                  <option value="Minimalist">Minimalist</option>
                  <option value="Vibrant">Vibrant</option>
                  <option value="Brutalist">Brutalist</option>
                  <option value="Cyberpunk">Cyberpunk</option>
                  <option value="Classic">Classic</option>
                </select>
              </div>
            </div>
          )}

          {contentType === 'brief' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">Expected Budget</label>
                <input 
                  type="text" 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)} 
                  required 
                  className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm text-neutral-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">Modality</label>
                <select 
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl text-sm text-neutral-900 dark:text-white"
                >
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3.5 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? 'Publishing...' : 'Publish'}
          </button>
        </form>
      </div>
    </div>
  );
}
