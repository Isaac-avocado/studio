
// src/components/app-header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrafficCone, UserCog, ShieldCheck } from 'lucide-react';
import { UserAvatarDropdown } from './user-avatar-dropdown';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config'; // Ensure db is imported
import { doc, getDoc } from 'firebase/firestore'; // Ensure Firestore functions are imported
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdminCheck, setIsLoadingAdminCheck] = useState(true); // Changed from isLoadingClaims

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        console.log('[AppHeader] User authenticated:', user.uid);
        setIsLoadingAdminCheck(true);
        try {
          // Fetch Firestore document to check for isAdmin (for test app admin setup)
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log('[AppHeader] Firestore user data:', userData);
            if (userData?.isAdmin === true) {
              setIsAdmin(true);
              console.log('[AppHeader] User is Admin based on Firestore.');
            } else {
              setIsAdmin(false);
              console.log('[AppHeader] User is NOT Admin based on Firestore (isAdmin not true or missing).');
            }
          } else {
            setIsAdmin(false);
            console.log('[AppHeader] Firestore user document does not exist for UID:', user.uid);
          }
        } catch (error) {
          console.error("[AppHeader] Error fetching user admin status from Firestore:", error);
          setIsAdmin(false);
        } finally {
          setIsLoadingAdminCheck(false);
        }
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
