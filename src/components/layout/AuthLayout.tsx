import { Rocket } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: '#080c14' }}
    >
      {/* Grain overlay — matches Landing page */}
      <style>{`
        @keyframes auth-grain {
          0%,100%{transform:translate(0,0)}
          10%{transform:translate(-2%,-3%)}
          30%{transform:translate(3%,2%)}
          50%{transform:translate(-1%,4%)}
          70%{transform:translate(4%,-1%)}
          90%{transform:translate(-3%,3%)}
        }
        .auth-grain::before {
          content:''; position:fixed; inset:-200%;
          width:400%; height:400%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          animation: auth-grain 0.5s steps(1) infinite;
          pointer-events: none; z-index: 1; opacity: 0.35;
        }
      `}</style>
      <div className="auth-grain" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Mesh gradient blobs — matches Landing page hero */}
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

      <div className="relative z-10 w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}