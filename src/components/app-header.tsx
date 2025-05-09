import Link from 'next/link';
import { TrafficCone } from 'lucide-react';
import { UserAvatarDropdown } from './user-avatar-dropdown';

export function AppHeader() {
  return (
    <header className="py-4 px-6 border-b shadow-sm sticky top-0 bg-background z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <TrafficCone size={28} />
          <h1 className="text-2xl font-bold">Mi Asesor Vial</h1>
        </Link>
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
