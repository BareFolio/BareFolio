'use client';

import ProfileClient from '../[id]/ProfileClient';
import { gatePlatform } from '@/lib/platformGate';

export default function MeProfilePage() {
  gatePlatform();
  return <ProfileClient />;
}
