// src/app/dashboard/profile/page.tsx
import { UserProfileForm } from '@/components/user-profile-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Perfil - Mi Asesor Vial',
  description: 'Administra tu información de perfil y preferencias.',
};

export default function ProfilePage() {
  return (
    <div className="py-8">
      <UserProfileForm />
    </div>
  );
}
