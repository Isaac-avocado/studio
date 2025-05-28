
// src/components/app-header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrafficCone, UserCog, ShieldCheck } from 'lucide-react';
import { UserAvatarDropdown } from './user-avatar-dropdown';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsLoadingClaims(true);
        try {
          const idTokenResult = await user.getIdTokenResult(true); // Force refresh
          setIsAdmin(idTokenResult.claims.admin === true);
        } catch (error) {
          console.error("Error fetching user claims:", error);
          setIsAdmin(false);
        } finally {
          setIsLoadingClaims(false);
        }
      } else {
        setIsAdmin(false);
        setIsLoadingClaims(false);
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
          {!isLoadingClaims && isAdmin && (
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
