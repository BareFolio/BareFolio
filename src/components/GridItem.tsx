'use client';

import Link from 'next/link';

export interface ProjectData {
  id: string;
  title: string;
  creatorId: string;
  creatorName?: string;
  description?: string;
  coverUrl?: string;
  discipline?: string;
  technique?: string;
  mood?: string;
  paletteHex?: string[];
  year?: number | null;
  createdAt?: string;
  tags?: string[];
}

// Deterministic placeholder gradient based on title
function getPlaceholderGradient(title: string) {
  const gradients = [
    'from-[#FF9A9E] to-[#FECFEF]',
    'from-[#A1C4FD] to-[#C2E9FB]',
    'from-[#F6D365] to-[#FDA085]',
    'from-[#84FAB0] to-[#8FD3F4]',
    'from-[#E0C3FC] to-[#8EC5FC]',
    'from-[#F093FB] to-[#F5576C]',
    'from-[#4FACFE] to-[#00F2FE]',
    'from-[#FA709A] to-[#FEE140]',
  ];
  let sum = 0;
  for (let i = 0; i < title.length; i++) sum += title.charCodeAt(i);
  return gradients[sum % gradients.length];
}

export default function GridItem({ project }: { project: ProjectData }) {
  const gradient = getPlaceholderGradient(project.title);
  const year = project.year ?? (project.createdAt ? new Date(project.createdAt).getFullYear() : null);
  const discipline = project.discipline || project.technique || null;

  return (
    <Link href={`/project?id=${project.id}`} className="block">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden group cursor-pointer">

        {/* Image or gradient placeholder */}
        {project.coverUrl ? (
          <img
            src={project.coverUrl}
            alt={project.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-tr ${gradient}`} />
        )}

        {/* Dark overlay — fades in on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Bottom info — slides up and fades in on hover */}
        <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex items-end justify-between gap-2">
          {/* Left: name + discipline */}
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">
              {project.title}
            </p>
            {discipline && (
              <p className="text-white/65 text-xs mt-0.5 truncate">{discipline}</p>
            )}
          </div>

          {/* Right: year */}
          {year && (
            <span className="text-white/65 text-xs flex-shrink-0 leading-tight">
              {year}
            </span>
          )}
        </div>

      </div>
    </Link>
  );
}
