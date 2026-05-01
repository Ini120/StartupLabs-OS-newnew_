import {
  LayoutDashboard, Rocket, Target, FileText, Users, MessageSquare,
  BarChart3, Globe, LogOut, UserCheck, MessagesSquare, User, ChevronRight,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/* ─── Nav definitions ───────────────────────────────────────── */
const studentNav = [
  { title: 'Dashboard',  url: '/dashboard',  icon: LayoutDashboard },
  { title: 'My Startup', url: '/startup',    icon: Rocket },
  { title: 'Milestones', url: '/milestones', icon: Target },
  { title: 'Documents',  url: '/documents',  icon: FileText },
  { title: 'Messages',   url: '/messages',   icon: MessagesSquare },
  { title: 'People',     url: '/people',     icon: Users },
];

const mentorNav = [
  { title: 'Dashboard',         url: '/dashboard',         icon: LayoutDashboard },
  { title: 'Assigned Startups', url: '/assigned-startups', icon: Rocket },
  { title: 'Feedback',          url: '/feedback',          icon: MessageSquare },
  { title: 'Messages',          url: '/messages',          icon: MessagesSquare },
  { title: 'People',            url: '/people',            icon: Users },
];

const adminNav = [
  { title: 'Dashboard',         url: '/dashboard',          icon: LayoutDashboard },
  { title: 'All Startups',      url: '/all-startups',       icon: Rocket },
  { title: 'Users',             url: '/users',              icon: Users },
  { title: 'Assignments',       url: '/mentor-assignments', icon: UserCheck },
  { title: 'Analytics',         url: '/analytics',          icon: BarChart3 },
  { title: 'Messages',          url: '/messages',           icon: MessagesSquare },
];

const superAdminNav = [
  ...adminNav,
  { title: 'Admin Invites', url: '/admin-invites', icon: User },
];

const navByRole: Record<UserRole, typeof studentNav> = {
  student:     studentNav,
  mentor:      mentorNav,
  admin:       adminNav,
  super_admin: superAdminNav,
};

const roleAccent: Record<UserRole, { color: string; glow: string; label: string }> = {
  student:     { color: '#6366f1', glow: 'rgba(99,102,241,0.35)',  label: 'Student' },
  mentor:      { color: '#10b981', glow: 'rgba(16,185,129,0.35)',  label: 'Mentor' },
  admin:       { color: '#f59e0b', glow: 'rgba(245,158,11,0.35)',  label: 'Admin' },
  super_admin: { color: '#ec4899', glow: 'rgba(236,72,153,0.35)',  label: 'Super Admin' },
};

/* ─── Component ─────────────────────────────────────────────── */
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, role, logout } = useAuth();

  const navItems = role ? navByRole[role] : studentNav;
  const accent = role ? roleAccent[role] : roleAccent.student;
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .sb-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: background 0.18s ease, color 0.18s ease;
          width: 100%;
        }
        .sb-nav-item:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.85);
        }
        .sb-nav-item.active {
          color: #fff;
          font-weight: 600;
          background: rgba(255,255,255,0.04);
        }
        .sb-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          border-radius: 0 3px 3px 0;
          background: var(--sb-accent, #6366f1);
          box-shadow: 0 0 8px var(--sb-glow, rgba(99,102,241,0.6));
        }
        .sb-nav-item .sb-icon {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          opacity: 0.6;
          transition: opacity 0.18s ease;
        }
        .sb-nav-item:hover .sb-icon,
        .sb-nav-item.active .sb-icon {
          opacity: 1;
        }
        .sb-nav-item.active .sb-icon {
          color: var(--sb-accent, #6366f1);
          filter: drop-shadow(0 0 6px var(--sb-glow, rgba(99,102,241,0.6)));
        }
        .sb-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          padding: 0 12px;
          margin-bottom: 4px;
        }
        .sb-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 7px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          transition: background 0.18s, color 0.18s;
          flex-shrink: 0;
        }
        .sb-logout-btn:hover {
          background: rgba(239,68,68,0.12);
          color: #f87171;
        }
        .sb-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 8px 12px;
        }
      `}</style>

      <Sidebar
        collapsible="icon"
        style={{
          background: '#0b0f1a',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          '--sb-accent': accent.color,
          '--sb-glow': accent.glow,
        } as React.CSSProperties}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <SidebarHeader style={{ padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Logo mark */}
            <div style={{
              height: 36, width: 36, borderRadius: 10, flexShrink: 0,
              background: accent.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 16px -4px ${accent.glow}`,
            }}>
              <Rocket style={{ height: 16, width: 16, color: '#fff' }} />
            </div>

            {!collapsed && (
              <div style={{ lineHeight: 1.2 }}>
                <span style={{
                  display: 'block',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: 15,
                  color: '#fff',
                  letterSpacing: '-0.025em',
                }}>
                  StartupLabs
                </span>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  Collab Lab
                </span>
              </div>
            )}
          </div>

          {/* Role badge */}
          {!collapsed && (
            <div style={{
              marginTop: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 99,
              background: `${accent.color}14`,
              border: `1px solid ${accent.color}28`,
              width: 'fit-content',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: accent.color,
                boxShadow: `0 0 6px ${accent.color}`,
              }} />
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: accent.color,
              }}>
                {accent.label}
              </span>
            </div>
          )}
        </SidebarHeader>

        {/* ── Nav ─────────────────────────────────────────────── */}
        <SidebarContent style={{ padding: '4px 8px' }}>
          <SidebarGroup>
            {!collapsed && <div className="sb-section-label">Navigation</div>}
            <SidebarGroupContent>
              <SidebarMenu style={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title} style={{ listStyle: 'none' }}>
                      <SidebarMenuButton asChild isActive={isActive} className="data-[active=true]:bg-transparent p-0 h-auto">
                        <NavLink
                          to={item.url}
                          end
                          className="sb-nav-item"
                          activeClassName="active"
                        >
                          <item.icon className="sb-icon" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="sb-divider" />

          {/* Public section */}
          <SidebarGroup>
            {!collapsed && <div className="sb-section-label">Public</div>}
            <SidebarGroupContent>
              <SidebarMenu style={{ listStyle: 'none' }}>
                <SidebarMenuItem style={{ listStyle: 'none' }}>
                  <SidebarMenuButton asChild isActive={location.pathname === '/showcase'} className="data-[active=true]:bg-transparent p-0 h-auto">
                    <NavLink to="/showcase" className="sb-nav-item" activeClassName="active">
                      <Globe className="sb-icon" />
                      {!collapsed && <span>Showcase</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Footer / User ────────────────────────────────────── */}
        <SidebarFooter style={{ padding: '8px 10px 14px' }}>
          <div className="sb-divider" style={{ margin: '0 4px 10px' }} />

          {collapsed ? (
            /* Collapsed: just avatar */
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar style={{ height: 32, width: 32, cursor: 'pointer' }}>
                {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback style={{
                  background: accent.color,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            /* Expanded: full user card */
            <div style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 14,
              padding: '12px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              {/* Subtle glow behind card */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(ellipse at 20% 50%, ${accent.color}0d 0%, transparent 70%)`,
              }} />

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
                <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textDecoration: 'none' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar style={{ height: 34, width: 34 }}>
                      {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                      <AvatarFallback style={{
                        background: `linear-gradient(135deg, ${accent.color}, ${accent.color}99)`,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'DM Sans, sans-serif',
                      }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online dot */}
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#10b981',
                      border: '1.5px solid #0b0f1a',
                      boxShadow: '0 0 6px rgba(16,185,129,0.7)',
                    }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fff',
                      margin: 0,
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user?.full_name ?? 'User'}
                    </p>
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.35)',
                      margin: '2px 0 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                    }}>
                      {accent.label} · Profile
                    </p>
                  </div>

                  <ChevronRight style={{ height: 13, width: 13, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                </NavLink>

                <button className="sb-logout-btn" onClick={logout} title="Log out">
                  <LogOut style={{ height: 14, width: 14 }} />
                </button>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
}