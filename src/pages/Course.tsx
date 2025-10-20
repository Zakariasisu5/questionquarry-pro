import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FilterBar } from "@/components/FilterBar";
import { ResourceCard } from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBookmarks } from "@/hooks/useBookmarks";

const Course = () => {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  // Fetch resources for this course
  useEffect(() => {
    const fetchResources = async () => {
      if (!courseCode) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('course_code', courseCode)
          .eq('verified', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResources(data || []);
      } catch (err) {
        console.error('Error fetching resources:', err);
        toast({
          title: "Error loading resources",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [courseCode, toast]);

  const handleClearFilters = () => {
    setSelectedYear("all");
    setSelectedSemester("all");
    setSelectedType("all");
  };


  const handleDownload = (fileUrl: string, title: string) => {
    window.open(fileUrl, '_blank');
    toast({ 
      title: "Download started", 
      description: `Downloading: ${title}` 
    });
  };

  const handleView = (fileUrl: string, title: string) => {
    window.open(fileUrl, '_blank');
    toast({ title: "Opening preview", description: title });
  };

  // Filter resources
  const filteredResources = resources.filter((resource) => {
    if (selectedType !== "all" && resource.type !== selectedType) return false;
    return true;
  });

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
              <h1 className="text-xl font-bold">{courseCode}</h1>
              <p className="text-xs opacity-90">Data Structures and Algorithms</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <section>
          <FilterBar
            selectedYear={selectedYear}
            selectedSemester={selectedSemester}
            selectedType={selectedType}
            onYearChange={setSelectedYear}
            onSemesterChange={setSelectedSemester}
            onTypeChange={setSelectedType}
            onClearFilters={handleClearFilters}
          />
        </section>

        {/* Resources */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {loading ? "Loading..." : `${filteredResources.length} Resources Found`}
            </h2>
          </div>
          
          {loading ? (
            <div className="card-academic p-8 text-center">
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="card-academic p-8 text-center">
              <p className="text-muted-foreground">
                {resources.length === 0 
                  ? "No resources available for this course yet" 
                  : "No resources match your filters"}
              </p>
              {resources.length > 0 && (
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  id={resource.id}
                  title={resource.title}
                  courseCode={resource.course_code}
                  type={resource.type}
                  year={undefined}
                  semester={undefined}
                  examType={undefined}
                  verified={resource.verified}
                  downloads={0}
                  isBookmarked={bookmarkedIds.has(resource.id)}
                  onView={() => handleView(resource.file_url, resource.title)}
                  onDownload={() => handleDownload(resource.file_url, resource.title)}
                  onBookmark={() => toggleBookmark(resource.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Course;
