import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CourseCard } from "@/components/CourseCard";
import { ResourceCard } from "@/components/ResourceCard";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Mock data
const mockCourses = [
  { id: "1", code: "CS 201", name: "Data Structures and Algorithms", notes: 12, questions: 8, updated: "2 days ago" },
  { id: "2", code: "MATH 301", name: "Calculus III", notes: 15, questions: 10, updated: "1 week ago" },
  { id: "3", code: "ENG 101", name: "Technical Writing", notes: 8, questions: 5, updated: "3 days ago" },
  { id: "4", code: "PHY 202", name: "Electromagnetic Theory", notes: 10, questions: 7, updated: "5 days ago" },
];

const mockRecentUploads = [
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
    isBookmarked: false
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
    isBookmarked: true
  },
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set(["2"]));
  const { toast } = useToast();
  const navigate = useNavigate();

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const q = searchQuery.trim();
    const handle = setTimeout(async () => {
      try {
        setSearchLoading(true);
        // Search title or course_code using ilike (case-insensitive)
        const filter = `%${q.replace(/%/g, '\\%')}%`;
        const { data, error } = await supabase
          .from('resources')
          .select('id, title, course_code, type, verified, file_url, created_at')
          .or(`title.ilike.${filter},course_code.ilike.${filter}`)
          .eq('verified', true)
          .limit(50);

        if (error) throw error;
        setSearchResults(data ?? []);
      } catch (err: any) {
        console.error('Search error', err);
        toast({ title: 'Search failed', description: err.message ?? String(err) });
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(handle);
  }, [searchQuery, toast]);

  const handleCourseClick = (courseCode: string) => {
    navigate(`/course/${courseCode}`);
  };

  const handleBookmark = (id: string) => {
    const newBookmarks = new Set(bookmarkedItems);
    if (newBookmarks.has(id)) {
      newBookmarks.delete(id);
      toast({ title: "Removed from bookmarks" });
    } else {
      newBookmarks.add(id);
      toast({ title: "Added to bookmarks" });
    }
    setBookmarkedItems(newBookmarks);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">UDS StudyHub</h1>
                <p className="text-xs opacity-90">Past Questions & Notes</p>
              </div>
            </div>
            <Navigation />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Search Section */}
        <section>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 btn-tap-target"
            onClick={() => navigate("/upload")}
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm">Upload</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 btn-tap-target"
            onClick={() => navigate("/bookmarks")}
          >
            <Star className="h-6 w-6" />
            <span className="text-sm">Bookmarks</span>
          </Button>
        </section>

        {/* Browse Courses */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Browse by Course</h2>
            <Button variant="link" className="text-primary h-auto p-0">
              View All
            </Button>
          </div>
          <div className="grid gap-3">
            {mockCourses.map((course) => (
              <CourseCard
                key={course.id}
                courseCode={course.code}
                courseName={course.name}
                noteCount={course.notes}
                questionCount={course.questions}
                lastUpdated={course.updated}
                onClick={() => handleCourseClick(course.code)}
              />
            ))}
          </div>
        </section>

        {/* Search Results or Recent Uploads */}
        {searchQuery.trim() ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Search Results</h2>
            </div>
            <div className="grid gap-3">
              {searchLoading && <div className="p-4">Searching...</div>}
              {!searchLoading && searchResults.length === 0 && (
                <div className="p-4">No results found.</div>
              )}
              {!searchLoading && searchResults.map((r) => (
                <ResourceCard
                  key={r.id}
                  id={r.id}
                  title={r.title}
                  courseCode={r.course_code}
                  type={r.type}
                  year={undefined}
                  semester={undefined}
                  examType={undefined}
                  verified={r.verified}
                  downloads={0}
                  isBookmarked={bookmarkedItems.has(r.id)}
                  onView={() => handleView(r.title)}
                  onDownload={() => handleDownload(r.title)}
                  onBookmark={() => handleBookmark(r.id)}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Uploads</h2>
              <Button variant="link" className="text-primary h-auto p-0">
                View All
              </Button>
            </div>
            <div className="grid gap-3">
              {mockRecentUploads.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  {...resource}
                  isBookmarked={bookmarkedItems.has(resource.id)}
                  onView={() => handleView(resource.title)}
                  onDownload={() => handleDownload(resource.title)}
                  onBookmark={() => handleBookmark(resource.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="card-academic p-6 text-center space-y-3">
          <h3 className="text-lg font-semibold">Community Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">240</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">1.2K</p>
              <p className="text-xs text-muted-foreground">Resources</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">45K</p>
              <p className="text-xs text-muted-foreground">Downloads</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
