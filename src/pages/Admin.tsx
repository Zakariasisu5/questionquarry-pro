import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface PendingResource {
  id: string;
  title: string;
  course_code: string;
  type: "note" | "question";
  contributor: {
    name: string;
  };
  created_at: string;
  verified: boolean;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminCheckLoading } = useAdminCheck();
  const [resources, setResources] = useState<PendingResource[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data, error } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          course_code,
          type,
          created_at,
          verified,
          contributor:profiles!contributor_id(name)
        `)
        .eq("verified", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
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
    } catch (error: any) {
      toast({
        title: "Error rejecting resource",
        description: error.message,
        variant: "destructive",
      });
    }
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
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
                  <div className="flex items-start justify-between gap-3">
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
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      className="flex-1 gap-2 h-10 bg-success hover:bg-success/90"
                      onClick={() => handleApprove(resource.id, resource.title)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2 h-10"
                      onClick={() => handleReject(resource.id, resource.title)}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
