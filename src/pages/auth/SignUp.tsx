import { SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SignUp() {
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
        @keyframes float-glow {
          0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.8;transform:scale(1.08)}
        }
        .sl-orb { animation:float-glow 6s ease-in-out infinite; }

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
          background:linear-gradient(90deg,transparent,rgba(139,92,246,.6),transparent);
        }
        /* header */
        .cl-headerTitle {
          font-family:'Syne',sans-serif !important; font-weight:800 !important;
          font-size:1.55rem !important; letter-spacing:-.03em !important; color:#f1f5f9 !important;
        }
        .cl-headerSubtitle { color:rgba(241,245,249,.4) !important; font-size:.85rem !important; }
        /* social */
        .cl-socialButtonsBlockButton {
          background:rgba(255,255,255,.05) !important;
          border:1px solid rgba(255,255,255,.1) !important;
          border-radius:.75rem !important; color:rgba(241,245,249,.8) !important;
          font-weight:500 !important; font-size:.875rem !important; transition:all .2s !important;
        }
        .cl-socialButtonsBlockButton:hover {
          background:rgba(255,255,255,.09) !important;
          border-color:rgba(139,92,246,.4) !important; transform:translateY(-1px) !important;
        }
        .cl-socialButtonsBlockButtonText { color:rgba(241,245,249,.8) !important; }
        /* divider */
        .cl-dividerLine { background:rgba(255,255,255,.08) !important; }
        .cl-dividerText {
          color:rgba(241,245,249,.3) !important; font-size:.7rem !important;
          text-transform:uppercase; letter-spacing:.1em;
        }
        /* fields */
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
          border-color:rgba(139,92,246,.6) !important;
          box-shadow:0 0 0 3px rgba(139,92,246,.15) !important;
          background:rgba(139,92,246,.06) !important; outline:none !important;
        }
        .cl-formFieldInput::placeholder { color:rgba(241,245,249,.2) !important; }
        .cl-formFieldInputShowPasswordButton { color:rgba(241,245,249,.4) !important; }
        .cl-formFieldInputShowPasswordButton:hover { color:rgba(241,245,249,.8) !important; }
        /* primary button */
        .cl-formButtonPrimary {
          background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%) !important;
          border:none !important; border-radius:.75rem !important;
          font-weight:600 !important; font-size:.875rem !important;
          box-shadow:0 8px 24px -6px rgba(139,92,246,.5) !important;
          transition:all .2s !important; letter-spacing:.01em !important;
        }
        .cl-formButtonPrimary:hover {
          background:linear-gradient(135deg,#a78bfa 0%,#818cf8 100%) !important;
          box-shadow:0 12px 32px -6px rgba(139,92,246,.65) !important;
          transform:translateY(-1px) !important;
        }
        /* footer */
        .cl-footerActionText { color:rgba(241,245,249,.35) !important; font-size:.8rem !important; }
        .cl-footerActionLink { color:#a78bfa !important; font-weight:600 !important; transition:color .2s !important; }
        .cl-footerActionLink:hover { color:#c4b5fd !important; }
        /* errors + password strength */
        .cl-formFieldErrorText { color:#f87171 !important; font-size:.75rem !important; }
        .cl-alertText { color:#fca5a5 !important; font-size:.8rem !important; }
        .cl-passwordStrengthMeterBar { border-radius:9999px !important; }
        .cl-identityPreviewText { color:rgba(241,245,249,.7) !important; }
        .cl-identityPreviewEditButton { color:#a78bfa !important; }
      `}</style>

      <div className="sl-grain" />

      {/* ambient glows — violet-shifted for sign-up */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="sl-orb absolute" style={{
          top: '-5%', right: '20%', width: 560, height: 560, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div className="sl-orb absolute" style={{
          bottom: '5%', left: '10%', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,114,182,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)', animationDelay: '3s',
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
            Have an account?{' '}
            <Link to="/sign-in" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </div>
        </div>
      </nav>

      {/* content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd', fontFamily: 'DM Sans,sans-serif' }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse inline-block" style={{ background: '#a78bfa' }} />
            Join 5,000+ founders
          </div>
          <h1 className="sl-shimmer font-black leading-none"
            style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(2.4rem,5vw,3.5rem)', letterSpacing: '-0.035em' }}>
            Create account
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans,sans-serif' }}>
            Build your startup. Find your mentor. Ship faster.
          </p>
        </div>

        <ClerkSignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/select-role"
          appearance={{
            variables: {
              colorPrimary: '#8b5cf6',
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
      </main>

      <footer className="relative z-10 py-6 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontFamily: 'DM Sans,sans-serif' }}>
          © 2026 StartupLabs. All rights reserved.
        </p>
      </footer>
    </div>
  );
}