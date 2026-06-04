// The root route renders the marketing landing page.
// Auth routing is handled in GlobalShell:
//   - Unauthenticated → stays here (public)
//   - Authenticated   → redirected to /explore
export { default } from '@/app/landing/page';
