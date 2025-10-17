import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResourceCard } from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockBookmarkedResources = [
  { 
    id: "1", 
    title: "Final Exam Questions 2023", 
    courseCode: "CS 201", 
    type: "question" as const,
    year: "2023",
    semester: "Second Semester",
    examType: "Final",
    verified: true,
    downloads: 234,
  },
  { 
    id: "2", 
    title: "Complete Lecture Notes", 
    courseCode: "MATH 301", 
    type: "note" as const,
    year: "2024",
    semester: "First Semester",
    verified: true,
    downloads: 456,
  },
];

const Bookmarks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookmarkedResources, setBookmarkedResources] = useState(mockBookmarkedResources);

  const handleRemoveBookmark = (id: string) => {
    setBookmarkedResources(bookmarkedResources.filter(r => r.id !== id));
    toast({ title: "Removed from bookmarks" });
  };

  const handleDownload = (title: string) => {
    toast({ 
      title: "Download started", 
      description: `Downloading: ${title}` 
    });
  };

  const handleView = (title: string) => {
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

        {bookmarkedResources.length === 0 ? (
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
                {...resource}
                isBookmarked={true}
                onView={() => handleView(resource.title)}
                onDownload={() => handleDownload(resource.title)}
                onBookmark={() => handleRemoveBookmark(resource.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Bookmarks;
