import { ReactNode, useState } from 'react';
import { Menu, Sun, Moon, Search } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useTheme } from 'next-themes';
import { GlobalEmployeeSearch } from '@/components/employees/GlobalEmployeeSearch';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, isAdminPusat, isAdminPimpinan, canViewAll } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const { collapsed } = useSidebarContext();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      {/* Main Content - offset for desktop sidebar, adjusts when collapsed */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-3 sm:px-4 md:px-5 lg:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h2 className="text-xs sm:text-sm font-medium text-foreground truncate">
              {canViewAll ? 'Semua Unit Kerja' : profile?.department}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <NotificationBell />
            {/* Global search - only for admin_pusat and admin_pimpinan */}
            {canViewAll && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                onClick={() => setGlobalSearchOpen(true)}
                title="Cari Pegawai (Semua Unit)"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
            <div className="hidden md:block text-right">
              <p className="text-xs font-medium text-foreground truncate max-w-[120px] lg:max-w-[160px]">{profile?.full_name || 'Admin'}</p>
              <p className="text-[10px] lg:text-xs text-muted-foreground">
                {isAdminPusat ? 'Admin Pusat' : isAdminPimpinan ? 'Admin Pimpinan' : 'Admin Unit'}
              </p>
            </div>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-xs sm:text-sm flex-shrink-0">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-4 md:p-5 lg:p-6">
          {children}
        </main>
      </div>

      {/* Global Employee Search Dialog */}
      <GlobalEmployeeSearch
        open={globalSearchOpen}
        onOpenChange={setGlobalSearchOpen}
      />
    </div>
  );
}
