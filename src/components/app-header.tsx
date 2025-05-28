
// src/components/app-header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrafficCone, UserCog, ShieldCheck } from 'lucide-react';
import { UserAvatarDropdown } from './user-avatar-dropdown';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // db and Firestore functions no longer needed here for admin check
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdminCheck, setIsLoadingAdminCheck] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        console.log('[AppHeader] User authenticated:', user.uid, user.email);
        setIsLoadingAdminCheck(true);
        // Admin check based on hardcoded email
        if (user.email === 'admin@test.com') {
          setIsAdmin(true);
          console.log('[AppHeader] User is Admin based on email admin@test.com.');
        } else {
          setIsAdmin(false);
          console.log('[AppHeader] User is NOT Admin (email does not match admin@test.com).');
        }
        setIsLoadingAdminCheck(false);
      } else {
        console.log('[AppHeader] No user authenticated.');
        setIsAdmin(false);
        setIsLoadingAdminCheck(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="py-4 px-6 border-b shadow-sm sticky top-0 bg-background z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <TrafficCone size={28} />
            <h1 className="text-2xl font-bold">Mi Asesor Vial</h1>
          </Link>
          {!isLoadingAdminCheck && isAdmin && (
            <Link href="/dashboard/admin" passHref legacyBehavior>
              <Button variant="outline" size="sm" className="ml-4 border-accent text-accent hover:bg-accent/10 hover:text-accent">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Panel Principal
          </Link>
          <UserAvatarDropdown />
        </nav>
      </div>
    </header>
  );
}
