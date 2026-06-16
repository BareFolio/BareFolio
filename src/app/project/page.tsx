import { Suspense } from 'react';
import ProjectClient from "./ProjectClient";
import { gatePlatform } from '@/lib/platformGate';

export default function ProjectPage() {
  gatePlatform();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#101010] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProjectClient />
    </Suspense>
  );
}
