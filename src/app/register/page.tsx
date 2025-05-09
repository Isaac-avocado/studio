import { RegisterForm } from '@/components/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registro - Mi Asesor Vial',
  description: 'Crea una cuenta en Mi Asesor Vial.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
