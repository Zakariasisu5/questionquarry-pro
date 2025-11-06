import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Clock, CheckCircle, XCircle, Loader2, Send } from "lucide-react";

const RequestResource = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: requests, refetch } = useQuery({
    queryKey: ['resource-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('resource_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a request",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('resource_requests')
        .insert({
          user_id: user.id,
          question,
          course_code: courseCode || null,
        });

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: "Admin will review your request soon",
      });

      setQuestion("");
      setCourseCode("");
      refetch();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'fulfilled':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'fulfilled':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const fulfilledRequests = requests?.filter(r => r.status === 'fulfilled') || [];
  const rejectedRequests = requests?.filter(r => r.status === 'rejected') || [];

  const renderRequestCard = (request: any) => (
    <Card key={request.id} className="card-academic hover:border-primary/30 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {request.course_code && (
              <Badge variant="outline" className="font-mono">
                {request.course_code}
              </Badge>
            )}
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {new Date(request.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <Badge className={getStatusColor(request.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(request.status)}
              {request.status}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm font-medium mb-2 text-muted-foreground">Your Request:</p>
          <p className="leading-relaxed">{request.question}</p>
        </div>
        {request.admin_response && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-2 text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Admin Response:
            </p>
            <p className="leading-relaxed">{request.admin_response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Request Resources
          </h1>
          <p className="text-muted-foreground text-lg">
            Can't find what you need? Request past questions or resources and our admin team will help you.
          </p>
        </div>

        <Card className="mb-8 card-academic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Submit a New Request
            </CardTitle>
            <CardDescription>
              Describe the resource or past question you're looking for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  Course Code
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </label>
                <Input
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g., CS101, MTH201"
                  className="font-mono"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>Your Request *</span>
                  <span className="text-xs text-muted-foreground">
                    {question.length}/500
                  </span>
                </label>
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
                  placeholder="Example: I'm looking for MTH201 past questions from 2023 second semester..."
                  rows={5}
                  required
                  disabled={isSubmitting}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Be as specific as possible to help us find what you need
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || !question.trim()}
                className="w-full sm:w-auto"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All
                <Badge variant="secondary" className="ml-1">
                  {requests?.length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                <Badge variant="secondary" className="ml-1">
                  {pendingRequests.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="fulfilled" className="flex items-center gap-2">
                Fulfilled
                <Badge variant="secondary" className="ml-1">
                  {fulfilledRequests.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                Rejected
                <Badge variant="secondary" className="ml-1">
                  {rejectedRequests.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {requests && requests.length > 0 ? (
                requests.map(renderRequestCard)
              ) : (
                <Card className="card-academic">
                  <CardContent className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-lg mb-2">No requests yet</p>
                    <p className="text-sm text-muted-foreground">
                      Submit your first request above to get started
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map(renderRequestCard)
              ) : (
                <Card className="card-academic">
                  <CardContent className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No pending requests</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="fulfilled" className="space-y-4">
              {fulfilledRequests.length > 0 ? (
                fulfilledRequests.map(renderRequestCard)
              ) : (
                <Card className="card-academic">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No fulfilled requests yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedRequests.length > 0 ? (
                rejectedRequests.map(renderRequestCard)
              ) : (
                <Card className="card-academic">
                  <CardContent className="text-center py-12">
                    <XCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No rejected requests</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default RequestResource;