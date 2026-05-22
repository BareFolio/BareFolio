'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  Send, 
  Image as ImageIcon,
  CheckCircle,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

interface PostAuthor {
  name: string;
  avatar_url?: string;
  role: string;
  username?: string;
}

interface PostData {
  id: string;
  creator_id: string;
  content: string;
  created_at: string;
  authorName?: string;
  authorUsername?: string;
  authorRole?: string;
  authorAvatar?: string;
  likes?: number;
  liked?: boolean;
  replies?: Array<{ sender: string; text: string }>;
  showReplies?: boolean;
}

const FALLBACK_POSTS: PostData[] = [
  {
    id: 'fallback-post-1',
    creator_id: 'alex-mcqueen',
    authorName: 'Alexander McQueen',
    authorUsername: 'alexmcqueen',
    authorRole: 'creator',
    content: 'Just finalized the brutalist typography layout for the upcoming print issue of BareFolio. The interaction of high-contrast letterforms against uncoated raw cream stock is stunning! What do you all think? #graphicdesign #typography #printdev',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    likes: 42,
    liked: false,
    replies: [
      { sender: 'Luisa Barriga', text: 'The kerning on that heading is absolute perfection, Alexander!' },
      { sender: 'Hugo Bossio', text: 'Outstanding! The tactile raw stock matches the aesthetic beautifully.' }
    ]
  },
  {
    id: 'fallback-post-2',
    creator_id: 'luisa-barriga',
    authorName: 'Luisa Barriga',
    authorUsername: 'luisaphoto',
    authorRole: 'creator',
    content: 'Chasing the shadows at milan brutalist concrete pavilion. The natural golden hour contrasts this afternoon are creating some incredible geometric textures. Photographic series dropping in my portfolio folder soon! #photography #geometry #minimalism',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    likes: 29,
    liked: false,
    replies: []
  },
  {
    id: 'fallback-post-3',
    creator_id: 'estudio-v',
    authorName: 'Estudio V',
    authorUsername: 'estudiov',
    authorRole: 'studio',
    content: 'Developing conceptual sustainable packaging containers for our organic clay collection. Materials matter, but visual honesty matters more. ✨ #packaging #sustainabledesign #branding',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    likes: 56,
    liked: false,
    replies: [
      { sender: 'Alexander McQueen', text: 'This material study looks incredibly organic. Count me in for a review!' }
    ]
  }
];

export default function PostsPage() {
  const { profile } = useApp();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          creator_id,
          content,
          created_at,
          profiles:creator_id (
            name,
            avatar_url,
            role,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Could not query posts from database. Fallback system is active:", error.message);
      } else if (data) {
        const formatted: PostData[] = data.map((p: any) => {
          const profileData = p.profiles || {};
          return {
            id: p.id,
            creator_id: p.creator_id,
            content: p.content,
            created_at: p.created_at,
            authorName: profileData.name || 'Creative Member',
            authorUsername: profileData.username || 'creative',
            authorRole: profileData.role || 'creator',
            authorAvatar: profileData.avatar_url || '',
            likes: Math.floor(Math.random() * 15) + 1,
            liked: false,
            replies: [],
            showReplies: false
          };
        });
        setPosts(formatted);
      }
    } catch (err) {
      console.error("Posts query failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Setup Postgres realtime channels on posts table
    let postsChannel: any = null;
    try {
      postsChannel = supabase
        .channel('posts-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
          fetchPosts();
        })
        .subscribe();
    } catch (realtimeErr) {
      console.error("Realtime channels setup failed on posts feed:", realtimeErr);
    }

    return () => {
      if (postsChannel) supabase.removeChannel(postsChannel);
    };
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !profile) return;

    const postContent = inputText;
    setInputText('');

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          creator_id: profile.uid,
          content: postContent
        });

      if (error) {
        console.warn("Real insertion failed. Simulating local insert:", error.message);
        // Fallback simulation
        const mockNew: PostData = {
          id: `local-post-${Date.now()}`,
          creator_id: profile.uid,
          content: postContent,
          created_at: new Date().toISOString(),
          authorName: profile.full_name ?? profile.username,
          authorUsername: profile.username,
          authorRole: profile.profile_type,
          authorAvatar: profile.avatar_url || '',
          likes: 0,
          liked: false,
          replies: [],
          showReplies: false
        };
        setPosts((prev) => [mockNew, ...prev]);
      } else {
        fetchPosts();
      }
    } catch (err) {
      console.error("Post creation error:", err);
    }
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newLiked = !p.liked;
          return {
            ...p,
            liked: newLiked,
            likes: (p.likes || 0) + (newLiked ? 1 : -1)
          };
        }
        return p;
      })
    );
  };

  const handleToggleReplies = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, showReplies: !p.showReplies };
        }
        return p;
      })
    );
  };

  const handleAddReply = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const replyText = replyInputs[postId];
    if (!replyText?.trim() || !profile) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const currentReplies = p.replies || [];
          return {
            ...p,
            replies: [...currentReplies, { sender: profile.full_name ?? profile.username, text: replyText }],
            showReplies: true
          };
        }
        return p;
      })
    );

    setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleShare = (postId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/posts?id=${postId}`;
      navigator.clipboard.writeText(url);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Merge database posts with high fidelity mock posts
  const allPosts = posts.length > 0 ? [...posts, ...FALLBACK_POSTS.filter(fp => !posts.some(p => p.content === fp.content))] : FALLBACK_POSTS;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-borderGlass pb-6">
        <h1 className="text-3xl font-display font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          <span>Shorts & Social updates</span>
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
          Read quick-fire design thoughts, work-in-progress snapshots, and real-time creative concepts from the BareFolio network.
        </p>
      </div>

      {/* Post Compositor Block */}
      {profile ? (
        <div className="glass p-5 rounded-3xl border border-borderGlass shadow-md flex gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/25 text-accent flex items-center justify-center font-display font-black text-sm uppercase flex-shrink-0">
            {(profile.full_name ?? profile.username).substring(0, 2)}
          </div>
          
          <form onSubmit={handleCreatePost} className="flex-1 space-y-3">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="What are you working on today, designer?"
              required
              rows={3}
              className="w-full bg-transparent border-0 focus:ring-0 text-sm text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none"
            />
            
            <div className="flex justify-between items-center border-t border-borderGlass/40 pt-3">
              <button 
                type="button" 
                className="text-neutral-400 hover:text-accent p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Mock Attachment"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Attach File</span>
              </button>
              
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow transition active:scale-95 flex items-center gap-1"
              >
                <span>Share Update</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="glass p-6 rounded-3xl border border-borderGlass/60 text-center space-y-3">
          <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Join the creative dialogue</h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">Sign in to share your live updates and react to other creators' feeds.</p>
          <Link href="/login" className="inline-block bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 px-6 rounded-xl transition shadow active:scale-95">
            Log In or Register
          </Link>
        </div>
      )}

      {/* Feed Container */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : allPosts.length > 0 ? (
        <div className="space-y-4">
          {allPosts.map((post) => {
            const hasVisualTheme = post.content.toLowerCase().includes('typography') || post.content.toLowerCase().includes('shadows') || post.content.toLowerCase().includes('sustainable');
            return (
              <div 
                key={post.id} 
                className="glass rounded-3xl border border-borderGlass shadow-sm overflow-hidden hover:shadow-md transition duration-200"
              >
                {/* Header card details */}
                <div className="p-5 flex justify-between items-start gap-3">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-[#FF2D55] p-0.5 shadow flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center font-display font-black text-sm text-neutral-800 dark:text-white uppercase">
                        {post.authorName ? post.authorName.substring(0, 2) : 'CR'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link 
                          href={`/profile/${post.creator_id}`}
                          className="font-display font-bold text-sm text-neutral-800 dark:text-neutral-100 hover:text-accent transition"
                        >
                          {post.authorName}
                        </Link>
                        <span className="text-[10px] text-neutral-400 font-sans">
                          @{post.authorUsername || 'creative'}
                        </span>
                        <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-borderGlass/50">
                          {post.authorRole}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                        {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer p-1">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Content section */}
                <div className="px-5 pb-4 space-y-4">
                  <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Optional premium dynamic mockup background illustration */}
                  {hasVisualTheme && (
                    <div className="w-full h-36 bg-gradient-to-tr from-neutral-900 via-neutral-800 to-[#121214] rounded-2xl border border-borderGlass flex flex-col justify-end p-4 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-neutral-500/5 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute top-4 left-4 flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFCC00]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4CD964]" />
                      </div>
                      <div className="text-[9px] font-bold text-white/50 tracking-widest uppercase">
                        Mock Visual Concept
                      </div>
                      <div className="font-display font-black text-white text-lg tracking-tight leading-none mt-1 select-none">
                        BareFolio Visual Canvas
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Bar reactions */}
                <div className="border-t border-borderGlass/40 px-4 py-2 flex items-center justify-between bg-white/20 dark:bg-black/10">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1 text-xs cursor-pointer p-1 rounded-lg transition-colors ${post.liked ? 'text-red-500 font-extrabold' : 'text-neutral-400 hover:text-red-400'}`}
                    >
                      <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{post.likes || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleToggleReplies(post.id)}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-accent cursor-pointer p-1 rounded-lg"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.replies?.length || 0}</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-accent cursor-pointer p-1.5 rounded-lg"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{copiedId === post.id ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>

                {/* Inline replies drawer */}
                {(post.showReplies || (post.replies && post.replies.length > 0)) && post.showReplies && (
                  <div className="border-t border-borderGlass/40 bg-neutral-50/50 dark:bg-neutral-900/30 p-5 space-y-4">
                    {post.replies && post.replies.length > 0 && (
                      <div className="space-y-3">
                        {post.replies.map((reply, idx) => (
                          <div key={idx} className="flex gap-3 text-xs leading-relaxed items-start">
                            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center font-display font-extrabold text-[10px] uppercase flex-shrink-0 mt-0.5">
                              {reply.sender.substring(0, 2)}
                            </div>
                            <div className="bg-neutral-100 dark:bg-neutral-800/80 p-3 rounded-2xl rounded-tl-none border border-borderGlass/40 flex-1">
                              <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">
                                {reply.sender}
                              </span>
                              <p className="text-neutral-600 dark:text-neutral-400 font-sans">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {profile ? (
                      <form 
                        onSubmit={(e) => handleAddReply(post.id, e)}
                        className="flex gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={replyInputs[post.id] || ''}
                          onChange={(e) => setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Type a response to this update..."
                          className="flex-1 bg-white dark:bg-neutral-800 border border-borderGlass px-4 py-2.5 rounded-xl focus:outline-none focus:border-accent text-xs"
                        />
                        <button
                          type="submit"
                          disabled={!(replyInputs[post.id] || '').trim()}
                          className="w-9 h-9 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow transition duration-200 cursor-pointer active:scale-95 flex-shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <p className="text-[10px] text-neutral-400 text-center italic">Sign in to join the conversation.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-borderGlass rounded-3xl bg-neutral-50 dark:bg-neutral-900/10 space-y-3">
          <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No Posts Published</h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">Be the first to share an update on the feed!</p>
        </div>
      )}
    </div>
  );
}
