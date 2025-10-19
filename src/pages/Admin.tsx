import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface PendingResource {
  id: string;
  title: string;
  course_code: string;
  type: "note" | "question";
  file_url?: string | null;
  contributor_id?: string | null;
  contributor: {
    name: string;
  };
  created_at: string;
  verified: boolean;
  publicUrl?: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminCheckLoading } = useAdminCheck();
  const [resources, setResources] = useState<PendingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [orphanFiles, setOrphanFiles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // modal/editing state
  const [editing, setEditing] = useState<any | null>(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaCourse, setMetaCourse] = useState('');
  const [metaType, setMetaType] = useState<'note' | 'question'>('note');
  const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(null);

  const BUCKET_NAME = (import.meta.env.VITE_SUPABASE_BUCKET as string) || 'resources';
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!adminCheckLoading && !isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have admin permissions",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, adminCheckLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingResources();
    }
  }, [isAdmin]);

  const fetchPendingResources = async () => {
    try {
      // fetch pending resources including file_url & contributor_id so we can show previews
      const { data, error } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          course_code,
          type,
          file_url,
          contributor_id,
          created_at,
          verified,
          contributor:profiles!contributor_id(name)
        `)
        .eq("verified", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const withPublic: any[] = [];
      for (const r of (data || [])) {
        let publicUrl = r.file_url ?? '';
        // if file_url is a Supabase public storage path, try derive public URL
        if (!publicUrl && r.file_url) {
          const match = r.file_url.match(/\/storage\/v1\/object\/(.*)$/);
          const path = match ? match[1] : null;
          if (path) {
            const { data: pd } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
            publicUrl = pd?.publicUrl ?? '';
          }
        }

        // fallback: if no file_url but contributor_id present, try to form a path using convention
        if (!publicUrl && r.contributor_id) {
          const guessedPath = `${r.contributor_id}/${r.id}`; // not guaranteed; fallback
          const { data: pd } = supabase.storage.from(BUCKET_NAME).getPublicUrl(guessedPath);
          publicUrl = pd?.publicUrl ?? '';
        }

        withPublic.push({ ...r, publicUrl });
      }

      setResources(withPublic as any[]);
      // After loading DB resources, also check storage bucket for orphaned files
      await fetchOrphanedStorageFiles(withPublic || []);
    } catch (error: any) {
      toast({
        title: "Error loading resources",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrphanedStorageFiles = async (dbResources: any[]) => {
    try {
      // fetch all resource file_urls to compare and map by path
      const { data: allResources } = await supabase.from('resources').select('id, file_url, title, contributor_id, verified');
      const resourcesByPath = new Map<string, any>();
      for (const r of (allResources || [])) {
        // attempt to extract path portion after bucket host if public url
        if (r.file_url) {
          const match = r.file_url.match(/\/storage\/v1\/object\/(.*)$/);
          const path = match ? match[1] : null;
          if (path) resourcesByPath.set(path, r);
        }
      }

      // list storage objects (root)
      const { data: objs, error: listErr } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 });
      if (listErr) throw listErr;

      const combined: any[] = [];

      for (const obj of objs || []) {
        const path = obj.name;
        const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        const publicUrl = publicData?.publicUrl ?? '';

        const linkedResource = resourcesByPath.get(path) || null;

        // try infer contributor id from path: assume 'userId/filename'
        const parts = path.split('/');
        const inferredContributor = parts.length > 1 ? parts[0] : null;

        let contributorExists = false;
        if (inferredContributor) {
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('id', inferredContributor)
            .limit(1)
            .maybeSingle();
          if (!profileErr && profileData) contributorExists = true;
        }

        combined.push({ name: obj.name, path, publicUrl, linkedResource, inferredContributor, contributorExists });
      }

      setOrphanFiles(combined);
    } catch (err) {
      console.warn('Failed to list storage objects', err);
    }
  };

  const handleApprove = async (id: string, title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("resources")
        .update({
          verified: true,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setResources(resources.filter(r => r.id !== id));
      toast({
        title: "Resource approved",
        description: `"${title}" has been published`,
      });
      // refresh orphan list
      fetchOrphanedStorageFiles([]);
    } catch (error: any) {
      toast({
        title: "Error approving resource",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setResources(resources.filter(r => r.id !== id));
      toast({
        title: "Resource rejected",
        description: `"${title}" has been removed`,
        variant: "destructive",
      });
      // refresh orphan list
      fetchOrphanedStorageFiles([]);
    } catch (error: any) {
      toast({
        title: "Error rejecting resource",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateRecordFromOrphan = async (orphan: any) => {
    // use unified createResource
    const title = orphan.name.split('/').pop() ?? orphan.name;
    const payload = {
      contributor_id: orphan.inferredContributor,
      course_code: 'UNKNOWN',
      title,
      type: 'note',
      file_url: orphan.publicUrl,
    } as any;

    await createResource({ payload, publish: !!orphan.publish, orphanPath: orphan.path });
  };

  // Unified creator used by quick-create and modal create+publish
  const createResource = async ({ payload, publish = false, orphanPath = null }: { payload: any; publish?: boolean; orphanPath?: string | null }) => {
    try {
      if (!currentUser) throw new Error('Not authenticated as admin');
      if (!payload.contributor_id) throw new Error('Missing contributor_id');

      const insertPayload = { ...payload, verified: !!publish } as any;
      if (publish) {
        insertPayload.reviewed_by = currentUser.id;
        insertPayload.reviewed_at = new Date().toISOString();
      }

      const { error } = await supabase.from('resources').insert(insertPayload);
      if (error) {
        // detect RLS error and give actionable message
        const isRls = (error?.message || '').includes('row-level security') || error?.code === '42501';
        if (isRls) {
          // Log useful diagnostics for the developer
          try {
            const sess = await supabase.auth.getSession();
            console.warn('RLS blocked insert. Session:', sess);
          } catch (sessErr) {
            console.warn('RLS blocked insert and failed to fetch session', sessErr);
          }
          const sampleSQL = `-- Example: allow authenticated users to insert resources as themselves\nCREATE POLICY "Allow insert when contributor is auth uid" ON public.resources FOR INSERT WITH CHECK (auth.uid() = contributor_id);`;
          toast({ title: 'RLS blocked insert', description: 'Insert blocked by Row-Level Security. Check DB policies. See console for session info and example SQL.', variant: 'destructive' });
          console.error('RLS insert error details:', error, '\nExample SQL:\n', sampleSQL);
          return;
        }
        throw error;
      }

      // success path: remove orphan entry if provided
      if (orphanPath) setOrphanFiles(prev => prev.filter(o => o.path !== orphanPath));
      toast({ title: 'Resource created', description: publish ? `${insertPayload.title} was added and published` : `${insertPayload.title} was added as pending` });

      // refresh lists
      fetchPendingResources();
      fetchOrphanedStorageFiles([]);
    } catch (err: any) {
      console.error('Error creating resource', err);
      toast({ title: 'Error creating resource', description: err.message || String(err), variant: 'destructive' });
    }
  };

  const handleDeleteOrphanFile = async (orphan: any) => {
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([orphan.path]);
      if (error) throw error;
      setOrphanFiles(orphanFiles.filter((o) => o.path !== orphan.path));
      toast({ title: 'Deleted file', description: orphan.path });
    } catch (err: any) {
      toast({ title: 'Error deleting file', description: err.message, variant: 'destructive' });
    }
  };

  // Open edit modal prefilled for an orphan file
  const openEditModal = (orphan: any, publishDefault = false) => {
    setEditing({ ...orphan, publish: publishDefault });
    setMetaTitle((orphan.name || '').split('/').pop() ?? '');
    setMetaCourse('UNKNOWN');
    setMetaType((orphan.linkedResource?.type as 'note' | 'question') ?? 'note');
  };

  const confirmCreateFromModal = async (publish: boolean) => {
    if (!editing) return;
    try {
      if (!currentUser) throw new Error('Not authenticated as admin');
      if (!editing.contributorExists) throw new Error('Cannot infer contributor for this file');
      const payload: any = {
        contributor_id: editing.inferredContributor,
        course_code: metaCourse || 'UNKNOWN',
        title: metaTitle || (editing.name.split('/').pop() ?? editing.name),
        type: metaType || 'note',
        file_url: editing.publicUrl,
      };

      await createResource({ payload, publish, orphanPath: editing.path });
      setEditing(null);
    } catch (err: any) {
      toast({ title: 'Error creating resource', description: err.message, variant: 'destructive' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeletePath) return;
    const orphan = orphanFiles.find((o) => o.path === confirmDeletePath);
    if (!orphan) {
      setConfirmDeletePath(null);
      return;
    }
    await handleDeleteOrphanFile(orphan);
    setConfirmDeletePath(null);
  };

  if (adminCheckLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-xs opacity-90">Moderate uploads</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Pending Approvals ({resources.length})
          </h2>
        </div>

        {resources.length === 0 ? (
          <Card className="card-academic p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success" />
            <p className="text-muted-foreground">All caught up! No pending resources.</p>
          </Card>
        ) : (
          <div className="space-y-3">
              {resources.map((resource) => (
                <Card key={resource.id} className="card-academic p-5">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="text-xs">
                            {resource.course_code}
                          </Badge>
                          <Badge 
                            variant={resource.type === "note" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {resource.type === "note" ? "Note" : "Question"}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-foreground mb-1">{resource.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Uploaded by {resource.contributor.name} on {new Date(resource.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2 w-full sm:w-auto">
                        <Button
                          variant="default"
                          className="w-full sm:w-auto flex-1 gap-2 h-10 bg-success hover:bg-success/90"
                          onClick={() => handleApprove(resource.id, resource.title)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto flex-1 gap-2 h-10"
                          onClick={() => handleReject(resource.id, resource.title)}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                        {resource.publicUrl && (
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto flex-1 gap-2 h-10"
                            onClick={() => window.open(resource.publicUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                            View file
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
        )}

        {/* Orphaned storage files (uploaded but no DB record) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Orphaned Uploaded Files</h3>
            <div className="flex items-center gap-2">
              <Input placeholder="Filter by filename or contributor" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
            </div>
          </div>

          {orphanFiles.length === 0 ? (
            <Card className="p-4">No orphan files found in storage.</Card>
          ) : (
            <>
              {/* paged & filtered */}
              {(() => {
                const filtered = orphanFiles.filter(o => {
                  if (!searchTerm) return true;
                  const s = searchTerm.toLowerCase();
                  return (o.name || '').toLowerCase().includes(s) || (o.inferredContributor || '').toLowerCase().includes(s);
                });
                const total = filtered.length;
                const start = (page - 1) * PAGE_SIZE;
                const paged = filtered.slice(start, start + PAGE_SIZE);
                const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
                return (
                  <div>
                    <div className="space-y-3">
                      {paged.map((o) => (
                        <Card key={o.path} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{o.name}</div>
                              <div className="text-xs text-muted-foreground">Contributor inferred: {o.inferredContributor ?? 'Unknown'}</div>
                              {o.linkedResource ? (
                                <div className="text-xs mt-1">Linked DB record: {o.linkedResource.title} — {o.linkedResource.verified ? 'Published' : 'Pending'}</div>
                              ) : (
                                <div className="text-xs mt-1">No DB record found for this file</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {o.linkedResource ? (
                                // actions for existing resource
                                <>
                                  {!o.linkedResource.verified && (
                                    <Button size="sm" variant="default" onClick={() => handleApprove(o.linkedResource.id, o.linkedResource.title)}>
                                      Approve
                                    </Button>
                                  )}
                                  <Button size="sm" variant="destructive" onClick={() => handleReject(o.linkedResource.id, o.linkedResource.title)}>
                                    Delete record
                                  </Button>
                                </>
                              ) : (
                                // actions for orphan file
                                <>
                                  <Button size="sm" variant="outline" onClick={() => openEditModal(o, false)} disabled={!o.contributorExists}>
                                    Create (pending)
                                  </Button>
                                  <Button size="sm" variant="default" onClick={() => openEditModal(o, true)} disabled={!o.contributorExists}>
                                    Create & Publish
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => setConfirmDeletePath(o.path)}>
                                    Delete file
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* pagination controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">Showing {start + 1} - {Math.min(start + PAGE_SIZE, total)} of {total}</div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                        <div className="text-sm">{page} / {totalPages}</div>
                        <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* Edit metadata dialog */}
          <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit resource metadata</DialogTitle>
                <DialogDescription>Adjust title, course code and type before creating a DB record.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-2">
                <label className="text-xs">Title</label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />

                <label className="text-xs">Course code</label>
                <Input value={metaCourse} onChange={(e) => setMetaCourse(e.target.value)} />

                <label className="text-xs">Type</label>
                <Select onValueChange={(v) => setMetaType(v as 'note' | 'question')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={metaType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={() => confirmCreateFromModal(false)}>Create (pending)</Button>
                <Button onClick={() => confirmCreateFromModal(true)}>Create & Publish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirm delete alert dialog */}
          <AlertDialog>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete file</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to delete this file from storage? This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmDeletePath(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleConfirmDelete()}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
};

export default Admin;
