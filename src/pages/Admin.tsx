import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingResource {
  id: string;
  title: string;
  courseCode: string;
  type: "note" | "question";
  uploader: string;
  uploadDate: string;
  verified: boolean;
}

const mockPendingResources: PendingResource[] = [
  {
    id: "1",
    title: "Final Exam Questions 2024",
    courseCode: "CS 201",
    type: "question",
    uploader: "John Doe",
    uploadDate: "2024-01-15",
    verified: false,
  },
  {
    id: "2",
    title: "Chapter 5 Lecture Notes",
    courseCode: "MATH 301",
    type: "note",
    uploader: "Jane Smith",
    uploadDate: "2024-01-14",
    verified: false,
  },
  {
    id: "3",
    title: "Mid-term Past Questions",
    courseCode: "PHY 202",
    type: "question",
    uploader: "Mike Johnson",
    uploadDate: "2024-01-13",
    verified: false,
  },
];

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resources, setResources] = useState<PendingResource[]>(mockPendingResources);

  const handleApprove = (id: string, title: string) => {
    setResources(resources.filter(r => r.id !== id));
    toast({
      title: "Resource approved",
      description: `"${title}" has been published`,
    });
  };

  const handleReject = (id: string, title: string) => {
    setResources(resources.filter(r => r.id !== id));
    toast({
      title: "Resource rejected",
      description: `"${title}" has been removed`,
      variant: "destructive",
    });
  };

  const handleToggleVerified = (id: string) => {
    setResources(resources.map(r => 
      r.id === id ? { ...r, verified: !r.verified } : r
    ));
    toast({
      title: "Verification status updated",
    });
  };

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
                          {resource.courseCode}
                        </Badge>
                        <Badge 
                          variant={resource.type === "note" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {resource.type === "note" ? "Note" : "Question"}
                        </Badge>
                        {resource.verified && (
                          <CheckCircle className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <h3 className="font-medium text-foreground mb-1">{resource.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        Uploaded by {resource.uploader} on {new Date(resource.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 h-10"
                      onClick={() => toast({ title: "Opening preview..." })}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 h-10"
                      onClick={() => handleToggleVerified(resource.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {resource.verified ? "Unverify" : "Verify"}
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
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
