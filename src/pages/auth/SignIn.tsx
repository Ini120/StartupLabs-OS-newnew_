import { useState } from 'react';
import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { Rocket, ShieldCheck, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SignIn() {
  const [mode, setMode] = useState<'user' | 'mentor' | 'admin'>('user');
  const isAdmin = mode === 'admin';
  const isMentor = mode === 'mentor';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#080c14', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

        @keyframes grain {
          0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)}
          30%{transform:translate(3%,2%)}   50%{transform:translate(-1%,4%)}
          70%{transform:translate(4%,-1%)}  90%{transform:translate(-3%,3%)}
        }
        .sl-grain::before {
          content:''; position:fixed; inset:-200%; width:400%; height:400%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          animation:grain .5s steps(1) infinite; pointer-events:none; z-index:1; opacity:.35;
        }
        @keyframes shimmer {
          from{background-position:-200% center} to{background-position:200% center}
        }
        .sl-shimmer {
          background:linear-gradient(90deg,#fff 0%,#a5b4fc 40%,#fff 60%,#c4b5fd 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          animation:shimmer 4s linear infinite;
        }
        .sl-shimmer-amber {
          background:linear-gradient(90deg,#fef3c7 0%,#f59e0b 40%,#fef3c7 60%,#fbbf24 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          animation:shimmer 4s linear infinite;
        }
        @keyframes float-glow {
          0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.8;transform:scale(1.08)}
        }
        .sl-orb { animation:float-glow 6s ease-in-out infinite; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sl-fade { animation: fadeSlide .35s ease forwards; }

        /* mode toggle */
        .sl-toggle {
          display: inline-flex;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          padding: 4px;
          gap: 2px;
        }
        .sl-toggle-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 16px; border-radius: 9999px;
          font-size: .8rem; font-weight: 600; cursor: pointer;
          transition: all .25s; border: none; background: transparent;
          color: rgba(241,245,249,0.4); font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .sl-toggle-btn.active-user {
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          color: #fff;
          box-shadow: 0 4px 14px -4px rgba(99,102,241,0.6);
        }
        .sl-toggle-btn.active-admin {
          background: linear-gradient(135deg,#d97706,#f59e0b);
          color: #1c1400;
          box-shadow: 0 4px 14px -4px rgba(245,158,11,0.55);
        }
        .sl-toggle-btn.active-mentor {
          background: linear-gradient(135deg,#059669,#10b981);
          color: #fff;
          box-shadow: 0 4px 14px -4px rgba(16,185,129,0.55);
        }

        /* ── Clerk card shell ── */
        .cl-rootBox { width:100% !important; }
        .cl-card {
          background:rgba(255,255,255,0.04) !important;
          border:1px solid rgba(255,255,255,0.09) !important;
          border-radius:1.25rem !important;
          box-shadow:0 25px 80px -20px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.05) !important;
          backdrop-filter:blur(24px) !important;
          padding:2rem !important;
          position:relative; overflow:hidden;
        }
        .cl-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,var(--clerk-accent, rgba(99,102,241,.6)),transparent);
        }
        .cl-headerTitle {
          font-family:'Syne',sans-serif !important; font-weight:800 !important;
          font-size:1.55rem !important; letter-spacing:-.03em !important; color:#f1f5f9 !important;
        }
        .cl-headerSubtitle { color:rgba(241,245,249,.4) !important; font-size:.85rem !important; }
        .cl-socialButtonsBlockButton {
          background:rgba(255,255,255,.05) !important;
          border:1px solid rgba(255,255,255,.1) !important;
          border-radius:.75rem !important; color:rgba(241,245,249,.8) !important;
          font-weight:500 !important; font-size:.875rem !important; transition:all .2s !important;
        }
        .cl-socialButtonsBlockButton:hover {
          background:rgba(255,255,255,.09) !important;
          border-color:rgba(99,102,241,.4) !important; transform:translateY(-1px) !important;
        }
        .cl-socialButtonsBlockButtonText { color:rgba(241,245,249,.8) !important; }
        .cl-dividerLine { background:rgba(255,255,255,.08) !important; }
        .cl-dividerText {
          color:rgba(241,245,249,.3) !important; font-size:.7rem !important;
          text-transform:uppercase; letter-spacing:.1em;
        }
        .cl-formFieldLabel {
          color:rgba(241,245,249,.5) !important; font-size:.7rem !important;
          font-weight:600 !important; text-transform:uppercase; letter-spacing:.08em;
        }
        .cl-formFieldInput {
          background:rgba(255,255,255,.05) !important;
          border:1px solid rgba(255,255,255,.1) !important;
          border-radius:.75rem !important; color:#f1f5f9 !important;
          font-size:.875rem !important; transition:all .2s !important;
        }
        .cl-formFieldInput:focus {
          border-color:var(--clerk-focus, rgba(99,102,241,.6)) !important;
          box-shadow:0 0 0 3px var(--clerk-focus-shadow, rgba(99,102,241,.15)) !important;
          background:rgba(99,102,241,.06) !important; outline:none !important;
        }
        .cl-formFieldInput::placeholder { color:rgba(241,245,249,.2) !important; }
        .cl-formFieldInputShowPasswordButton { color:rgba(241,245,249,.4) !important; }
        .cl-formFieldInputShowPasswordButton:hover { color:rgba(241,245,249,.8) !important; }
        .cl-formButtonPrimary {
          background:var(--clerk-btn, linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)) !important;
          border:none !important; border-radius:.75rem !important;
          font-weight:600 !important; font-size:.875rem !important;
          box-shadow:var(--clerk-btn-shadow, 0 8px 24px -6px rgba(99,102,241,.5)) !important;
          transition:all .2s !important; letter-spacing:.01em !important;
        }
        .cl-formButtonPrimary:hover {
          filter: brightness(1.1) !important;
          transform:translateY(-1px) !important;
        }
        .cl-footerActionText { color:rgba(241,245,249,.35) !important; font-size:.8rem !important; }
        .cl-footerActionLink { color:#818cf8 !important; font-weight:600 !important; transition:color .2s !important; }
        .cl-footerActionLink:hover { color:#a5b4fc !important; }
        .cl-formFieldErrorText { color:#f87171 !important; font-size:.75rem !important; }
        .cl-alertText { color:#fca5a5 !important; font-size:.8rem !important; }
        .cl-identityPreviewText { color:rgba(241,245,249,.7) !important; }
        .cl-identityPreviewEditButton { color:#818cf8 !important; }
      `}</style>

      {/* Admin mode overrides injected via a style tag when active */}
      {isAdmin && (
        <style>{`
          :root {
            --clerk-accent: rgba(245,158,11,.6);
            --clerk-focus: rgba(245,158,11,.6);
            --clerk-focus-shadow: rgba(245,158,11,.15);
            --clerk-btn: linear-gradient(135deg,#d97706 0%,#f59e0b 100%);
            --clerk-btn-shadow: 0 8px 24px -6px rgba(245,158,11,.5);
          }
          .cl-card::before {
            background: linear-gradient(90deg,transparent,rgba(245,158,11,.5),transparent) !important;
          }
          .cl-footerActionLink { color:#fbbf24 !important; }
          .cl-footerActionLink:hover { color:#fde68a !important; }
        `}</style>
      )}
      {isMentor && (
        <style>{`
          :root {
            --clerk-accent: rgba(16,185,129,.6);
            --clerk-focus: rgba(16,185,129,.6);
            --clerk-focus-shadow: rgba(16,185,129,.15);
            --clerk-btn: linear-gradient(135deg,#059669 0%,#10b981 100%);
            --clerk-btn-shadow: 0 8px 24px -6px rgba(16,185,129,.5);
          }
          .cl-card::before {
            background: linear-gradient(90deg,transparent,rgba(16,185,129,.5),transparent) !important;
          }
          .cl-formFieldInput:focus {
            border-color: rgba(16,185,129,.6) !important;
            box-shadow: 0 0 0 3px rgba(16,185,129,.15) !important;
            background: rgba(16,185,129,.06) !important;
          }
          .cl-footerActionLink { color:#34d399 !important; }
          .cl-footerActionLink:hover { color:#6ee7b7 !important; }
        `}</style>
      )}

      <div className="sl-grain" />

      {/* ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="sl-orb absolute" style={{
          top: '10%', left: '25%', width: 520, height: 520, borderRadius: '50%',
          background: isAdmin
            ? 'radial-gradient(circle, rgba(217,119,6,0.13) 0%, transparent 70%)'
            : isMentor
              ? 'radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)', transition: 'background 0.5s',
        }} />
        <div className="sl-orb absolute" style={{
          bottom: '10%', right: '15%', width: 380, height: 380, borderRadius: '50%',
          background: isAdmin
            ? 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)'
            : isMentor
              ? 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)', animationDelay: '3s', transition: 'background 0.5s',
        }} />
      </div>

      {/* nav */}
      <nav className="relative z-10 border-b" style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Rocket style={{ height: 16, width: 16, color: '#fff' }} />
            </div>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em' }}>
              StartupLabs
            </span>
          </Link>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans,sans-serif' }}>
            No account?{' '}
            <Link to="/sign-up" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              Sign up →
            </Link>
          </div>
        </div>
      </nav>

      {/* content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">

        {/* Mode toggle */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="sl-toggle">
            <button
              className={`sl-toggle-btn ${mode === 'user' ? 'active-user' : ''}`}
              onClick={() => setMode('user')}
            >
              <Rocket style={{ width: 13, height: 13 }} />
              Student
            </button>
            <button
              className={`sl-toggle-btn ${mode === 'mentor' ? 'active-mentor' : ''}`}
              onClick={() => setMode('mentor')}
            >
              <Briefcase style={{ width: 13, height: 13 }} />
              Mentor
            </button>
            <button
              className={`sl-toggle-btn ${mode === 'admin' ? 'active-admin' : ''}`}
              onClick={() => setMode('admin')}
            >
              <ShieldCheck style={{ width: 13, height: 13 }} />
              Admin
            </button>
          </div>
        </div>

        {/* Heading */}
        <div className="sl-fade text-center mb-8" key={mode}>
          {isAdmin ? (
            <>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', fontFamily: 'DM Sans,sans-serif' }}>
                <ShieldCheck style={{ width: 11, height: 11 }} />
                Admin Access
              </div>
              <h1 className="sl-shimmer-amber font-black leading-none"
                style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(2.4rem,5vw,3.5rem)', letterSpacing: '-0.035em' }}>
                Admin Sign In
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>
                Access the admin dashboard to manage your workspace.
              </p>
            </>
          ) : isMentor ? (
            <>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontFamily: 'DM Sans,sans-serif' }}>
                <Briefcase style={{ width: 11, height: 11 }} />
                Mentor Portal
              </div>
              <h1 className="font-black leading-none"
                style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(2.4rem,5vw,3.5rem)', letterSpacing: '-0.035em', background: 'linear-gradient(90deg,#fff 0%,#6ee7b7 40%,#fff 60%,#34d399 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 4s linear infinite' }}>
                Mentor Sign In
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>
                Welcome back. Your students are waiting.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', fontFamily: 'DM Sans,sans-serif' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
                Welcome back
              </div>
              <h1 className="sl-shimmer font-black leading-none"
                style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(2.4rem,5vw,3.5rem)', letterSpacing: '-0.035em' }}>
                Sign in
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>
                Pick up right where you left off.
              </p>
            </>
          )}
        </div>

        <div className="sl-fade w-full flex justify-center" key={`clerk-${mode}`}>
          <ClerkSignIn
            routing="path"
            path="/sign-in"
            signUpUrl={isAdmin ? '/admin-sign-up' : '/sign-up'}
            afterSignInUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: isAdmin ? '#d97706' : isMentor ? '#10b981' : '#6366f1',
                colorBackground: 'transparent',
                colorText: '#f1f5f9',
                colorTextSecondary: 'rgba(241,245,249,0.45)',
                colorInputBackground: 'rgba(255,255,255,0.05)',
                colorInputText: '#f1f5f9',
                colorNeutral: '#94a3b8',
                colorDanger: '#f87171',
                borderRadius: '0.75rem',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              },
              elements: {
                rootBox: 'w-full max-w-md',
                card: 'shadow-none border-0',
              },
            }}
          />
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontFamily: 'DM Sans,sans-serif' }}>
          © 2026 StartupLabs. All rights reserved.
        </p>
      </footer>
    </div>
  );
}