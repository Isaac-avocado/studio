import { ResetPasswordForm } from '@/components/reset-password-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña - Mi Asesor Vial',
  description: 'Restablece tu contraseña de Mi Asesor Vial.',
};


export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
