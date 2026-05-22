'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ProfileType } from '@/lib/database.types';

const ROLES = [
  { id: 'creator', title: 'Creator', desc: 'Centralize your portfolio. Upload design projects, share micro-posts, and get discovered by clients.', plan: 'Free / Pro' },
  { id: 'studio', title: 'Studio or Agency', desc: 'For design houses and creative agencies. Publish job briefs, scout creators, and collaborate.', plan: '$32/mo' },
  { id: 'brand', title: 'Brand or Company', desc: 'For businesses, brands, and startups looking to hire premium creative talents for brief collaborations.', plan: '$32/mo' },
  { id: 'seeker', title: 'Seeker', desc: 'Explore creative work, find inspiration and talent.', plan: 'Free' },
];

const DISCIPLINES = [
  'Graphic Design',
  'Photography',
  'Fashion Design',
  'Video Editing',
  'Branding',
  'Filmmaker',
  'Art Direction',
  'Packaging',
  'Interior Design',
  'Motion Design',
  'Creative Direction',
  'Animation'
];

const PRACTICES = [
  { id: 'student', title: 'Student', desc: 'Currently studying' },
  { id: 'starting_career', title: 'Starting Career', desc: 'Early career / junior' },
  { id: 'freelance', title: 'Freelance', desc: 'Independent contractor' },
  { id: 'employee', title: 'Employee', desc: 'Full-time at a studio/agency' },
];

const AVAILABILITY_OPTIONS = [
  { id: 'yes', label: 'Yes, looking for opportunities' },
  { id: 'depends', label: 'Depends on the project' },
  { id: 'not_now', label: 'Not open right now' },
  { id: 'dont_know', label: "I don't know yet" },
];

const TEAM_SIZES = ['1-3', '4-10', '11-25', '26-50', '50+'];

const INDUSTRIES = [
  'Fashion & Lifestyle',
  'Tech & Startups',
  'Restaurants & Food',
  'Entertainment & Media',
  'E-commerce & Retail',
  'Real Estate & Architecture',
  'Creative Services',
  'Other'
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  
  // Basic Details
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Creator Profile Questionnaire
  const [username, setUsername] = useState('');
  const [practice, setPractice] = useState('freelance');
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState('yes');
  const [projectPdfName, setProjectPdfName] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Studio Profile Questionnaire
  const [studioName, setStudioName] = useState('');
  const [studioLink, setStudioLink] = useState('');
  const [studioDisciplines, setStudioDisciplines] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState('1-3');
  const [studioVerificationMethod, setStudioVerificationMethod] = useState('email');
  const [studioVerificationData, setStudioVerificationData] = useState('');

  // Brand Profile Questionnaire
  const [brandName, setBrandName] = useState('');
  const [brandLink, setBrandLink] = useState('');
  const [brandIndustry, setBrandIndustry] = useState('Fashion & Lifestyle');
  const [brandDisciplines, setBrandDisciplines] = useState<string[]>([]);
  const [brandVerificationMethod, setBrandVerificationMethod] = useState('email');
  const [brandVerificationData, setBrandVerificationData] = useState('');

  // Status States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  
  const router = useRouter();

  const handleNextStep = () => {
    if (!selectedRole) {
      setError('Please select a profile role first.');
      return;
    }
    if (!email || !password || !name) {
      setError('Please complete all basic fields.');
      return;
    }
    
    setError('');
    setStep(2);
  };

  const toggleDiscipline = (disc: string, type: 'creator' | 'studio' | 'brand') => {
    if (type === 'creator') {
      setSelectedDisciplines(prev => 
        prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
      );
    } else if (type === 'studio') {
      setStudioDisciplines(prev => 
        prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
      );
    } else {
      setBrandDisciplines(prev => 
        prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
      );
    }
  };

  const handleSimulatedPdfUpload = () => {
    setIsUploadingPdf(true);
    setTimeout(() => {
      setProjectPdfName('Creative_Portfolio_Project.pdf');
      setIsUploadingPdf(false);
    }, 1500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate questionnaire fields based on role
    if (selectedRole === 'creator') {
      if (!username) {
        setError('Please create a username.');
        setLoading(false);
        return;
      }
      if (selectedDisciplines.length === 0) {
        setError('Please select at least one main discipline.');
        setLoading(false);
        return;
      }
    } else if (selectedRole === 'studio') {
      if (studioDisciplines.length === 0) {
        setError('Please select at least one discipline.');
        setLoading(false);
        return;
      }
      if (studioVerificationMethod !== 'social' && !studioVerificationData) {
        setError('Please complete the verification detail.');
        setLoading(false);
        return;
      }
    } else if (selectedRole === 'brand') {
      if (brandDisciplines.length === 0) {
        setError('Please select at least one discipline you seek to hire.');
        setLoading(false);
        return;
      }
      if (brandVerificationMethod !== 'social' && !brandVerificationData) {
        setError('Please complete the verification detail.');
        setLoading(false);
        return;
      }
    }

    try {
      // Gather metadata structure based on role
      const customMetadata: any = {
        name,
        role: selectedRole,
      };

      if (selectedRole === 'creator') {
        customMetadata.username = username;
        customMetadata.practice = practice;
        customMetadata.disciplines = selectedDisciplines;
        customMetadata.availability_status = availabilityStatus;
        customMetadata.verification_file_url = projectPdfName ? `mock://files/${projectPdfName}` : '';
      } else if (selectedRole === 'studio') {
        customMetadata.company_name = studioName || name;
        customMetadata.company_link = studioLink;
        customMetadata.disciplines = studioDisciplines;
        customMetadata.team_size = teamSize;
        customMetadata.verification_method = studioVerificationMethod;
        customMetadata.verification_data = studioVerificationData;
      } else if (selectedRole === 'brand') {
        customMetadata.company_name = brandName || name;
        customMetadata.company_link = brandLink;
        customMetadata.industry = brandIndustry;
        customMetadata.disciplines_hiring = brandDisciplines;
        customMetadata.verification_method = brandVerificationMethod;
        customMetadata.verification_data = brandVerificationData;
      }

      // 1. Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: customMetadata
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Try upserting user record in public.profiles table (handles RLS insert policy)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: (selectedRole === 'creator' ? username : (studioName || brandName || name))
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '_'),
            full_name: (selectedRole === 'studio' ? studioName || name : selectedRole === 'brand' ? brandName || name : name).trim(),
            profile_type: selectedRole as ProfileType,
            bio: null,
            location: null,
            website: selectedRole === 'studio' ? (studioLink || null) : selectedRole === 'brand' ? (brandLink || null) : null,
            disciplines: selectedRole === 'creator' ? selectedDisciplines :
                         selectedRole === 'studio' ? studioDisciplines :
                         selectedRole === 'brand' ? brandDisciplines : [],
            verified: false,
          });

        if (profileError) {
          console.warn("Could not insert profile row immediately (normal if email confirmation enabled):", profileError.message);
        }
      }

      // Check if we need email confirmation
      if (data.user && !data.session) {
        setRegistered(true);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  // Render Confirmation Email screen
  if (registered) {
    return (
      <div className="min-h-screen bg-bg-primary p-6 flex flex-col justify-center max-w-md mx-auto py-12 md:py-24 animate-fade-in">
        <div className="glass p-8 rounded-3xl border border-borderGlass shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-display font-black text-neutral-900 dark:text-white">
            Verify your Email
          </h2>
          
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
            We created an account for <span className="font-semibold text-neutral-900 dark:text-white">{name}</span> ({email}).
            Please click the confirmation link sent to your inbox to activate your account.
          </p>

          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 p-4 rounded-2xl text-xs text-left leading-relaxed">
            <span className="font-bold block mb-1">🛠️ Local Development Tip:</span>
            To skip email confirmations, disable "Confirm email" inside your Supabase console:
            <ol className="list-decimal pl-4 mt-1.5 space-y-1">
              <li>Visit your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-accent">Supabase Dashboard</a>.</li>
              <li>Navigate to <strong>Authentication</strong> ➔ <strong>Providers</strong> ➔ <strong>Email</strong>.</li>
              <li>Toggle off <strong>Confirm email</strong>.</li>
              <li>Click <strong>Save</strong>.</li>
            </ol>
          </div>

          <div className="pt-2">
            <Link 
              href="/login?pending_email=true" 
              className="block w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-xl transition duration-200 text-sm shadow-md"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 flex flex-col justify-center max-w-4xl mx-auto py-12 md:py-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-black tracking-tight text-neutral-900 dark:text-white mb-2">
          Join <span className="text-accent font-display font-black">BareFolio</span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-sans max-w-md mx-auto text-sm">
          A visual showcase hub for creators, studios, and marcas looking to scout verified premium designers.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-4 rounded-2xl mb-6 text-sm text-center font-medium max-w-md mx-auto w-full">
          {error}
        </div>
      )}

      {/* STEP 1: Basic Account Registration */}
      {step === 1 && (
        <div className="space-y-8 max-w-md mx-auto w-full">
          {/* Role Cards Grid */}
          <div className="space-y-3">
            <label className="text-xs uppercase font-bold text-neutral-400 tracking-wider">1. Select your Profile Role</label>
            <div className="grid gap-3">
              {ROLES.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`cursor-pointer rounded-2xl p-5 glass transition duration-300 relative border flex items-start gap-4 hover:scale-[1.01] hover:shadow-md ${
                    selectedRole === role.id 
                      ? 'border-accent bg-accent/[0.04] ring-2 ring-accent' 
                      : 'border-borderGlass hover:border-neutral-400 dark:hover:border-neutral-500'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-display font-black tracking-tight text-neutral-800 dark:text-neutral-100">{role.title}</h3>
                      <span className="text-[9px] bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{role.plan}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">{role.desc}</p>
                  </div>
                  {selectedRole === role.id && (
                    <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 mt-0.5">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Credentials Form */}
          <div className="glass p-6 rounded-3xl border border-borderGlass space-y-4">
            <h3 className="text-sm uppercase font-bold text-neutral-400 tracking-wider">2. Account Credentials</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">Full Name / Organization</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="e.g. Alexander McQueen"
                  className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-sm" 
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-semibold">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="alex@example.com"
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
            </div>

            <button 
              type="button" 
              onClick={handleNextStep}
              className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition duration-200 cursor-pointer shadow-md text-sm active:scale-95 mt-2"
            >
              Continue to Questionnaire
            </button>
          </div>

          <div className="text-center text-xs text-neutral-500 dark:text-neutral-400">
            Already have an account? <Link href="/login" className="text-accent font-medium hover:underline">Log in</Link>
          </div>
        </div>
      )}

      {/* STEP 2: Role-Based Questionnaires */}
      {step === 2 && (
        <form onSubmit={handleRegister} className="glass p-8 rounded-3xl max-w-xl mx-auto w-full space-y-6 border border-borderGlass">
          <div className="flex justify-between items-center border-b border-borderGlass pb-4">
            <h2 className="text-xl font-display font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-accent/15 text-accent rounded uppercase tracking-wider font-bold">Step 2 of 2</span>
              {selectedRole === 'creator' ? 'Creator Profile' : selectedRole === 'studio' ? 'Studio Profile' : selectedRole === 'brand' ? 'Brand Profile' : 'Seeker Profile'}
            </h2>
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-neutral-400 hover:text-accent cursor-pointer transition-all"
            >
              ← Go Back
            </button>
          </div>

          {/* CREATOR ONBOARDING FORM */}
          {selectedRole === 'creator' && (
            <div className="space-y-5">
              {/* Username */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-bold uppercase tracking-wider">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-xs text-neutral-400 font-bold font-mono">barefolio.com/</span>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} 
                    required 
                    placeholder="alexmcqueen"
                    className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass pl-[105px] pr-3 py-3 rounded-xl focus:outline-none focus:border-accent text-xs font-mono" 
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">Unique handle for your public portfolios and visual feed link.</p>
              </div>

              {/* Practice */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Current practice</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRACTICES.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => setPractice(p.id)}
                      className={`cursor-pointer border rounded-xl p-3 text-center transition hover:scale-[1.01] ${
                        practice === p.id 
                          ? 'border-accent bg-accent/[0.03] text-accent ring-1 ring-accent' 
                          : 'border-borderGlass hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <h4 className="text-xs font-bold">{p.title}</h4>
                      <p className="text-[9px] text-neutral-400 mt-0.5">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disciplines */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Main Disciplines (Select all that apply)</label>
                <div className="flex flex-wrap gap-1.5">
                  {DISCIPLINES.map((disc) => {
                    const isSel = selectedDisciplines.includes(disc);
                    return (
                      <button
                        type="button"
                        key={disc}
                        onClick={() => toggleDiscipline(disc, 'creator')}
                        className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer active:scale-95 ${
                          isSel 
                            ? 'bg-accent/15 border-accent text-accent font-semibold' 
                            : 'bg-neutral-100 dark:bg-neutral-900 border-borderGlass text-neutral-500 hover:border-neutral-400'
                        }`}
                      >
                        {disc} {isSel && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability (skippable) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Availability for Opportunities</label>
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Optional</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setAvailabilityStatus(opt.id)}
                      className={`cursor-pointer border rounded-xl p-3 text-center transition hover:scale-[1.01] text-xs font-semibold ${
                        availabilityStatus === opt.id
                          ? 'border-accent bg-accent/[0.03] text-accent ring-1 ring-accent'
                          : 'border-borderGlass hover:border-neutral-400 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Verification Upload */}
              <div className="border-t border-borderGlass pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Profile Verification</label>
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Optional</span>
                </div>
                <div className="border border-dashed border-borderGlass rounded-2xl p-6 text-center space-y-2 bg-neutral-100/50 dark:bg-neutral-900/30 flex flex-col items-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div>
                    <h5 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Upload a Project PDF</h5>
                    <p className="text-[10px] text-neutral-400">Share your latest client pitch, slides, or brand deck</p>
                  </div>
                  {projectPdfName ? (
                    <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                      ✓ {projectPdfName}
                      <button type="button" onClick={() => setProjectPdfName('')} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploadingPdf}
                      onClick={handleSimulatedPdfUpload}
                      className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-accent font-bold text-[10px] px-4 py-2 rounded-lg border border-borderGlass cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isUploadingPdf ? 'Uploading...' : 'Browse PDF File'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STUDIO / AGENCY ONBOARDING FORM */}
          {selectedRole === 'studio' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-bold uppercase tracking-wider">Studio / Agency Name</label>
                  <input 
                    type="text" 
                    value={studioName} 
                    onChange={(e) => setStudioName(e.target.value)} 
                    placeholder="e.g. Estudio V"
                    className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-xs" 
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-bold uppercase tracking-wider">Website URL</label>
                  <input 
                    type="url" 
                    value={studioLink} 
                    onChange={(e) => setStudioLink(e.target.value)} 
                    placeholder="e.g. https://estudiov.design"
                    className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-xs" 
                  />
                </div>
              </div>

              {/* Disciplines */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Working Disciplines (Select all that apply)</label>
                <div className="flex flex-wrap gap-1.5">
                  {DISCIPLINES.map((disc) => {
                    const isSel = studioDisciplines.includes(disc);
                    return (
                      <button
                        type="button"
                        key={disc}
                        onClick={() => toggleDiscipline(disc, 'studio')}
                        className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer active:scale-95 ${
                          isSel 
                            ? 'bg-accent/15 border-accent text-accent font-semibold' 
                            : 'bg-neutral-100 dark:bg-neutral-900 border-borderGlass text-neutral-500 hover:border-neutral-400'
                        }`}
                      >
                        {disc} {isSel && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Team Size */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Team Size</label>
                <div className="flex gap-2 flex-wrap">
                  {TEAM_SIZES.map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => setTeamSize(size)}
                      className={`text-xs px-4 py-2.5 rounded-xl border transition flex-1 font-bold cursor-pointer active:scale-95 ${
                        teamSize === size 
                          ? 'border-accent bg-accent/[0.04] text-accent font-extrabold ring-1 ring-accent' 
                          : 'border-borderGlass hover:border-neutral-400 text-neutral-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Studio Verification */}
              <div className="border-t border-borderGlass pt-4 space-y-3">
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block font-bold uppercase tracking-wider">Verify Agency Account</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'email', label: 'Corporate Email' },
                    { id: 'social', label: 'Social Accounts' },
                    { id: 'document', label: 'Legal Document' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => { setStudioVerificationMethod(m.id); setStudioVerificationData(''); }}
                      className={`text-[10px] uppercase tracking-wider font-bold py-2 rounded-lg border transition ${
                        studioVerificationMethod === m.id
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-accent border-accent'
                          : 'border-borderGlass text-neutral-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {studioVerificationMethod === 'email' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Official Corporate Email Address</label>
                    <input
                      type="email"
                      value={studioVerificationData}
                      onChange={(e) => setStudioVerificationData(e.target.value)}
                      placeholder="hello@agency.com"
                      className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-xs"
                    />
                    <p className="text-[9px] text-neutral-400">We will send a validation code to verify your agency status.</p>
                  </div>
                )}

                {studioVerificationMethod === 'social' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Link Connected Handle</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setStudioVerificationData('Connected to Instagram')}
                        className={`text-xs px-4 py-2 border rounded-xl flex-1 font-bold ${
                          studioVerificationData.includes('Instagram') ? 'border-accent text-accent bg-accent/5' : 'border-borderGlass text-neutral-400'
                        }`}
                      >
                        Instagram
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStudioVerificationData('Connected to LinkedIn')}
                        className={`text-xs px-4 py-2 border rounded-xl flex-1 font-bold ${
                          studioVerificationData.includes('LinkedIn') ? 'border-accent text-accent bg-accent/5' : 'border-borderGlass text-neutral-400'
                        }`}
                      >
                        LinkedIn
                      </button>
                    </div>
                  </div>
                )}

                {studioVerificationMethod === 'document' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Drop Official Invoice / Registration File</label>
                    <div className="border border-dashed border-borderGlass rounded-xl p-4 text-center text-xs">
                      {studioVerificationData ? (
                        <span className="text-emerald-500 font-bold">✓ {studioVerificationData}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStudioVerificationData('Corporate_Registration.pdf')}
                          className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-[10px] px-3 py-1.5 rounded-lg border border-borderGlass cursor-pointer"
                        >
                          Select Business PDF
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BRAND / COMPANY ONBOARDING FORM */}
          {selectedRole === 'brand' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-bold uppercase tracking-wider">Brand Name</label>
                  <input 
                    type="text" 
                    value={brandName} 
                    onChange={(e) => setBrandName(e.target.value)} 
                    placeholder="e.g. Balenciaga"
                    className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-xs" 
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-bold uppercase tracking-wider">Website URL</label>
                  <input 
                    type="url" 
                    value={brandLink} 
                    onChange={(e) => setBrandLink(e.target.value)} 
                    placeholder="e.g. https://balenciaga.com"
                    className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-xs" 
                  />
                </div>
              </div>

              {/* Industry Selector */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1 font-bold uppercase tracking-wider">Industry</label>
                <select
                  value={brandIndustry}
                  onChange={(e) => setBrandIndustry(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-xs font-sans font-semibold text-neutral-800 dark:text-neutral-100"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              {/* Disciplines Seeking to Hire */}
              <div>
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-2 font-bold uppercase tracking-wider">Disciplines looking to Hire</label>
                <div className="flex flex-wrap gap-1.5">
                  {DISCIPLINES.map((disc) => {
                    const isSel = brandDisciplines.includes(disc);
                    return (
                      <button
                        type="button"
                        key={disc}
                        onClick={() => toggleDiscipline(disc, 'brand')}
                        className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer active:scale-95 ${
                          isSel 
                            ? 'bg-accent/15 border-accent text-accent font-semibold' 
                            : 'bg-neutral-100 dark:bg-neutral-900 border-borderGlass text-neutral-500 hover:border-neutral-400'
                        }`}
                      >
                        {disc} {isSel && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Verification */}
              <div className="border-t border-borderGlass pt-4 space-y-3">
                <label className="text-xs text-neutral-500 dark:text-neutral-400 block font-bold uppercase tracking-wider">Verify Brand Account</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'email', label: 'Corporate Email' },
                    { id: 'social', label: 'Social Accounts' },
                    { id: 'document', label: 'Legal Document' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => { setBrandVerificationMethod(m.id); setBrandVerificationData(''); }}
                      className={`text-[10px] uppercase tracking-wider font-bold py-2 rounded-lg border transition ${
                        brandVerificationMethod === m.id
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-accent border-accent'
                          : 'border-borderGlass text-neutral-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {brandVerificationMethod === 'email' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Official Corporate Email Address</label>
                    <input
                      type="email"
                      value={brandVerificationData}
                      onChange={(e) => setBrandVerificationData(e.target.value)}
                      placeholder="hello@brand.com"
                      className="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-borderGlass p-3 rounded-xl focus:outline-none focus:border-accent text-xs"
                    />
                    <p className="text-[9px] text-neutral-400">We will send a validation code to verify your brand status.</p>
                  </div>
                )}

                {brandVerificationMethod === 'social' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Link Connected Handle</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setBrandVerificationData('Connected to Instagram')}
                        className={`text-xs px-4 py-2 border rounded-xl flex-1 font-bold ${
                          brandVerificationData.includes('Instagram') ? 'border-accent text-accent bg-accent/5' : 'border-borderGlass text-neutral-400'
                        }`}
                      >
                        Instagram
                      </button>
                      <button 
                        type="button"
                        onClick={() => setBrandVerificationData('Connected to LinkedIn')}
                        className={`text-xs px-4 py-2 border rounded-xl flex-1 font-bold ${
                          brandVerificationData.includes('LinkedIn') ? 'border-accent text-accent bg-accent/5' : 'border-borderGlass text-neutral-400'
                        }`}
                      >
                        LinkedIn
                      </button>
                    </div>
                  </div>
                )}

                {brandVerificationMethod === 'document' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-400 font-semibold block">Drop Official Brand Invoice / Registration File</label>
                    <div className="border border-dashed border-borderGlass rounded-xl p-4 text-center text-xs">
                      {brandVerificationData ? (
                        <span className="text-emerald-500 font-bold">✓ {brandVerificationData}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setBrandVerificationData('Brand_Registration.pdf')}
                          className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-[10px] px-3 py-1.5 rounded-lg border border-borderGlass cursor-pointer"
                        >
                          Select Business PDF
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 text-sm shadow-md active:scale-95"
          >
            {loading ? 'Registering Account...' : 'Complete Profile & Register'}
          </button>
        </form>
      )}
    </div>
  );
}
