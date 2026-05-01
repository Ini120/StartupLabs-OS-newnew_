import { useState } from 'react';
import { Users, Search, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/data/mock-data';

type Role = 'student' | 'mentor' | 'admin';
type TabValue = 'all' | Role;

// Colour tokens using the design system ramps (light: 50 bg / 600 border / 800 text)
const roleStyles: Record<Role, { bg: string; border: string; text: string; avatarBg: string; avatarText: string }> = {
  student: { bg: '#E6F1FB', border: '#85B7EB', text: '#0C447C', avatarBg: '#E6F1FB', avatarText: '#185FA5' },
  mentor:  { bg: '#FAEEDA', border: '#EF9F27', text: '#633806', avatarBg: '#FAEEDA', avatarText: '#854F0B' },
  admin:   { bg: '#FCEBEB', border: '#F09595', text: '#791F1F', avatarBg: '#FCEBEB', avatarText: '#A32D2D' },
};

const roleLabel: Record<Role, string> = { student: 'Student', mentor: 'Mentor', admin: 'Admin' };

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function RolePill({ role }: { role: Role }) {
  const s = roleStyles[role];
  return (
    <span style={{ background: s.bg, color: s.text, border: `0.5px solid ${s.border}`, fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 99, display: 'inline-block' }}>
      {roleLabel[role]}
    </span>
  );
}

function ActivePill() {
  return (
    <span style={{ background: '#EAF3DE', color: '#27500A', border: '0.5px solid #97C459', fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B6D11', flexShrink: 0 }} />
      Active
    </span>
  );
}

function UserAvatar({ name, role, size = 32 }: { name: string; role: Role; size?: number }) {
  const s = roleStyles[role];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: s.avatarBg, color: s.avatarText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 600, flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [editRole, setEditRole] = useState<Role>('student');

  const counts = { all: users.length, student: users.filter(u => u.role === 'student').length, mentor: users.filter(u => u.role === 'mentor').length, admin: users.filter(u => u.role === 'admin').length };

  const filtered = users.filter(user => {
    if (activeTab !== 'all' && user.role !== activeTab) return false;
    if (search) { const q = search.toLowerCase(); return user.full_name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q); }
    return true;
  });

  const openDetail = (u: any) => { setSelectedUser(u); setDetailOpen(true); };
  const openEdit   = (u: any) => { setSelectedUser(u); setEditRole(u.role); setEditOpen(true); };
  const openRemove = (u: any) => { setSelectedUser(u); setRemoveOpen(true); };

  const saveEdit = () => {
    setUsers(p => p.map(u => u.id === selectedUser.id ? { ...u, role: editRole } : u));
    setEditOpen(false);
    toast({ title: 'Role updated', description: `${selectedUser.full_name} is now a ${roleLabel[editRole]}.` });
  };

  const removeUser = () => {
    setUsers(p => p.filter(u => u.id !== selectedUser.id));
    setRemoveOpen(false);
    toast({ title: 'User removed', description: `${selectedUser.full_name} has been removed.`, variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)' }}>User Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage users, roles, and permissions.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
          <Users className="h-4 w-4" /><span>{users.length} users</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="pl-9" />
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="student">Students ({counts.student})</TabsTrigger>
          <TabsTrigger value="mentor">Mentors ({counts.mentor})</TabsTrigger>
          <TabsTrigger value="admin">Admins ({counts.admin})</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card className="mt-4">
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-2">
                  <Users className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No users found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(user => (
                      <TableRow key={user.id} className="hover:bg-secondary/40 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar name={user.full_name} role={user.role as Role} />
                            <span className="font-medium text-sm">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell><RolePill role={user.role as Role} /></TableCell>
                        <TableCell><ActivePill /></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetail(user)}>View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(user)}>Edit Role</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openRemove(user)}>Remove User</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <UserAvatar name={selectedUser.full_name} role={selectedUser.role as Role} size={52} />
                <div>
                  <p className="font-semibold text-base leading-tight">{selectedUser.full_name}</p>
                  <div className="mt-1.5"><RolePill role={selectedUser.role as Role} /></div>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-border/40">
                {[{ label: 'Email', value: selectedUser.email }, { label: 'Status', value: <ActivePill /> }, { label: 'Member since', value: 'January 2024' }].map((row, i) => (
                  <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-border/40' : ''} bg-secondary/40`}>
                    <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                    <span className="text-sm">{row.value}</span>
                  </div>
                ))}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setDetailOpen(false); openEdit(selectedUser); }}>Edit Role</Button>
                <Button variant="destructive" className="flex-1" onClick={() => { setDetailOpen(false); openRemove(selectedUser); }}>Remove</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Role */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Change the role for {selectedUser?.full_name}.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={editRole} onValueChange={v => setEditRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove <strong>{selectedUser?.full_name}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}