import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

const AdminRequests = () => {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<string>("fulfilled");

  const { data: requests, refetch, isLoading } = useQuery({
    queryKey: ['admin-resource-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resource_requests')
        .select(`
          *,
          profiles(name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleRespond = async (requestId: string) => {
    if (!response.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('resource_requests')
        .update({
          status,
          admin_response: response,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Response sent",
        description: "The user will be notified of your response",
      });

      setRespondingTo(null);
      setResponse("");
      setStatus("fulfilled");
      refetch();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive",
      });
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
  const respondedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Resource Requests</h1>
            <p className="text-muted-foreground">
              Review and respond to user resource requests
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Pending Requests ({pendingRequests.length})
          </h2>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {request.profiles?.name || 'Unknown User'}
                        </CardTitle>
                        <CardDescription>
                          {request.profiles?.email}
                        </CardDescription>
                        {request.course_code && (
                          <Badge variant="outline" className="mt-2">
                            {request.course_code}
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Submitted: {new Date(request.created_at).toLocaleDateString()}
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
                  <CardContent>
                    <div className="mb-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Request:</p>
                      <p>{request.question}</p>
                    </div>

                    {respondingTo === request.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Status
                          </label>
                          <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fulfilled">Fulfilled</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Your Response
                          </label>
                          <Textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Enter your response to the user..."
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleRespond(request.id)}>
                            Send Response
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponse("");
                              setStatus("fulfilled");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button onClick={() => setRespondingTo(request.id)}>
                        Respond to Request
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No pending requests at the moment
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">
            Responded Requests ({respondedRequests.length})
          </h2>
          {respondedRequests.length > 0 ? (
            <div className="space-y-4">
              {respondedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {request.profiles?.name || 'Unknown User'}
                        </CardTitle>
                        {request.course_code && (
                          <Badge variant="outline">
                            {request.course_code}
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Submitted: {new Date(request.created_at).toLocaleDateString()}
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
                  <CardContent>
                    <div className="mb-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Request:</p>
                      <p className="text-sm">{request.question}</p>
                    </div>
                    {request.admin_response && (
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium mb-1">Your Response:</p>
                        <p className="text-sm">{request.admin_response}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No responded requests yet
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminRequests;
