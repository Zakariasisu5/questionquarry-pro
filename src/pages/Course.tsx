import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FilterBar } from "@/components/FilterBar";
import { ResourceCard } from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockResources = [
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
    title: "Mid-term Questions 2023", 
    courseCode: "CS 201", 
    type: "question" as const,
    year: "2023",
    semester: "First Semester",
    examType: "Mid-term",
    verified: true,
    downloads: 189,
  },
  { 
    id: "3", 
    title: "Complete Lecture Notes - Chapter 1-5", 
    courseCode: "CS 201", 
    type: "note" as const,
    year: "2024",
    semester: "First Semester",
    verified: true,
    downloads: 456,
  },
  { 
    id: "4", 
    title: "Algorithm Analysis Notes", 
    courseCode: "CS 201", 
    type: "note" as const,
    year: "2024",
    semester: "First Semester",
    verified: false,
    downloads: 123,
  },
];

const Course = () => {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());

  const handleClearFilters = () => {
    setSelectedYear("all");
    setSelectedSemester("all");
    setSelectedType("all");
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

  // Filter resources
  const filteredResources = mockResources.filter((resource) => {
    if (selectedYear !== "all" && resource.year !== selectedYear) return false;
    if (selectedSemester !== "all" && resource.semester?.toLowerCase() !== `${selectedSemester} semester`) return false;
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
              {filteredResources.length} Resources Found
            </h2>
          </div>
          
          {filteredResources.length === 0 ? (
            <div className="card-academic p-8 text-center">
              <p className="text-muted-foreground">No resources match your filters</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={handleClearFilters}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredResources.map((resource) => (
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
          )}
        </section>
      </main>
    </div>
  );
};

export default Course;
