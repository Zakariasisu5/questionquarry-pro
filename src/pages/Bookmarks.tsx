import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResourceCard } from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/hooks/useAuth";

const Bookmarks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const [bookmarkedResources, setBookmarkedResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarkedResources = async () => {
      if (!user || bookmarkedIds.size === 0) {
        setBookmarkedResources([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .in("id", Array.from(bookmarkedIds))
          .eq("verified", true);

        if (error) throw error;
        setBookmarkedResources(data || []);
      } catch (error) {
        console.error("Error fetching bookmarked resources:", error);
        toast({
          title: "Error",
          description: "Failed to load bookmarks",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedResources();
  }, [user, bookmarkedIds, toast]);

  const handleDownload = async (resourceId: string, fileUrl: string, title: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to download resources" });
      return;
    }
    window.open(fileUrl, "_blank");
    toast({
      title: "Download started",
      description: `Downloading: ${title}`,
    });

    try {
      // @ts-expect-error: 'downloads' table is not in the generated types but exists in the database
      const { error } = await supabase.from('downloads').insert({ resource_id: resourceId, user_id: user.id });
      if (error) console.warn('Failed to record download:', error);
    } catch (e) {
      console.warn('Error recording download', e);
    }
  };

  const handleView = (fileUrl: string, title: string) => {
    window.open(fileUrl, "_blank");
    toast({ title: "Opening preview", description: title });
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
              <h1 className="text-xl font-bold">My Bookmarks</h1>
              <p className="text-xs opacity-90">Saved for later</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {bookmarkedResources.length} Bookmarked Items
          </h2>
        </div>

        {loading ? (
          <Card className="card-academic p-8 text-center">
            <p className="text-muted-foreground">Loading bookmarks...</p>
          </Card>
        ) : bookmarkedResources.length === 0 ? (
          <Card className="card-academic p-8 text-center">
            <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No bookmarks yet</p>
            <p className="text-sm text-muted-foreground">
              Start bookmarking resources to access them quickly
            </p>
            <Button
              variant="default"
              className="mt-4"
              onClick={() => navigate("/")}
            >
              Browse Resources
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {bookmarkedResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                id={resource.id}
                title={resource.title}
                courseCode={resource.course_code}
                type={resource.type}
                year={resource.year}
                semester={resource.semester}
                verified={resource.verified}
                downloads={0}
                isBookmarked={true}
                onView={() => handleView(resource.file_url, resource.title)}
                onDownload={() => handleDownload(resource.id, resource.file_url, resource.title)}
                onBookmark={() => toggleBookmark(resource.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Bookmarks;
