import ProjectClient from "./ProjectClient";

// Since this project uses static export ("output: export"), Next.js requires
// generateStaticParams for dynamic routes so they can be generated at build time.
export function generateStaticParams() {
  return [
    { id: 'stow' },
    { id: 'emponi' },
    { id: 'tierra' },
    { id: 'venu' }
  ];
}

export default function ProjectPage() {
  return <ProjectClient />;
}
