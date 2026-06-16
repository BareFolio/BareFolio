import ProfileClient from './ProfileClient';
import { gatePlatform } from '@/lib/platformGate';

export async function generateStaticParams() {
  return [
    { id: 'me' },
    { id: 'alex-mcqueen' },
    { id: 'luisa-barriga' },
    { id: 'estudio-v' },
    { id: 'hugo-ux' },
    { id: 'motion-hq' }
  ];
}

export default function ProfilePage() {
  gatePlatform();
  return <ProfileClient />;
}
