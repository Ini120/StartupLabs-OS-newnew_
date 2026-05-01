import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  GraduationCap, MessageSquare, Loader2, Check,
  ArrowRight, Rocket, Sparkles,
} from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useToast } from '@/hooks/use-toast';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

/* ─── Role definitions ─────────────────────────────────────────── */
const roles: {
  value: UserRole;
  label: string;
  tagline: string;
  description: string;
  perks: string[];
  icon: React.ElementType;
  accent: string;
  glow: string;
  iconBg: string;
}[] = [
  {
    value: 'student',
    label: 'Student',
    tagline: "I'm building a startup",
    description:
      'Ship your idea with expert mentor guidance, milestone tracking, and all the tools founders need.',
    perks: [
      'Auto-matched mentor on day one',
      'Track milestones & progress',
      'Upload pitch decks & docs',
    ],
    icon: GraduationCap,
    accent: '#6366f1',
    glow: 'rgba(99,102,241,0.30)',
    iconBg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  {
    value: 'mentor',
    label: 'Mentor',
    tagline: "I'm guiding founders",
    description:
      'Share your expertise with the next generation. Give feedback, track progress, and drive real outcomes.',
    perks: [
      'Assigned student startups',
      'Session feedback tools',
      'Track student progress',
    ],
    icon: MessageSquare,
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.28)',
    iconBg: 'linear-gradient(135deg, #10b981, #059669)',
  },
];

/* ─── Component ─────────────────────────────────────────────────── */
export default function SelectRole() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const invoke = useInvokeEdge();
  const [pending, setPending] = useState<UserRole | null>(null);
  const [hovered, setHovered] = useState<UserRole | null>(null);

  const handleSelect = async (role: UserRole) => {
    if (!user || pending) return;
    setPending(role);
    try {
      const res = await invoke('assign-role', { role });
      if (res.error) throw res.error;
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Could not set role', description: err.message, variant: 'destructive' });
      setPending(null);
    }
  };

  return (
    <AuthLayout
      style={{
        background: '#080c14',
        minHeight: '100vh',
      }}
    >
      {/* ── Shared styles ────────────────────────── */}
      <style>{`
        /* Force Landing-page dark background regardless of AuthLayout defaults */
        html, body { background: #080c14 !important; }

        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        /* Grain overlay — identical to Landing */
        .sr-grain::before {
          content: '';
          position: fixed;
          inset: -200%;
          width: 400%;
          height: 400%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          animation: sr-grain-move 0.5s steps(1) infinite;
          pointer-events: none;
          z-index: 0;
          opacity: 0.35;
        }
        @keyframes sr-grain-move {
          0%,100%{transform:translate(0,0)}
          10%{transform:translate(-2%,-3%)}
          30%{transform:translate(3%,2%)}
          50%{transform:translate(-1%,4%)}
          70%{transform:translate(4%,-1%)}
          90%{transform:translate(-3%,3%)}
        }

        /* Shimmer headline — matches Landing hero text treatment */
        @keyframes sr-shimmer {
          from { background-position: -200% center; }
          to   { background-position:  200% center; }
        }
        .sr-shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #a5b4fc 40%, #fff 60%, #c4b5fd 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: sr-shimmer 4s linear infinite;
        }

        /* Slide-up entrance — identical keyframe to Landing */
        @keyframes sr-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .sr-slide-up   { animation: sr-slide-up 0.55s ease both; }
        .sr-delay-1    { animation-delay: 0.10s; }
        .sr-delay-2    { animation-delay: 0.20s; }
        .sr-delay-3    { animation-delay: 0.32s; }

        /* Card lift on hover — mirrors Landing .card-glow */
        .sr-role-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .sr-role-card:hover {
          transform: translateY(-5px);
        }

        /* Perks check animation */
        .sr-perk { transition: color 0.2s ease; }
        .sr-role-card:hover .sr-perk { color: rgba(255,255,255,0.85); }
      `}</style>

      {/* Grain — same as Landing */}
      <div className="sr-grain" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Mesh background blobs — lifted from Landing hero ───── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 500, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.13) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-5%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', left: '-5%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%)',
          filter: 'blur(45px)',
        }} />
      </div>

      {/* ── Page content ─────────────────────────────────────────── */}
      <div className="relative w-full max-w-2xl px-4" style={{ zIndex: 1 }}>

        {/* ── Logo mark — matches Landing nav logo ─────────────── */}
        <div className="sr-slide-up flex justify-center mb-10">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 18px', borderRadius: 40,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}>
            <div style={{
              height: 28, width: 28, borderRadius: 8,
              background: '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Rocket style={{ height: 14, width: 14, color: '#fff' }} />
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.02em' }}>
              StartupLabs
            </span>
          </div>
        </div>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="sr-slide-up sr-delay-1 text-center mb-10">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            marginBottom: 20, padding: '6px 14px', borderRadius: 99,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#a5b4fc',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            <Sparkles style={{ height: 11, width: 11 }} />
            One last step
          </div>

          <h1
            className="sr-shimmer-text"
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(2.4rem, 6vw, 3.25rem)',
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              marginBottom: 14,
            }}
          >
            Who are you?
          </h1>

          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
            color: 'rgba(255,255,255,0.42)',
            maxWidth: 340,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Choose your role so we can personalise your StartupLabs experience from day one.
          </p>
        </div>

        {/* ── Role cards ───────────────────────────────────────── */}
        <div className="sr-slide-up sr-delay-2" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {roles.map(({ value, label, tagline, description, perks, icon: Icon, accent, glow, iconBg }) => {
            const isPending = pending === value;
            const isDisabled = pending !== null && !isPending;
            const isHot = hovered === value || isPending;

            return (
              <button
                key={value}
                type="button"
                onClick={() => handleSelect(value)}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(null)}
                disabled={pending !== null}
                className={cn('sr-role-card group relative overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2', isDisabled && 'opacity-40 pointer-events-none')}
                style={{
                  background: 'rgba(255,255,255,0.035)',
                  border: `1px solid ${isHot ? accent + '50' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isHot ? `0 0 0 1px ${accent}30, 0 24px 64px -16px ${glow}` : 'none',
                  padding: '1.75rem',
                  cursor: 'pointer',
                  focusVisibleOutlineColor: accent,
                }}
              >
                {/* Inner gradient mesh — matches Landing feature cards */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: isHot
                      ? `radial-gradient(ellipse at 30% 20%, ${accent}18 0%, transparent 65%)`
                      : 'transparent',
                    transition: 'background 0.35s ease',
                  }}
                />

                {/* Top accent line — Landing-style */}
                <div aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: `linear-gradient(90deg, transparent, ${accent}90, transparent)`,
                  opacity: isHot ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }} />

                {/* Card body */}
                <div className="relative" style={{ fontFamily: 'DM Sans, sans-serif' }}>

                  {/* Icon row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{
                      height: 48, width: 48, borderRadius: 14,
                      background: iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 8px 24px -4px ${glow}`,
                    }}>
                      <Icon style={{ height: 22, width: 22, color: '#fff' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isPending && <Loader2 style={{ height: 14, width: 14, color: accent, animation: 'spin 1s linear infinite' }} />}
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                        padding: '4px 10px', borderRadius: 99,
                        background: `${accent}15`,
                        color: accent,
                        border: `1px solid ${accent}28`,
                      }}>
                        {value}
                      </span>
                    </div>
                  </div>

                  {/* Text */}
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
                    {tagline}
                  </p>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.025em', color: '#fff', marginBottom: 8 }}>
                    {label}
                  </h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.42)', marginBottom: 22 }}>
                    {description}
                  </p>

                  {/* Perks — Landing check-list style */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {perks.map(perk => (
                      <li key={perk} className="sr-perk" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.58)' }}>
                        <span style={{
                          height: 18, width: 18, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: `${accent}18`,
                          border: `1px solid ${accent}38`,
                        }}>
                          <Check style={{ height: 10, width: 10, color: accent }} />
                        </span>
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {/* CTA row — matches Landing card "Learn more" row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 600, color: accent,
                    opacity: isHot ? 1 : 0.55,
                    transition: 'opacity 0.25s ease',
                  }}>
                    {isPending ? 'Setting up…' : `Continue as ${label}`}
                    <ArrowRight style={{
                      height: 14, width: 14,
                      transform: isHot ? 'translateX(4px)' : 'translateX(0)',
                      transition: 'transform 0.25s ease',
                    }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Divider stats strip — Landing-style trust signal ──── */}
        <div
          className="sr-slide-up sr-delay-3"
          style={{
            marginTop: 36,
            padding: '18px 24px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {[
            { value: '200+', label: 'Companies' },
            { value: '$50M+', label: 'Funding raised' },
            { value: '500+', label: 'Mentors' },
            { value: '45+', label: 'Cities' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>{stat.value}</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Admin link ───────────────────────────────────────── */}
        <p
          className="sr-slide-up sr-delay-3"
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 12,
            color: 'rgba(255,255,255,0.28)',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Setting up the workspace?{' '}
          <a
            href="/admin-sign-up"
            style={{ color: 'rgba(255,255,255,0.45)', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            Create the Super Admin account →
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}