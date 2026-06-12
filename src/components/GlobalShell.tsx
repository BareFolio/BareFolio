'use client';

import { useApp } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Header from "./Header";
import TabBar from "./TabBar";
import CreateModal from "./CreateModal";
import CreatePicker from "./CreatePicker";
import TasteBuilder from "./TasteBuilder";
import FilterDrawer from "./FilterDrawer";

export default function GlobalShell({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, createPickerOpen, setCreatePickerOpen, newPostOpen, setNewPostOpen, tasteBuilderOpen, setTasteBuilderOpen, filterDrawerOpen, setFilterDrawerOpen, globalDiscipline, setGlobalDiscipline } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const PUBLIC_PATHS = ['/', '/landing', '/login', '/onboarding', '/waitlist', '/pricing', '/curated-access', '/about', '/privacy', '/terms', '/cookies', '/contact', '/faqs'];

  useEffect(() => {
    if (!loading) {
      // Unauthenticated users can only access public paths
      if (!currentUser && !PUBLIC_PATHS.includes(pathname)) {
        router.push('/login');
      }
      // Authenticated users on the landing page → send to the app
      if (currentUser && pathname === '/landing') {
        router.push('/home');
      }
      // "/" handles its own redirect in page.tsx (→ /landing or /explore)
    }
  }, [currentUser, loading, pathname, router]);

  // While checking auth, show public pages instantly (no spinner flash on marketing/auth pages)
  // Only show the spinner on protected app pages
  if (loading && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  // Public pages render without the app chrome (no header/tabbar)
  if (isPublicPage || !currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] text-[#101010] font-sans">
      <Header onCreateClick={() => setCreatePickerOpen(true)} />
      <main className="flex-1 pt-20 md:pt-[80px] pb-28 md:pb-8 w-full px-4 md:px-8">
        {children}
      </main>
      <TabBar onCreateClick={() => setCreatePickerOpen(true)} />
      <CreatePicker isOpen={createPickerOpen} onClose={() => setCreatePickerOpen(false)} />
      <CreateModal isOpen={newPostOpen} onClose={() => setNewPostOpen(false)} />
      <TasteBuilder isOpen={tasteBuilderOpen} onClose={() => setTasteBuilderOpen(false)} />
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        selectedDiscipline={globalDiscipline}
        onSelectDiscipline={(d) => {
          setGlobalDiscipline(d);
          if (pathname !== '/explore') router.push('/explore');
        }}
        onAdvanced={() => {
          setFilterDrawerOpen(false);
          if (pathname !== '/explore') router.push('/explore');
        }}
      />
    </div>
  );
}
