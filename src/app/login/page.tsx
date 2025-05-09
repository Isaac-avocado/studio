import { LoginForm } from '@/components/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Mi Asesor Vial',
  description: 'Ingresa a tu cuenta de Mi Asesor Vial.',
};

export default function LoginPage() {
  return <LoginForm />;
}
