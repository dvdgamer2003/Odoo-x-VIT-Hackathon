'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardCheck,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { dashboardPathForRole } from '@/lib/dashboard-path';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const dashboardHref = user ? dashboardPathForRole(user.role) : '/dashboard';

  useEffect(() => {
    if (user?.mustChangePassword && pathname !== '/force-change-password') {
      router.push('/force-change-password');
    }
  }, [user, pathname, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { href: dashboardHref, label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: CreditCard },
    ...(user?.role === 'ADMIN' || user?.role === 'MANAGER'
      ? [{ href: '/approvals', label: 'Approvals', icon: ClipboardCheck }]
      : []),
    ...(user?.role === 'ADMIN'
      ? [
          { href: '/users', label: 'Users', icon: Users },
          { href: '/settings', label: 'Settings', icon: Settings },
        ]
      : []),
  ];

  const isNavActive = (href: string) => {
    if (href === dashboardHref) return pathname.startsWith('/dashboard');
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="app-shell min-h-[calc(100vh-1.5rem)] overflow-hidden">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/70 bg-card/85 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="font-heading text-base leading-tight">Odoo x VIT Check</p>
              <p className="text-xs text-muted-foreground">Reimbursement workflow hub</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground sm:block">
              {user?.name} • {user?.role}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1.5 size-3.5" />
              Logout
            </Button>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-5.5rem)] md:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border/70 bg-sidebar/55 p-4 md:block">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">
              Navigation
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isNavActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
            <div className="page-enter">{children}</div>
          </main>
        </div>

        <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border/70 bg-card/95 p-1.5 shadow-xl backdrop-blur md:hidden">
          <div className="grid grid-cols-4 gap-1">
            {navItems.slice(0, 4).map((item) => {
              const active = isNavActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="mb-1 size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
