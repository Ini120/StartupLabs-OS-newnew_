import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Outlet } from 'react-router-dom';
import { NotificationBell } from '@/components/shared/NotificationBell';

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 backdrop-blur-xl">
            <SidebarTrigger className="rounded-lg hover:bg-secondary" />
            <div className="flex-1" />
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}