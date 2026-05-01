import { useState, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useInvokeEdge } from '@/lib/invoke-edge';
import {
  Loader2, User, BookOpen, Building2, ArrowRight, ArrowLeft,
  Rocket, Globe, Twitter, Linkedin, Github, Check, Camera,
  Sparkles, Target, Briefcase, MapPin, Tag,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────────────── */
const levels = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD'];
const departments = [
  'Computer Science', 'Business Administration', 'Engineering',
  'Design', 'Marketing', 'Finance', 'Other',
];
const STUDENT_SKILLS = [
  'React', 'Node.js', 'Python', 'UI/UX', 'Product', 'Machine Learning',
  'Mobile Dev', 'Data Science', 'Blockchain', 'DevOps', 'Marketing', 'Sales',
  'Finance', 'Legal', 'Hardware', 'No-Code',
];
const MENTOR_EXPERTISE = [
  'Fundraising', 'Product Strategy', 'Go-to-Market', 'Technical Architecture',
  'Team Building', 'Growth Hacking', 'B2B Sales', 'UX Research', 'Financial Modelling',
  'Legal & IP', 'Operations', 'Marketing', 'AI/ML', 'Hardware', 'EdTech', 'HealthTech',
];
const STARTUP_STAGES = ['Idea', 'MVP', 'Pre-seed', 'Seed', 'Series A+', 'Bootstrapped'];

/* ─── Step config ──────────────────────────────────────────────── */
type Step = 'identity' | 'details' | 'extras';

const STUDENT_STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'identity', label: 'Identity',  icon: User       },
  { id: 'details',  label: 'Background', icon: BookOpen  },
  { id: 'extras',   label: 'Startup',    icon: Rocket    },
];
const MENTOR_STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'identity', label: 'Identity',   icon: User      },
  { id: 'details',  label: 'Background', icon: Briefcase },
  { id: 'extras',   label: 'Expertise',  icon: Target    },
];
const ADMIN_STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'details',  label: 'Details',  icon: Briefcase },
];

/* ─── Component ─────────────────────────────────────────────────── */
export default function CompleteProfile() {
  const { user: clerkUser } = useUser();
  const { role } = useAuth();
  const { toast } = useToast();
  const invoke = useInvokeEdge();
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isStudent = role === 'student';
  const isMentor  = role === 'mentor';
  const steps = isStudent ? STUDENT_STEPS : isMentor ? MENTOR_STEPS : ADMIN_STEPS;
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const accent = isStudent ? '#6366f1' : isMentor ? '#10b981' : '#f59e0b';
  const accentGlow = isStudent ? 'rgba(99,102,241,0.35)' : isMentor ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)';
  const accentLight = isStudent ? '#a5b4fc' : isMentor ? '#6ee7b7' : '#fcd34d';
  const btnGradient = isStudent
    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
    : isMentor
      ? 'linear-gradient(135deg,#059669,#10b981)'
      : 'linear-gradient(135deg,#d97706,#f59e0b)';

  const [form, setForm] = useState({
    full_name:   clerkUser?.fullName || '',
    bio:         '',
    location:    '',
    website:     '',
    twitter:     '',
    linkedin:    '',
    github:      '',
    level:       '',
    department:  '',
    skills:      [] as string[],
    startup_name: '',
    startup_stage: '',
    startup_idea: '',
  });

  const set = (k: keyof typeof form) => (v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleSkill = (s: string) =>
    setForm(f => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s],
    }));

  /* step validation */
  const stepValid = () => {
    if (currentStep.id === 'identity') return form.full_name.trim().length > 1 && form.bio.trim().length > 10;
    if (currentStep.id === 'details') {
      if (isStudent) return !!form.level && !!form.department;
      if (isMentor)  return !!form.department;
      return true;
    }
    return true;
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!clerkUser) return;
    setLoading(true);
    try {
      const res = await invoke('manage-profile', {
        full_name:   form.full_name.trim(),
        bio:         form.bio.trim(),
        location:    form.location,
        website:     form.website,
        twitter:     form.twitter,
        linkedin:    form.linkedin,
        github:      form.github,
        level:       isStudent ? form.level : null,
        department:  (isStudent || isMentor) ? form.department : null,
        skills:      form.skills,
        startup_name:  isStudent ? form.startup_name : null,
        startup_stage: isStudent ? form.startup_stage : null,
        startup_idea:  isStudent ? form.startup_idea  : null,
        profile_completed: true,
      });
      if (res.error) throw res.error;
      toast({ title: 'Profile completed!', description: 'Welcome to StartupLabs.' });
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const initials = form.full_name
    ? form.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : (clerkUser?.firstName?.[0] || '?').toUpperCase();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#080c14', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

        @keyframes cp-grain {
          0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)}
          30%{transform:translate(3%,2%)}   50%{transform:translate(-1%,4%)}
          70%{transform:translate(4%,-1%)}  90%{transform:translate(-3%,3%)}
        }
        .cp-grain::before {
          content:''; position:fixed; inset:-200%; width:400%; height:400%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          animation:cp-grain .5s steps(1) infinite; pointer-events:none; z-index:0; opacity:.35;
        }
        @keyframes cp-up {
          from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}
        }
        .cp-up { animation: cp-up .45s ease both; }
        .cp-up-1 { animation-delay:.05s }
        .cp-up-2 { animation-delay:.12s }
        .cp-up-3 { animation-delay:.20s }
        .cp-up-4 { animation-delay:.28s }

        @keyframes cp-shimmer {
          from{background-position:-200% center} to{background-position:200% center}
        }

        .cp-input {
          width:100%; background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.10);
          border-radius:.75rem; color:#f1f5f9;
          font-size:.875rem; padding:.65rem .9rem;
          font-family:'DM Sans',sans-serif;
          transition:border-color .2s,box-shadow .2s,background .2s;
          outline:none;
        }
        .cp-input:focus {
          border-color: var(--cp-accent);
          box-shadow: 0 0 0 3px var(--cp-glow);
          background: rgba(255,255,255,0.07);
        }
        .cp-input::placeholder { color:rgba(241,245,249,.22); }
        .cp-textarea { resize:vertical; min-height:90px; }

        .cp-select {
          appearance:none; cursor:pointer;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(241,245,249,0.4)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right .85rem center;
          padding-right:2.2rem;
        }
        .cp-select option { background:#0f1623; }

        .cp-tag {
          display:inline-flex; align-items:center; gap:5px;
          padding:5px 12px; border-radius:9999px; font-size:.75rem; font-weight:600;
          cursor:pointer; transition:all .18s; user-select:none;
          border:1px solid rgba(255,255,255,0.1);
          color:rgba(241,245,249,.55); background:rgba(255,255,255,0.04);
        }
        .cp-tag:hover { border-color:var(--cp-accent); color:rgba(241,245,249,.85); }
        .cp-tag.selected {
          background:var(--cp-tag-bg); border-color:var(--cp-accent);
          color:var(--cp-accent-light);
        }

        .cp-btn {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:.8rem 1.5rem; border-radius:.75rem;
          font-family:'DM Sans',sans-serif; font-weight:600; font-size:.9rem;
          border:none; cursor:pointer; transition:all .2s;
          letter-spacing:.01em;
        }
        .cp-btn-primary {
          background:var(--cp-btn-gradient);
          color:#fff;
          box-shadow:0 8px 28px -6px var(--cp-glow);
        }
        .cp-btn-primary:hover:not(:disabled) {
          filter:brightness(1.12); transform:translateY(-1px);
          box-shadow:0 12px 36px -6px var(--cp-glow);
        }
        .cp-btn-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; }
        .cp-btn-ghost {
          background:rgba(255,255,255,.05); color:rgba(241,245,249,.55);
          border:1px solid rgba(255,255,255,.09);
        }
        .cp-btn-ghost:hover { background:rgba(255,255,255,.09); color:rgba(241,245,249,.85); }

        .cp-step-dot {
          transition:all .3s; cursor:default;
        }
        .cp-social-icon { flex-shrink:0; color:rgba(241,245,249,.35); }
        .cp-label {
          display:flex; align-items:center; gap:6px;
          font-size:.7rem; font-weight:700; text-transform:uppercase;
          letter-spacing:.09em; color:rgba(241,245,249,.42); margin-bottom:6px;
        }
        .cp-section-divider {
          height:1px; background:rgba(255,255,255,.06); margin:4px 0 16px;
        }
        .cp-progress-track {
          height:2px; background:rgba(255,255,255,.07); border-radius:9999px; overflow:hidden;
        }
        .cp-progress-fill {
          height:100%; border-radius:9999px; transition:width .4s ease;
          background:var(--cp-btn-gradient);
        }
        @keyframes cp-avatar-pulse {
          0%,100%{box-shadow:0 0 0 0 var(--cp-glow)} 50%{box-shadow:0 0 0 8px transparent}
        }
        .cp-avatar-ring:hover { animation:cp-avatar-pulse .8s ease; }
      `}</style>

      {/* CSS variable injection */}
      <style>{`
        :root {
          --cp-accent: ${accent};
          --cp-accent-light: ${accentLight};
          --cp-glow: ${accentGlow};
          --cp-tag-bg: ${accent}18;
          --cp-btn-gradient: ${btnGradient};
        }
      `}</style>

      <div className="cp-grain" />

      {/* Ambient orbs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{
          position:'absolute', top:'-8%', left:'50%', transform:'translateX(-50%)',
          width:600, height:500, borderRadius:'50%',
          background:`radial-gradient(ellipse, ${accent}14 0%, transparent 65%)`,
          filter:'blur(60px)',
        }} />
        <div style={{
          position:'absolute', bottom:'5%', right:'5%',
          width:300, height:300, borderRadius:'50%',
          background:`radial-gradient(circle, ${accent}0d 0%, transparent 70%)`,
          filter:'blur(50px)',
        }} />
      </div>

      {/* Logo */}
      <div className="cp-up relative z-10 mb-8 flex items-center gap-2.5">
        <div style={{ height:32, width:32, borderRadius:9, background:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Rocket style={{ height:15, width:15, color:'#fff' }} />
        </div>
        <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.05rem', color:'#fff', letterSpacing:'-0.02em' }}>
          StartupLabs
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full" style={{ maxWidth:520 }}>

        {/* Step progress */}
        <div className="cp-up cp-up-1 mb-6">
          {/* Labels row */}
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            {steps.map((s, i) => {
              const Icon = s.icon;
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <div key={s.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <div style={{
                    height:32, width:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    background: done ? accent : active ? `${accent}22` : 'rgba(255,255,255,0.06)',
                    border: active ? `1.5px solid ${accent}` : done ? 'none' : '1.5px solid rgba(255,255,255,0.10)',
                    transition:'all .3s',
                  }}>
                    {done
                      ? <Check style={{ height:13, width:13, color:'#fff' }} />
                      : <Icon style={{ height:13, width:13, color: active ? accent : 'rgba(255,255,255,0.3)' }} />
                    }
                  </div>
                  <span style={{
                    fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
                    color: active ? accentLight : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                    transition:'color .3s',
                  }}>{s.label}</span>
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="cp-progress-track">
            <div className="cp-progress-fill" style={{ width: `${((stepIndex) / (steps.length - 1)) * 100}%` }} />
          </div>
        </div>

        {/* Main card */}
        <div className="cp-up cp-up-2" style={{
          background:'rgba(255,255,255,0.035)',
          border:'1px solid rgba(255,255,255,0.09)',
          borderRadius:'1.25rem',
          boxShadow:`0 30px 80px -20px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04)`,
          backdropFilter:'blur(24px)',
          overflow:'hidden',
          position:'relative',
        }}>
          {/* Top accent line */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:2,
            background:`linear-gradient(90deg,transparent,${accent},transparent)`,
          }} />

          <div style={{ padding:'2rem' }}>

            {/* Step heading */}
            <div className="cp-up cp-up-3" style={{ marginBottom:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span style={{
                  fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
                  padding:'3px 10px', borderRadius:99,
                  background:`${accent}18`, color:accent, border:`1px solid ${accent}28`,
                }}>
                  Step {stepIndex + 1} of {steps.length}
                </span>
              </div>
              <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#f1f5f9', letterSpacing:'-0.025em', margin:0 }}>
                {currentStep.id === 'identity' && 'Who are you?'}
                {currentStep.id === 'details'  && (isStudent ? 'Your academic background' : isMentor ? 'Your professional background' : 'Your details')}
                {currentStep.id === 'extras'   && (isStudent ? 'Your startup idea' : 'Your expertise')}
              </h2>
              <p style={{ fontSize:'.82rem', color:'rgba(241,245,249,.38)', marginTop:4, lineHeight:1.5 }}>
                {currentStep.id === 'identity' && 'Tell us about yourself. This appears on your public profile.'}
                {currentStep.id === 'details'  && (isStudent ? 'Help us match you with the right mentor.' : isMentor ? 'Share your background so students know who they\'re working with.' : 'A few more details to complete your setup.')}
                {currentStep.id === 'extras'   && (isStudent ? 'What are you building? Be as specific as you like.' : 'Select areas where you can add the most value.')}
              </p>
            </div>

            {/* ── STEP 1: Identity ───────────────────────────────── */}
            {currentStep.id === 'identity' && (
              <div className="cp-up cp-up-4" style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Avatar */}
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:4 }}>
                  <div
                    className="cp-avatar-ring"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      height:68, width:68, borderRadius:'50%', flexShrink:0,
                      background: avatarPreview ? 'none' : `linear-gradient(135deg,${accent}44,${accent}22)`,
                      border:`2px solid ${accent}55`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', position:'relative', overflow:'hidden',
                    }}
                  >
                    {avatarPreview
                      ? <img src={avatarPreview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:accentLight }}>{initials}</span>
                    }
                    <div style={{
                      position:'absolute', inset:0, background:'rgba(0,0,0,0.45)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      opacity:0, transition:'opacity .2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    >
                      <Camera style={{ height:18, width:18, color:'#fff' }} />
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display:'none' }} />
                  <div>
                    <p style={{ fontSize:'.82rem', fontWeight:600, color:'rgba(241,245,249,.7)', margin:0 }}>Profile photo</p>
                    <p style={{ fontSize:'.75rem', color:'rgba(241,245,249,.3)', margin:'3px 0 0' }}>Click to upload · JPG, PNG up to 4 MB</p>
                  </div>
                </div>

                <div>
                  <label className="cp-label"><User style={{ height:11, width:11 }} />Full Name</label>
                  <input
                    className="cp-input"
                    placeholder="Your full name"
                    value={form.full_name}
                    onChange={e => set('full_name')(e.target.value)}
                  />
                </div>

                <div>
                  <label className="cp-label"><Sparkles style={{ height:11, width:11 }} />Bio</label>
                  <textarea
                    className="cp-input cp-textarea"
                    placeholder={
                      isStudent ? 'Tell us about your interests, skills, and what you want to build...'
                      : isMentor ? 'Describe your expertise, career highlights, and how you help founders...'
                      : 'Brief description of your admin role...'
                    }
                    value={form.bio}
                    onChange={e => set('bio')(e.target.value)}
                  />
                  <p style={{ fontSize:'.7rem', color:'rgba(241,245,249,.25)', marginTop:4 }}>
                    {form.bio.length}/280 characters
                  </p>
                </div>

                <div>
                  <label className="cp-label"><MapPin style={{ height:11, width:11 }} />Location <span style={{ opacity:.5, fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                  <input
                    className="cp-input"
                    placeholder="e.g. Lagos, Nigeria"
                    value={form.location}
                    onChange={e => set('location')(e.target.value)}
                  />
                </div>

                {/* Social links */}
                <div>
                  <label className="cp-label" style={{ marginBottom:10 }}><Globe style={{ height:11, width:11 }} />Links <span style={{ opacity:.5, fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[
                      { icon: Globe,    key: 'website',  ph: 'yoursite.com' },
                      { icon: Twitter,  key: 'twitter',  ph: '@handle' },
                      { icon: Linkedin, key: 'linkedin', ph: 'linkedin.com/in/you' },
                      { icon: Github,   key: 'github',   ph: 'github.com/you' },
                    ].map(({ icon: Icon, key, ph }) => (
                      <div key={key} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Icon className="cp-social-icon" style={{ height:15, width:15 }} />
                        <input
                          className="cp-input"
                          style={{ flex:1, padding:'.55rem .85rem' }}
                          placeholder={ph}
                          value={(form as any)[key]}
                          onChange={e => set(key as any)(e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Details ────────────────────────────────── */}
            {currentStep.id === 'details' && (
              <div className="cp-up cp-up-4" style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {(isStudent || isMentor) && (
                  <div>
                    <label className="cp-label"><Building2 style={{ height:11, width:11 }} />Department / Industry</label>
                    <select
                      className="cp-input cp-select"
                      value={form.department}
                      onChange={e => set('department')(e.target.value)}
                    >
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}

                {isStudent && (
                  <div>
                    <label className="cp-label"><BookOpen style={{ height:11, width:11 }} />Academic Level</label>
                    <select
                      className="cp-input cp-select"
                      value={form.level}
                      onChange={e => set('level')(e.target.value)}
                    >
                      <option value="">Select your level</option>
                      {levels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}

                {/* Skills / expertise tags */}
                <div>
                  <label className="cp-label" style={{ marginBottom:10 }}>
                    <Tag style={{ height:11, width:11 }} />
                    {isStudent ? 'Your skills' : 'Areas you work in'}
                    <span style={{ opacity:.5, fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:4 }}>(pick up to 6)</span>
                  </label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                    {(isStudent ? STUDENT_SKILLS : MENTOR_EXPERTISE).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => form.skills.length < 6 || form.skills.includes(s) ? toggleSkill(s) : null}
                        className={`cp-tag${form.skills.includes(s) ? ' selected' : ''}`}
                      >
                        {form.skills.includes(s) && <Check style={{ height:9, width:9 }} />}
                        {s}
                      </button>
                    ))}
                  </div>
                  {form.skills.length > 0 && (
                    <p style={{ fontSize:'.72rem', color:accentLight, marginTop:8 }}>
                      {form.skills.length} selected
                    </p>
                  )}
                </div>

                {isMentor && (
                  <div style={{
                    background:`${accent}0d`, border:`1px solid ${accent}22`,
                    borderRadius:'.85rem', padding:'1rem',
                  }}>
                    <p style={{ fontSize:'.78rem', fontWeight:600, color:accentLight, margin:'0 0 4px' }}>
                      💡 Mentor tip
                    </p>
                    <p style={{ fontSize:'.78rem', color:'rgba(241,245,249,.45)', margin:0, lineHeight:1.55 }}>
                      Founders search for mentors by skill. The more specific you are, the better your matches.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Extras ─────────────────────────────────── */}
            {currentStep.id === 'extras' && (
              <div className="cp-up cp-up-4" style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {isStudent && (
                  <>
                    <div>
                      <label className="cp-label"><Rocket style={{ height:11, width:11 }} />Startup name <span style={{ opacity:.5, fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                      <input
                        className="cp-input"
                        placeholder="What's your startup called?"
                        value={form.startup_name}
                        onChange={e => set('startup_name')(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="cp-label" style={{ marginBottom:10 }}><Target style={{ height:11, width:11 }} />Startup stage</label>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                        {STARTUP_STAGES.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, startup_stage: f.startup_stage === s ? '' : s }))}
                            className={`cp-tag${form.startup_stage === s ? ' selected' : ''}`}
                          >
                            {form.startup_stage === s && <Check style={{ height:9, width:9 }} />}
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="cp-label"><Sparkles style={{ height:11, width:11 }} />Startup idea / one-liner</label>
                      <textarea
                        className="cp-input cp-textarea"
                        style={{ minHeight:80 }}
                        placeholder="e.g. AI-powered inventory management for small retailers in West Africa..."
                        value={form.startup_idea}
                        onChange={e => set('startup_idea')(e.target.value)}
                      />
                    </div>

                    <div style={{
                      background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)',
                      borderRadius:'.85rem', padding:'1rem',
                    }}>
                      <p style={{ fontSize:'.78rem', fontWeight:600, color:'#a5b4fc', margin:'0 0 4px' }}>
                        🚀 What happens next
                      </p>
                      <p style={{ fontSize:'.78rem', color:'rgba(241,245,249,.45)', margin:0, lineHeight:1.55 }}>
                        We'll auto-match you with a mentor based on your idea and skills. You can also browse and request mentors directly from the dashboard.
                      </p>
                    </div>
                  </>
                )}

                {isMentor && (
                  <>
                    <div>
                      <label className="cp-label" style={{ marginBottom:10 }}>
                        <Target style={{ height:11, width:11 }} />
                        Deep expertise <span style={{ opacity:.5, fontWeight:400, textTransform:'none', letterSpacing:0 }}>(pick your top 4)</span>
                      </label>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                        {MENTOR_EXPERTISE.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => form.skills.length < 4 || form.skills.includes(s) ? toggleSkill(s) : null}
                            className={`cp-tag${form.skills.includes(s) ? ' selected' : ''}`}
                          >
                            {form.skills.includes(s) && <Check style={{ height:9, width:9 }} />}
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{
                      background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)',
                      borderRadius:'.85rem', padding:'1rem',
                    }}>
                      <p style={{ fontSize:'.78rem', fontWeight:600, color:'#6ee7b7', margin:'0 0 4px' }}>
                        🎯 Your impact
                      </p>
                      <p style={{ fontSize:'.78rem', color:'rgba(241,245,249,.45)', margin:0, lineHeight:1.55 }}>
                        You'll be matched with 1–3 student founders per cohort. Expect 2–4 hours/month of async feedback and one live session per milestone.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display:'flex', gap:10, marginTop:'1.75rem' }}>
              {stepIndex > 0 && (
                <button
                  className="cp-btn cp-btn-ghost"
                  onClick={() => setStepIndex(i => i - 1)}
                  style={{ width:'auto', paddingLeft:'1.1rem', paddingRight:'1.1rem', flexShrink:0 }}
                >
                  <ArrowLeft style={{ height:15, width:15 }} />
                  Back
                </button>
              )}
              <button
                className="cp-btn cp-btn-primary"
                disabled={!stepValid() || loading}
                onClick={() => isLastStep ? handleSubmit() : setStepIndex(i => i + 1)}
              >
                {loading ? (
                  <><Loader2 style={{ height:15, width:15, animation:'spin 1s linear infinite' }} />Saving…</>
                ) : isLastStep ? (
                  <><Sparkles style={{ height:15, width:15 }} />Launch Dashboard</>
                ) : (
                  <>Next<ArrowRight style={{ height:15, width:15 }} /></>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Footer note */}
        <p className="cp-up cp-up-4" style={{ textAlign:'center', fontSize:'.72rem', color:'rgba(255,255,255,.2)', marginTop:20, fontFamily:'DM Sans,sans-serif' }}>
          You can update your profile anytime from settings.
        </p>
      </div>
    </div>
  );
}