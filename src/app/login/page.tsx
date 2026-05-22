'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('pending_email') === 'true') {
        setInfoMessage('📧 Success! We sent a confirmation email. Please click the link inside it before logging in.');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      router.push('/');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('confirm') || msg.toLowerCase().includes('verif') || msg.toLowerCase().includes('activated')) {
        setError('Your email is not confirmed. Please check your inbox or disable "Confirm email" inside your Supabase dashboard (Authentication -> Providers -> Email) to sign in immediately.');
      } else {
        setError('Invalid credentials. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        }
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error(err);
      setError(`Failed to sign in with ${provider === 'google' ? 'Google' : 'Apple'}: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full glass p-8 rounded-3xl shadow-xl space-y-6 border border-borderGlass">
        <div className="text-center">
          <Logo className="h-10 w-auto mx-auto block" variant="full" priority />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4 font-sans">
            Enter your credentials to enter the visual design network
          </p>
        </div>
        
        {infoMessage && (
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 p-4 rounded-xl text-xs text-center font-medium leading-relaxed">
            {infoMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded-xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="alex@barefolio.com"
              className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm" 
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 text-sm shadow-md active:scale-95"
          >
            {loading ? 'Logging you in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-borderGlass"></div>
          <span className="px-3 text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 whitespace-nowrap">Or sign in with</span>
          <div className="flex-1 border-t border-borderGlass"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2 border border-borderGlass hover:bg-neutral-100 dark:hover:bg-neutral-850/80 p-3 rounded-xl transition cursor-pointer text-xs font-semibold hover:scale-[1.01] active:scale-95 disabled:opacity-50 dark:text-neutral-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.96 5.96 0 0 1 8 12.56a5.96 5.96 0 0 1 5.99-5.96c2.478 0 4.547 1.48 5.438 3.593l3.66-2.836C20.67 3.5 17.5 1.5 13.99 1.5A11 11 0 0 0 3 12.5a11 11 0 0 0 11 11c6.046 0 10.5-4.256 10.5-10.5 0-.712-.06-1.4-.176-2.215H12.24Z" />
            </svg>
            Google
          </button>
          <button 
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            disabled={loading}
            className="flex items-center justify-center gap-2 border border-borderGlass hover:bg-neutral-100 dark:hover:bg-neutral-850/80 p-3 rounded-xl transition cursor-pointer text-xs font-semibold hover:scale-[1.01] active:scale-95 disabled:opacity-50 dark:text-neutral-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.05-1 .04-2.22.67-2.94 1.51-.62.72-1.16 1.86-1.02 2.96 1.12.09 2.27-.58 2.97-1.42Z" />
            </svg>
            Apple
          </button>
        </div>

        <div className="text-center text-xs text-neutral-500 dark:text-neutral-400">
          Don't have an account?{' '}
          <Link href="/onboarding" className="text-accent font-medium hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
