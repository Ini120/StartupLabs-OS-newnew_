import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInvokeEdge } from '@/lib/invoke-edge';
import { useToast } from '@/hooks/use-toast';

export interface DocumentRow {
  id: string;
  name: string | null;
  file_type: string | null;
  file_url: string | null;
  startup_id: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export function useDocuments(startupIds: string[]) {
  return useQuery({
    queryKey: ['documents', startupIds],
    enabled: startupIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Documents')
        .select('*')
        .in('startup_id', startupIds)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });
}

/** Uploads a file: requests a signed upload URL, PUTs the file, then registers the doc. */
export function useUploadDocument() {
  const invoke = useInvokeEdge();
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, startup_id }: { file: File; startup_id: string }) => {
      // 1. Get signed upload URL
      const sign = await invoke<{ path: string; token: string; signed_url: string }>(
        'manage-documents',
        { action: 'create_upload_url', startup_id, file_name: file.name, file_type: file.type },
      );
      if (sign.error || !sign.data) throw sign.error ?? new Error('Could not start upload');

      // 2. Upload via Supabase storage SDK using the token
      const { error: upErr } = await supabase.storage
        .from('documents')
        .uploadToSignedUrl(sign.data.path, sign.data.token, file, {
          contentType: file.type || 'application/octet-stream',
        });
      if (upErr) throw upErr;

      // 3. Register document row
      const reg = await invoke('manage-documents', {
        action: 'register_document',
        startup_id,
        path: sign.data.path,
        name: file.name,
        file_type: file.type,
      });
      if (reg.error) throw reg.error;
      return reg.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Document uploaded' });
    },
    onError: (e: Error) => toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }),
  });
}

export function useDownloadDocument() {
  const invoke = useInvokeEdge();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (document_id: string) => {
      const res = await invoke<{ url: string; name: string }>('manage-documents', {
        action: 'get_download_url', document_id,
      });
      if (res.error || !res.data) throw res.error ?? new Error('No URL');
      // Open in new tab
      window.open(res.data.url, '_blank', 'noopener');
    },
    onError: (e: Error) => toast({ title: 'Download failed', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteDocument() {
  const invoke = useInvokeEdge();
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (document_id: string) => {
      const res = await invoke('manage-documents', { action: 'delete_document', document_id });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Document deleted' });
    },
    onError: (e: Error) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });
}
