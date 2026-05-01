import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, Mail, Trash2, Copy, Check, Loader2, Shield, Clock, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { formatDistanceToNow, format, isPast } from 'date-fns';

interface Invite {
  id: string;
  token: string;
  email: string;
  role: 'admin' | 'super_admin';
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

type Status = 'pending' | 'used' | 'expired';

function getStatus(i: Invite): Status {
  if (i.used_at) return 'used';
  if (isPast(new Date(i.expires_at))) return 'expired';
  return 'pending';
}

// Colour tokens — pending=amber, used=gray, expired=red
const statusStyle: Record<Status, { bg: string; border: string; text: string; dot?: string }> = {
  pending: { bg: '#FAEEDA', border: '#EF9F27', text: '#633806', dot: '#BA7517' },
  used:    { bg: '#F1EFE8', border: '#B4B2A9', text: '#5F5E5A' },
  expired: { bg: '#FCEBEB', border: '#F09595', text: '#791F1F' },
};

function StatusPill({ status }: { status: Status }) {
  const s = statusStyle[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span style={{ background: s.bg, color: s.text, border: `0.5px solid ${s.border}`, fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {s.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function RolePill({ role }: { role: 'admin' | 'super_admin' }) {
  const isSA = role === 'super_admin';
  return (
    <span style={{ background: isSA ? '#FAEEDA' : '#E6F1FB', color: isSA ? '#633806' : '#0C447C', border: `0.5px solid ${isSA ? '#EF9F27' : '#85B7EB'}`, fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {isSA ? <Crown style={{ width: 11, height: 11 }} /> : <Shield style={{ width: 11, height: 11 }} />}
      {isSA ? 'Super Admin' : 'Admin'}
    </span>
  );
}

function validateEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

type FilterStatus = 'all' | Status;

export default function AdminInvites() {
  const { role } = useAuth();
  const { toast } = useToast();
  const invoke = useInvokeEdge();
  const qc = useQueryClient();

  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'super_admin'>('admin');
  const [creating, setCreating] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Invite | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  if (role && role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  const { data: invites = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-invites'],
    queryFn: async () => {
      const res = await invoke<{ invites: Invite[] }>('manage-admin-invites', { action: 'list_invites' });
      if (res.error) throw res.error;
      return res.data?.invites ?? [];
    },
    staleTime: 30_000,
  });

  const counts = {
    all: invites.length,
    pending: invites.filter(i => getStatus(i) === 'pending').length,
    used: invites.filter(i => getStatus(i) === 'used').length,
    expired: invites.filter(i => getStatus(i) === 'expired').length,
  };

  const visible = filterStatus === 'all' ? invites : invites.filter(i => getStatus(i) === filterStatus);

  const handleEmailChange = (v: string) => { setEmail(v); if (emailError) setEmailError(''); };

  const createInvite = async () => {
    if (!email.trim()) { setEmailError('Email is required.'); return; }
    if (!validateEmail(email.trim())) { setEmailError('Enter a valid email address.'); return; }
    const existing = invites.find(i => i.email.toLowerCase() === email.trim().toLowerCase() && getStatus(i) === 'pending');
    if (existing) { setEmailError('A pending invite already exists for this email.'); return; }

    setCreating(true);
    try {
      const res = await invoke<{ invite: Invite }>('manage-admin-invites', { action: 'create_invite', email: email.trim(), role: inviteRole });
      if (res.error) { toast({ title: 'Failed to create invite', description: res.error.message ?? 'Something went wrong.', variant: 'destructive' }); return; }
      if (res.data?.invite) qc.setQueryData<Invite[]>(['admin-invites'], prev => [res.data!.invite, ...(prev ?? [])]);
      else await qc.invalidateQueries({ queryKey: ['admin-invites'] });
      setEmail('');
      toast({ title: 'Invite created', description: `Copy the link below and share it with ${email.trim()}.` });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    const id = revokeTarget.id;
    setRevokeTarget(null);
    setRevoking(id);
    qc.setQueryData<Invite[]>(['admin-invites'], prev => prev?.map(i => i.id === id ? { ...i, used_at: new Date().toISOString() } : i) ?? []);
    try {
      const res = await invoke('manage-admin-invites', { action: 'revoke_invite', id });
      if (res.error) { await qc.invalidateQueries({ queryKey: ['admin-invites'] }); toast({ title: 'Failed to revoke', description: res.error.message, variant: 'destructive' }); }
      else toast({ title: 'Invite revoked', description: 'The invite link is now inactive.' });
    } finally { setRevoking(null); }
  };

  const copyLink = async (token: string, id: string, recipientEmail: string) => {
    const url = `${window.location.origin}/accept-invite?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
      toast({ title: 'Link copied', description: `Invite link for ${recipientEmail} copied.` });
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy the link manually.', variant: 'destructive' });
    }
  };

  const filterBtns: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'used', label: `Used (${counts.used})` },
    { key: 'expired', label: `Expired (${counts.expired})` },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Crown className="h-5 w-5" style={{ color: '#BA7517' }} />
              Admin Invites
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Create and manage admin invite links. Only Super Admins can access this page.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1.5 text-muted-foreground">
            <RefreshCw className="h-4 w-4" />Refresh
          </Button>
        </div>

        {/* Create Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />Send a New Invite
            </CardTitle>
            <CardDescription>Invites expire after 7 days. Share the generated link directly with the recipient.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="inv-email" className="text-xs font-medium">Recipient email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="inv-email"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createInvite()}
                    placeholder="recipient@example.com"
                    type="email"
                    disabled={creating}
                    className={`pl-9 ${emailError ? 'border-destructive' : ''}`}
                  />
                </div>
                {emailError && (
                  <p className="text-xs flex items-center gap-1" style={{ color: '#A32D2D' }}>
                    <AlertCircle className="h-3 w-3" />{emailError}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Role</Label>
                <Select value={inviteRole} onValueChange={v => setInviteRole(v as any)} disabled={creating}>
                  <SelectTrigger className="w-full sm:w-[168px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium opacity-0 select-none">Send</Label>
                <Button onClick={createInvite} disabled={creating || !email.trim()} className="w-full sm:w-auto gap-2">
                  {creating ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : <><Plus className="h-4 w-4" />Create Invite</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-medium">All Invites</CardTitle>
                <CardDescription className="mt-0.5">
                  {counts.pending} pending · {counts.used} used · {counts.expired} expired
                </CardDescription>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {filterBtns.map(({ key, label }) => (
                  <Button key={key} variant={filterStatus === key ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus(key)} className="h-7 px-3 text-xs">
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map(n => <Skeleton key={n} className="h-12 w-full" />)}</div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Failed to load invites.</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : invites.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16">
                <Mail className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No invites yet.</p>
                <p className="text-xs text-muted-foreground">Use the form above to send your first invite.</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12">
                <p className="text-sm text-muted-foreground">No {filterStatus} invites.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map(inv => {
                    const status = getStatus(inv);
                    const isActive = status === 'pending';
                    return (
                      <TableRow key={inv.id} className={`transition-colors ${revoking === inv.id ? 'opacity-40 pointer-events-none' : 'hover:bg-secondary/40'}`}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E6F1FB', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                              {inv.email[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{inv.email}</span>
                          </div>
                        </TableCell>
                        <TableCell><RolePill role={inv.role} /></TableCell>
                        <TableCell><StatusPill status={status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {isActive ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-1.5 cursor-default">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{format(new Date(inv.expires_at), 'PPpp')}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground/50">{format(new Date(inv.expires_at), 'dd MMM yyyy')}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          {isActive ? (
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => copyLink(inv.token, inv.id, inv.email)}>
                                    {copiedId === inv.id
                                      ? <Check className="h-4 w-4" style={{ color: '#3B6D11' }} />
                                      : <Copy className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy invite link</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setRevokeTarget(inv)} disabled={revoking === inv.id}>
                                    {revoking === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Revoke invite</TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Revoke Confirm */}
        <AlertDialog open={!!revokeTarget} onOpenChange={open => !open && setRevokeTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Invite</AlertDialogTitle>
              <AlertDialogDescription>
                This will immediately invalidate the invite sent to <strong>{revokeTarget?.email}</strong>. They won't be able to use it to join.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Revoke Invite
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}