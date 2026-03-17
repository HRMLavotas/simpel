import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Upload, UserCog, User, LogOut, Building2, ChevronLeft, FileSpreadsheet, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminPusatOnly?: boolean;
}
const navItems: NavItem[] = [{
  label: 'Dashboard',
  href: '/dashboard',
  icon: LayoutDashboard
}, {
  label: 'Data Pegawai',
  href: '/employees',
  icon: Users
}, {
  label: 'Import Data',
  href: '/import',
  icon: Upload
}, {
  label: 'Peta Jabatan',
  href: '/peta-jabatan',
  icon: LayoutList
}, {
  label: 'Data Builder',
  href: '/data-builder',
  icon: FileSpreadsheet
}, {
  label: 'Kelola Admin',
  href: '/admins',
  icon: UserCog,
  adminPusatOnly: true
}, {
  label: 'Profile',
  href: '/profile',
  icon: User
}];
export function AppSidebar() {
  const location = useLocation();
  const {
    profile,
    role,
    signOut,
    isAdminPusat
  } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const filteredNavItems = navItems.filter(item => !item.adminPusatOnly || isAdminPusat);
  return <aside className={cn("fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      {/* Logo & Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">SIMPEL</span>
              <span className="text-[10px] text-sidebar-foreground/60">Sistem Manajemen
Pegawai Lavotas</span>
            </div>
          </div>}
        {collapsed && <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary mx-auto">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>}
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "absolute -right-3 top-6 bg-sidebar border border-sidebar-border rounded-full")} onClick={() => setCollapsed(!collapsed)}>
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && <div className="border-b border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name || 'Admin'}
            </p>
            <p className="mt-0.5 text-xs text-sidebar-foreground/60 truncate">
              {profile?.department || 'Unit Kerja'}
            </p>
            <span className={cn("mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", isAdminPusat ? "bg-primary text-primary-foreground" : "bg-sidebar-foreground/10 text-sidebar-foreground")}>
              {isAdminPusat ? 'Admin Pusat' : 'Admin Unit'}
            </span>
          </div>
        </div>}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {filteredNavItems.map(item => {
        const isActive = location.pathname === item.href;
        return <Link key={item.href} to={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200", isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground", collapsed && "justify-center px-2")} title={collapsed ? item.label : undefined}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>;
      })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <button onClick={signOut} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full", "text-red-400 hover:text-red-300 hover:bg-red-500/10", collapsed && "justify-center px-2")} title={collapsed ? 'Keluar' : undefined}>
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>;
}