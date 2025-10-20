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
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";

interface Course {
  code: string;
  name: string;
  notes: number;
  questions: number;
  updated: string;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({ courses: 0, resources: 0, downloads: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('course_code, type')
          .eq('verified', true);

        if (error) throw error;

        // Group by course_code and count types
        const courseMap = new Map<string, { notes: number; questions: number }>();
        data?.forEach((resource) => {
          const code = resource.course_code;
          if (!courseMap.has(code)) {
            courseMap.set(code, { notes: 0, questions: 0 });
          }
          const counts = courseMap.get(code)!;
          if (resource.type === 'note') counts.notes++;
          if (resource.type === 'question') counts.questions++;
        });

        const coursesArray = Array.from(courseMap.entries()).map(([code, counts]) => ({
          code,
          name: code,
          notes: counts.notes,
          questions: counts.questions,
          updated: 'Recently',
        }));

        setCourses(coursesArray.slice(0, 6));
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };

    fetchCourses();
  }, []);

  // Fetch recent uploads
  useEffect(() => {
    const fetchRecentUploads = async () => {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('verified', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setRecentUploads(data || []);
      } catch (err) {
        console.error('Error fetching recent uploads:', err);
      }
    };

    fetchRecentUploads();
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: resources, error: resourcesError } = await supabase
          .from('resources')
          .select('course_code', { count: 'exact' })
          .eq('verified', true);

        if (resourcesError) throw resourcesError;

        const uniqueCourses = new Set(resources?.map(r => r.course_code) || []).size;

        setStats({
          courses: uniqueCourses,
          resources: resources?.length || 0,
          downloads: 0, // This would need to be tracked separately
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, []);

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
        let results: any[] = data ?? [];

        // If current user exists, also include their own unverified uploads that match the query
        if (user) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('resources')
              .select('id, title, course_code, type, verified, file_url, created_at')
              .eq('contributor_id', user.id)
              .eq('verified', false)
              .limit(50);

            if (!userError && userData) {
              // client-side filter to match title or course_code
              const qLower = q.toLowerCase();
              const filtered = (userData as any[]).filter((r) => {
                return (
                  (r.title || '').toLowerCase().includes(qLower) ||
                  (r.course_code || '').toLowerCase().includes(qLower)
                );
              });

              // merge and dedupe by id
              const ids = new Set(results.map((r) => r.id));
              for (const item of filtered) {
                if (!ids.has(item.id)) {
                  results.push(item);
                  ids.add(item.id);
                }
              }
            }
          } catch (e) {
            console.warn('Error fetching user unverified resources', e);
          }
        }

        setSearchResults(results);
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
            {courses.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No courses available yet. Be the first to upload!
              </div>
            ) : (
              courses.map((course, index) => (
                <CourseCard
                  key={`${course.code}-${index}`}
                  courseCode={course.code}
                  courseName={course.name}
                  noteCount={course.notes}
                  questionCount={course.questions}
                  lastUpdated={course.updated}
                  onClick={() => handleCourseClick(course.code)}
                />
              ))
            )}
          </div>
        </section>

        {/* Search Results or Recent Uploads */}
        {searchQuery.trim() ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Search Results</h2>
              {user && (
                <div className="text-xs text-muted-foreground">Showing verified results plus your pending uploads</div>
              )}
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
                  isBookmarked={bookmarkedIds.has(r.id)}
                  onView={() => handleView(r.file_url, r.title)}
                  onDownload={() => handleDownload(r.file_url, r.title)}
                  onBookmark={() => toggleBookmark(r.id)}
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
              {recentUploads.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No resources uploaded yet. Be the first!
                </div>
              ) : (
                recentUploads.map((resource) => (
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
                ))
              )}
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="card-academic p-6 text-center space-y-3">
          <h3 className="text-lg font-semibold">Community Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.courses}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{stats.resources}</p>
              <p className="text-xs text-muted-foreground">Resources</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{stats.downloads}</p>
              <p className="text-xs text-muted-foreground">Downloads</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
