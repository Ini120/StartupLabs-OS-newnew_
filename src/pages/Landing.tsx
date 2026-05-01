import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Rocket, Zap, Users, TrendingUp, CheckCircle,
  MessageSquare, Calendar, Star, ArrowUpRight, ChevronRight,
  Play, Shield, Globe
} from 'lucide-react';

/* ─── Feature data ─────────────────────────────────────────── */
const features = [
  {
    icon: Calendar,
    tag: 'Track',
    title: 'Milestone Tracking',
    description: 'Set goals, track progress in real-time, and celebrate every win with your team.',
    accent: '#6366f1',
  },
  {
    icon: Users,
    tag: 'Connect',
    title: 'Team Collaboration',
    description: 'Connect with mentors, investors, and co-founders. Build your dream team.',
    accent: '#0ea5e9',
  },
  {
    icon: TrendingUp,
    tag: 'Grow',
    title: 'Growth Analytics',
    description: 'Monitor the metrics that matter. Get actionable insights to accelerate growth.',
    accent: '#10b981',
  },
  {
    icon: MessageSquare,
    tag: 'Communicate',
    title: 'Live Messaging',
    description: 'Real-time communication with mentors and team members — no delays.',
    accent: '#f59e0b',
  },
  {
    icon: Shield,
    tag: 'Secure',
    title: 'Document Storage',
    description: 'Organize, share, and protect documents, contracts, and resources securely.',
    accent: '#ec4899',
  },
  {
    icon: Rocket,
    tag: 'Launch',
    title: 'Launch Support',
    description: 'Step-by-step guidance from idea to launch, backed by real mentorship.',
    accent: '#8b5cf6',
  },
];

const stats = [
  { value: '200+', label: 'Companies' },
  { value: '$50M+', label: 'Funding Raised' },
  { value: '500+', label: 'Mentors' },
  { value: '45+', label: 'Cities' },
];

const testimonials = [
  {
    quote: "StartupLabs gave us the structure we needed to move from idea to seed in under 6 months.",
    name: "Amaka Osei",
    role: "CEO, Payd Africa",
    initials: "AO",
    color: "bg-indigo-500",
  },
  {
    quote: "The milestone tracker alone saved us 10+ hours a week of spreadsheet juggling.",
    name: "Damilola Bello",
    role: "CTO, LogiStack",
    initials: "DB",
    color: "bg-emerald-500",
  },
  {
    quote: "Our mentor matched us on day one. We raised our pre-seed 3 months later.",
    name: "Chisom Nwachukwu",
    role: "Founder, FarmFlow",
    initials: "CN",
    color: "bg-amber-500",
  },
];

/* ─── Component ─────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: '#080c14',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Google font import via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          70% { transform: scale(1.05); opacity: 0.2; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        @keyframes slide-up {
          from { opacity:0; transform: translateY(28px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes grain {
          0%,100%{transform:translate(0,0)}
          10%{transform:translate(-2%,-3%)}
          30%{transform:translate(3%,2%)}
          50%{transform:translate(-1%,4%)}
          70%{transform:translate(4%,-1%)}
          90%{transform:translate(-3%,3%)}
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s ease forwards; }
        .animate-slide-up-delay-1 { animation: slide-up 0.6s 0.1s ease both; }
        .animate-slide-up-delay-2 { animation: slide-up 0.6s 0.2s ease both; }
        .animate-slide-up-delay-3 { animation: slide-up 0.6s 0.35s ease both; }
        .grain::before {
          content:''; position:fixed; inset:-200%;
          width:400%; height:400%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          animation: grain 0.5s steps(1) infinite;
          pointer-events: none; z-index:1; opacity:0.35;
        }
        .card-glow:hover { box-shadow: 0 0 0 1px rgba(99,102,241,0.4), 0 20px 60px -10px rgba(99,102,241,0.15); }
      `}</style>

      <div className="grain" />

      {/* ── NAVIGATION ──────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Rocket className="h-4.5 w-4.5 text-white" style={{ height: 18, width: 18 }} />
            </div>
            <span className="font-display text-lg font-bold text-white tracking-tight">StartupLabs</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {['Features', 'Pricing', 'Blog', 'About'].map(item => (
              <a key={item} href="#" className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/8">
              <Link to="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm"
              className="bg-indigo-500 hover:bg-indigo-400 text-white border-0 shadow-lg shadow-indigo-500/30 rounded-lg"
            >
              <Link to="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* mesh gradient bg */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: '-20%', left: '30%',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '0%', right: '10%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 lg:pt-32 lg:pb-28" style={{ zIndex: 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* LEFT */}
            <div className="space-y-8">
              <div className="animate-slide-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Now live in 45+ cities worldwide
              </div>

              <div className="animate-slide-up-delay-1 space-y-4">
                <h1 className="font-display leading-none" style={{ fontSize: 'clamp(2.8rem,6vw,5rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  Build your
                  <br />
                  <span style={{
                    background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    startup
                  </span>
                  <br />
                  from zero.
                </h1>
                <p className="text-base leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Connect with mentors, track milestones, and build something remarkable. The all-in-one platform for ambitious founders.
                </p>
              </div>

              <div className="animate-slide-up-delay-2 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg"
                  className="h-12 px-6 rounded-xl gap-2 font-semibold text-sm bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-xl"
                >
                  <Link to="/sign-up">
                    Start for free <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost"
                  className="h-12 px-6 rounded-xl gap-2 font-medium text-sm text-white/70 hover:text-white hover:bg-white/8"
                >
                  <Link to="/sign-in">
                    <Play className="h-4 w-4" /> Watch demo
                  </Link>
                </Button>
              </div>

              {/* Mini stats */}
              <div className="animate-slide-up-delay-3 flex items-center gap-6 pt-2">
                <div className="flex -space-x-2">
                  {['#6366f1','#10b981','#f59e0b','#ec4899'].map((c, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{ background: c, borderColor: '#080c14', zIndex: 4 - i }}>
                      {['A','D','C','F'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Trusted by 5,000+ founders</p>
                </div>
              </div>
            </div>

            {/* RIGHT — Dashboard preview cards */}
            <div className="relative animate-float hidden lg:block">
              {/* glow behind */}
              <div style={{
                position: 'absolute', inset: '-10%',
                background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }} />

              <div className="relative space-y-3" style={{ transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg)' }}>
                {/* Milestone card */}
                <div className="rounded-2xl p-5" style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(20px)',
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/20">
                        <Calendar className="h-4.5 w-4.5 text-indigo-400" style={{ height: 18, width: 18 }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Q2 Milestones</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>5 of 8 goals completed</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>Active</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: '62.5%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                  </div>
                  <div className="flex justify-between mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <span>5 done</span><span>62.5%</span>
                  </div>
                </div>

                {/* Team card */}
                <div className="rounded-2xl p-5 flex items-center gap-4" style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(20px)',
                }}>
                  <div className="flex -space-x-2 shrink-0">
                    {['#6366f1','#10b981','#f59e0b'].map((c, i) => (
                      <div key={i} className="h-9 w-9 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                        style={{ background: c, borderColor: '#0d1220' }}>
                        {['AM','DB','CN'][i].charAt(0)}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">3 mentors joined</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>This week • Team growing</p>
                  </div>
                  <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Message card */}
                <div className="rounded-2xl p-5" style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(20px)',
                }}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold shrink-0">JK</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">James K. — Mentor</p>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>2m ago</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        "Great progress on your MVP! Let's schedule a review session this week."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO TICKER / STATS BAR ─────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="font-display text-3xl font-800 text-white" style={{ fontWeight: 800 }}>{s.value}</div>
                <div className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <div className="mb-16 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#818cf8' }}>Platform</p>
          <h2 className="font-display text-4xl sm:text-5xl font-800 leading-tight" style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
            Everything your startup needs
          </h2>
          <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Powerful, focused tools built for founders who move fast and build to last.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group card-glow rounded-2xl p-6 transition-all duration-300 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}30` }}>
                    <Icon className="h-5 w-5" style={{ color: f.accent }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
                    style={{ background: `${f.accent}12`, color: f.accent }}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-base text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.description}</p>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: f.accent }}>
                  Learn more <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#818cf8' }}>Testimonials</p>
            <h2 className="font-display text-4xl font-800" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              Founders love it
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl p-6" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${t.color} flex items-center justify-center text-xs font-bold shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <div className="relative overflow-hidden rounded-3xl p-12 sm:p-16 text-center"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #2d1b69 40%, #1a1a2e 100%)',
            border: '1px solid rgba(139,92,246,0.25)',
          }}>
          {/* decorative glows */}
          <div style={{
            position: 'absolute', top: '-30%', left: '20%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20%', right: '15%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,114,182,0.15) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
              <Globe className="h-3 w-3" /> No credit card required
            </div>
            <h2 className="font-display text-4xl sm:text-6xl font-800 mb-5" style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
              Ready to launch?
            </h2>
            <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Join thousands of founders already building on StartupLabs. Your next milestone is one step away.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg"
                className="h-12 px-8 rounded-xl gap-2 font-semibold text-sm bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-2xl"
              >
                <Link to="/sign-up">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost"
                className="h-12 px-8 rounded-xl font-medium text-sm hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                <Link to="/sign-in">Already have an account? <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <Rocket style={{ height: 16, width: 16 }} className="text-white" />
                </div>
                <span className="font-display font-bold text-white">StartupLabs</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Empowering the next generation of founders to build what matters.
              </p>
            </div>
            {[
              { heading: 'Product', links: ['Features', 'Pricing', 'Security', 'Changelog'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { heading: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
            ].map(col => (
              <div key={col.heading}>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>{col.heading}</h4>
                <ul className="space-y-3">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                      >{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-xs"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
            <p>© 2026 StartupLabs. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              {['Twitter', 'LinkedIn', 'GitHub'].map(s => (
                <a key={s} href="#" className="hover:text-white transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}