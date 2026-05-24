'use client';

import { useApp } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Header from "./Header";
import TabBar from "./TabBar";
import CreateModal from "./CreateModal";
import CreatePicker from "./CreatePicker";
import TasteBuilder from "./TasteBuilder";

export default function GlobalShell({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, createPickerOpen, setCreatePickerOpen, newPostOpen, setNewPostOpen, tasteBuilderOpen, setTasteBuilderOpen } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!currentUser && pathname !== '/login' && pathname !== '/onboarding') {
        router.push('/login');
      }
    }
  }, [currentUser, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/onboarding';

  if (isAuthPage || !currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] text-[#101010] font-sans">
      <Header onCreateClick={() => setCreatePickerOpen(true)} />
      <main className="flex-1 pt-20 md:pt-[24px] pb-28 md:pb-8 w-full px-4 md:px-8">
        {children}
      </main>
      <TabBar onCreateClick={() => setCreatePickerOpen(true)} />
      <CreatePicker isOpen={createPickerOpen} onClose={() => setCreatePickerOpen(false)} />
      <CreateModal isOpen={newPostOpen} onClose={() => setNewPostOpen(false)} />
      <TasteBuilder isOpen={tasteBuilderOpen} onClose={() => setTasteBuilderOpen(false)} />
    </div>
  );
}
