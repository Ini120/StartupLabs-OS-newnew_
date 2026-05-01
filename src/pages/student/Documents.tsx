import { useRef, useState, useMemo } from 'react';
import {
  FileText, Upload, Download, Trash2, Search, FolderOpen,
  FileImage, FileSpreadsheet, FileCode, Archive, Film,
  Sparkles, HardDrive, Clock, Layers, ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyStartups } from '@/hooks/use-startups';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDocuments, useUploadDocument, useDownloadDocument, useDeleteDocument,
} from '@/hooks/use-documents';
import { useAuth } from '@/contexts/AuthContext';

/* ── File type helpers ───────────────────────────────────────── */
type FileGroup = 'pdf' | 'doc' | 'sheet' | 'image' | 'code' | 'archive' | 'video' | 'other';

function getFileGroup(type?: string | null): FileGroup {
  const t = (type ?? '').toLowerCase();
  if (t.includes('pdf'))                                     return 'pdf';
  if (t.includes('doc') || t.includes('ppt') || t.includes('txt')) return 'doc';
  if (t.includes('xls') || t.includes('csv'))               return 'sheet';
  if (t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('gif') || t.includes('webp')) return 'image';
  if (t.includes('zip') || t.includes('rar') || t.includes('tar')) return 'archive';
  if (t.includes('mp4') || t.includes('mov') || t.includes('avi')) return 'video';
  if (t.includes('js') || t.includes('ts') || t.includes('json') || t.includes('html') || t.includes('css')) return 'code';
  return 'other';
}

const FILE_META: Record<FileGroup, { icon: React.ElementType; color: string; label: string }> = {
  pdf:     { icon: FileText,        color: '#ef4444', label: 'PDF' },
  doc:     { icon: FileText,        color: '#6366f1', label: 'Document' },
  sheet:   { icon: FileSpreadsheet, color: '#10b981', label: 'Spreadsheet' },
  image:   { icon: FileImage,       color: '#0ea5e9', label: 'Image' },
  code:    { icon: FileCode,        color: '#f59e0b', label: 'Code' },
  archive: { icon: Archive,         color: '#8b5cf6', label: 'Archive' },
  video:   { icon: Film,            color: '#ec4899', label: 'Video' },
  other:   { icon: FileText,        color: '#94a3b8', label: 'File' },
};

function formatBytes(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Stat pill ───────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: color + '20' }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{label}</p>
        <p className="text-sm font-black text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

/* ── Doc card ────────────────────────────────────────────────── */
function DocCard({ doc, startup, isOwner, onDownload, onDelete }: {
  doc: any; startup: any; isOwner: boolean;
  onDownload: () => void; onDelete: () => void;
}) {
  const group = getFileGroup(doc.file_type);
  const meta  = FILE_META[group];
  const Icon  = meta.icon;
  const size  = formatBytes(doc.file_size);
  const ext   = (doc.file_type ?? '').toUpperCase().split('/').pop()?.split('.').pop() ?? 'FILE';

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]">
      {/* Top colour strip */}
      <div
        className="absolute left-0 top-0 h-0.5 w-full opacity-0 group-hover:opacity-60 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }}
      />

      <div className="flex items-start gap-3">
        {/* File icon */}
        <div
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/8 transition-transform duration-200 group-hover:scale-105"
          style={{ background: meta.color + '15' }}
        >
          <Icon className="h-5 w-5" style={{ color: meta.color }} />
          <span
            className="absolute -bottom-1.5 -right-1.5 rounded-md border border-white/10 bg-[#0d1117] px-1 py-0 text-[8px] font-black uppercase tracking-wide"
            style={{ color: meta.color }}
          >
            {ext.slice(0, 4)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-white leading-snug">{doc.name || 'Document'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/30">
            {startup && (
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" /> {startup.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(doc.uploaded_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {size && (
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" /> {size}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onDownload}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-white/30 transition-all hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-400"
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          {isOwner && (
            <button
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-white/20 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function Documents() {
  const { user } = useAuth();
  const { data: startups = [], isLoading: sl } = useMyStartups();
  const startupIds = startups.map(s => s.id);
  const { data: docs = [], isLoading: dl } = useDocuments(startupIds);
  const upload   = useUploadDocument();
  const download = useDownloadDocument();
  const remove   = useDeleteDocument();

  const fileRef = useRef<HTMLInputElement>(null);
  const [targetStartup, setTargetStartup] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStartup, setFilterStartup] = useState<string>('all');

  const handleSelect = () => {
    if (!targetStartup && startups.length === 1) setTargetStartup(startups[0].id);
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const startup_id = targetStartup || startups[0]?.id;
    if (!startup_id) return;
    await upload.mutateAsync({ file, startup_id });
    e.target.value = '';
  };

  /* Stats */
  const totalSize  = docs.reduce((acc, d) => acc + (d.file_size ?? 0), 0);
  const myDocsCount = docs.filter(d => d.uploaded_by === user?.id).length;
  const recentCount = docs.filter(d => {
    const diff = Date.now() - new Date(d.uploaded_at).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  /* Filtering */
  const filtered = useMemo(() => docs.filter(doc => {
    const nameOk    = !search || (doc.name ?? '').toLowerCase().includes(search.toLowerCase());
    const typeOk    = filterType === 'all' || getFileGroup(doc.file_type) === filterType;
    const startupOk = filterStartup === 'all' || doc.startup_id === filterStartup;
    return nameOk && typeOk && startupOk;
  }), [docs, search, filterType, filterStartup]);

  /* Group by startup */
  const grouped = useMemo(() => {
    const map: Record<string, typeof docs> = {};
    filtered.forEach(d => {
      const key = d.startup_id ?? 'unknown';
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [filtered]);

  const noStartup = startups.length === 0;

  if (sl || dl) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 px-1 pb-10">

      {/* ── HERO HEADER ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5">
        <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-pink-600/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-20 h-24 w-24 rounded-full bg-indigo-600/10 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-pink-500/25 bg-pink-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-pink-300">
              <Sparkles className="h-3 w-3" /> File Vault
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Documents</h1>
            <p className="mt-1 text-sm text-white/40">Upload pitch decks, contracts, and startup files.</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {startups.length > 1 && (
              <Select value={targetStartup} onValueChange={setTargetStartup}>
                <SelectTrigger className="h-9 w-[160px] rounded-xl border-white/8 bg-white/[0.04] text-sm text-white/60">
                  <SelectValue placeholder="Select startup" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1117] border-white/8">
                  {startups.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <input
              ref={fileRef} type="file" className="hidden" onChange={handleFile}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.zip,.csv"
            />
            <Button
              disabled={noStartup || upload.isPending || (startups.length > 1 && !targetStartup)}
              onClick={handleSelect}
              className="gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 shadow-lg shadow-pink-500/20"
            >
              <Upload className="h-4 w-4" />
              {upload.isPending ? 'Uploading…' : 'Upload File'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────── */}
      {docs.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill icon={FileText}  label="Total Files"  value={docs.length}     color="#6366f1" />
          <StatPill icon={HardDrive} label="Storage Used" value={formatBytes(totalSize) ?? '—'} color="#0ea5e9" />
          <StatPill icon={ArrowUpRight} label="My Uploads" value={myDocsCount}   color="#10b981" />
          <StatPill icon={Clock}     label="This Week"    value={recentCount}     color="#f59e0b" />
        </div>
      )}

      {/* ── NO STARTUP STATE ─────────────────────────────────── */}
      {noStartup && (
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-full bg-pink-600/8 blur-3xl" />
          </div>
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
              <FolderOpen className="h-7 w-7 text-white/15" />
            </div>
            <p className="font-bold text-white/50">No startup found</p>
            <p className="mt-1 text-sm text-white/25">Create a startup first to upload documents.</p>
          </div>
        </div>
      )}

      {/* ── SEARCH + FILTERS ─────────────────────────────────── */}
      {docs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search files…"
              className="h-9 w-full rounded-xl border border-white/6 bg-white/[0.03] pl-8 pr-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all"
            />
          </div>

          {/* File type filter */}
          {(['all', 'pdf', 'doc', 'sheet', 'image', 'archive'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                filterType === t
                  ? 'border-pink-500/40 bg-pink-500/15 text-pink-300'
                  : 'border-white/5 bg-white/[0.02] text-white/30 hover:border-white/10 hover:text-white/50'
              }`}
            >
              {t === 'all' ? 'All' : FILE_META[t as FileGroup]?.label ?? t}
            </button>
          ))}

          {/* Startup filter */}
          {startups.length > 1 && (
            <Select value={filterStartup} onValueChange={setFilterStartup}>
              <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-xl border-white/5 bg-white/[0.02] text-[11px] font-bold text-white/30 px-3">
                <SelectValue placeholder="All startups" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1117] border-white/8">
                <SelectItem value="all">All startups</SelectItem>
                {startups.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* ── GROUPED DOC LIST ─────────────────────────────────── */}
      {!noStartup && docs.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] py-10 text-center text-sm text-white/25">
          No files match your search or filters.
        </div>
      )}

      {Object.entries(grouped).map(([startupId, startupDocs]) => {
        const startup = startups.find(s => s.id === startupId);
        return (
          <div key={startupId} className="space-y-2">
            {/* Group label */}
            {startups.length > 1 && (
              <div className="flex items-center gap-2 px-1 mb-1">
                <Layers className="h-3.5 w-3.5 text-white/20" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/25">{startup?.name ?? 'Unknown'}</p>
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0 text-[10px] text-white/25">{startupDocs.length}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            )}

            <div className="space-y-2">
              {startupDocs.map(doc => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  startup={startup}
                  isOwner={doc.uploaded_by === user?.id}
                  onDownload={() => download.mutate(doc.id)}
                  onDelete={() => remove.mutate(doc.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* ── EMPTY STATE ──────────────────────────────────────── */}
      {!noStartup && docs.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-full bg-pink-600/8 blur-3xl" />
          </div>
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
              <FileText className="h-7 w-7 text-white/15" />
            </div>
            <p className="font-bold text-white/50">No documents yet</p>
            <p className="mt-1 text-sm text-white/25">Upload a file to get started.</p>
            <Button
              onClick={handleSelect}
              className="mt-5 gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 shadow-lg shadow-pink-500/20 px-6"
            >
              <Upload className="h-4 w-4" /> Upload First File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}