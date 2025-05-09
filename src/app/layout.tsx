
'use client'; // Required for usePathname

import type { Metadata } from 'next'; // Keep for potential static metadata parts
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppHeader } from '@/components/app-header';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation'; // Import usePathname

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// export const metadata: Metadata = { // Metadata cannot be dynamically set in a client component root layout easily
//   title: 'Mi Asesor Vial',
//   description: 'Tu asistente inteligente para regulaciones viales y seguridad.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const authRoutes = ['/login', '/register', '/reset-password'];
  const isAuthPage = authRoutes.includes(pathname);

  return (
    <html lang="es">
      <head>
        {/* Static metadata can be placed here if needed, or in individual page.tsx files */}
        <title>Mi Asesor Vial</title>
        <meta name="description" content="Tu asistente inteligente para regulaciones viales y seguridad." />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {!isAuthPage && <AppHeader />}
        <main className={`flex-grow ${isAuthPage ? '' : 'container mx-auto px-4 py-8'}`}>
          {children}
        </main>
        <Toaster />
        {!isAuthPage && (
          <footer className="py-6 text-center text-xs text-muted-foreground border-t">
            © {new Date().getFullYear()} Mi Asesor Vial. Todos los derechos reservados.
          </footer>
        )}
      </body>
    </html>
  );
}
