import { useState, useEffect, useMemo } from "react";
import { ResourceCard } from "@/components/ResourceCard";
import { Navigation } from "@/components/Navigation";
import {
  Search,
  Upload,
  Star,
  FileText,
  BookOpen,
  Sparkles,
  ChevronRight,
  Clock,
  GraduationCap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import udsLogo from "@/assets/logo.jpg";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [stats, setStats] = useState({ courses: 0, resources: 0, notes: 0, questions: 0 });
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  // Fetch recent uploads + stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("verified", true)
          .order("created_at", { ascending: false })
          .limit(5);
        if (error) throw error;
        setRecentUploads(data || []);

        const { data: allRes } = await supabase
          .from("resources")
          .select("course_code, type")
          .eq("verified", true);
        const codes = new Set<string>();
        let notes = 0;
        let questions = 0;
        (allRes || []).forEach((r: any) => {
          codes.add(r.course_code);
          if (r.type === "note") notes++;
          if (r.type === "question") questions++;
        });
        setStats({
          courses: codes.size,
          resources: allRes?.length || 0,
          notes,
          questions,
        });
      } catch (err) {
        console.error("Error loading homepage data:", err);
      }
    };
    fetchData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    const q = searchQuery.trim();
    const handle = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const filter = `%${q.replace(/%/g, "\\%")}%`;
        const { data, error } = await supabase
          .from("resources")
          .select("id, title, course_code, type, verified, file_url, created_at")
          .or(`title.ilike.${filter},course_code.ilike.${filter}`)
          .eq("verified", true)
          .limit(50);
        if (error) throw error;
        setSearchResults(data ?? []);

        if (data && data.length > 0) {
          const counts: Record<string, number> = {};
          await Promise.all(
            data.map(async (resource) => {
              const { data: c } = await supabase.rpc("get_download_count", {
                resource_uuid: resource.id,
              });
              if (c !== null && c !== undefined) counts[resource.id] = c as number;
            }),
          );
          setDownloadCounts((prev) => ({ ...prev, ...counts }));
        }
      } catch (err: any) {
        console.error("Search error", err);
        toast({ title: "Search failed", description: err.message ?? String(err) });
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery, toast]);

  const requireAuth = (path: string, msg: string) => {
    if (!user) {
      toast({ title: "Login Required", description: msg });
      navigate("/auth");
      return false;
    }
    navigate(path);
    return true;
  };

  const handleDownload = async (resourceId: string, fileUrl: string, title: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to download resources" });
      navigate("/auth");
      return;
    }
    window.open(fileUrl, "_blank");
    toast({ title: "Download started", description: title });
    try {
      await supabase.from("downloads" as any).insert({ resource_id: resourceId, user_id: user.id });
    } catch (e) {
      console.warn("Error recording download", e);
    }
  };

  const handleView = (fileUrl: string, title: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to view resources" });
      navigate("/auth");
      return;
    }
    window.open(fileUrl, "_blank");
    toast({ title: "Opening preview", description: title });
  };

  const browseTiles = useMemo(
    () => [
      {
        label: "Past Questions",
        sub: `${stats.questions.toLocaleString()} documents`,
        icon: FileText,
        iconBg: "bg-orange-500",
        cardBg: "bg-orange-50",
        cardBorder: "border-orange-100",
        onClick: () => navigate("/browse"),
      },
      {
        label: "Lecture Notes",
        sub: `${stats.notes.toLocaleString()} files`,
        icon: BookOpen,
        iconBg: "bg-blue-500",
        cardBg: "bg-blue-50",
        cardBorder: "border-blue-100",
        onClick: () => navigate("/browse"),
      },
      {
        label: "Study Assistant",
        sub: "AI exam helper",
        icon: Sparkles,
        iconBg: "bg-purple-500",
        cardBg: "bg-purple-50",
        cardBorder: "border-purple-100",
        onClick: () => requireAuth("/study-assistant", "Please login to use the Study Assistant"),
      },
      {
        label: "Upload",
        sub: "Share a resource",
        icon: Upload,
        iconBg: "bg-emerald-600",
        cardBg: "bg-emerald-50",
        cardBorder: "border-emerald-100",
        onClick: () => requireAuth("/upload", "Please login or signup to upload resources"),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stats, user],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-screen-sm md:max-w-4xl bg-white min-h-screen shadow-sm">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-30">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
            aria-label="UDS StudyHub home"
          >
            <img src={udsLogo} alt="UDS Logo" className="h-9 w-9 rounded-lg object-cover" />
            <span className="font-bold text-slate-900 tracking-tight">UDS StudyHub</span>
          </button>
          <div className="text-slate-700">
            <Navigation />
          </div>
        </header>

        {/* Sign-in nudge */}
        {(!authLoading && !user) && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-900">
              <strong className="font-semibold">Welcome!</strong> Sign in to download,
              bookmark, and upload.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="text-xs font-semibold text-emerald-700 whitespace-nowrap"
            >
              Sign in →
            </button>
          </div>
        )}

        <main className="pb-12">
          {/* Hero */}
          <section className="px-5 py-8 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 mb-4">
              <GraduationCap className="h-3.5 w-3.5 text-yellow-300" />
              <span className="text-xs font-semibold text-yellow-300">
                Built for UDS Students
              </span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight mb-3">
              Master your courses with UDS StudyHub
            </h1>
            <p className="text-emerald-100/90 text-sm leading-relaxed mb-6">
              Past questions, lecture notes and study guides — shared by students,
              organized by level and trimester.
            </p>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, notes, or codes..."
                className="w-full py-3.5 pl-11 pr-4 bg-white rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-lg"
              />
            </form>

            {/* Primary CTA */}
            <button
              onClick={() => navigate("/browse")}
              className="mt-4 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-yellow-400 text-emerald-950 font-semibold text-sm shadow-md hover:bg-yellow-300 transition-colors active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Browse by level & trimester
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </section>

          {/* Stats */}
          <section className="flex justify-between items-center px-5 py-5 bg-white border-b border-slate-100">
            <div className="text-center flex-1">
              <span className="block text-lg font-bold text-slate-900">
                {stats.resources.toLocaleString()}+
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Resources
              </span>
            </div>
            <div className="w-px bg-slate-100 h-8" />
            <div className="text-center flex-1">
              <span className="block text-lg font-bold text-slate-900">
                {stats.courses}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Courses
              </span>
            </div>
            <div className="w-px bg-slate-100 h-8" />
            <div className="text-center flex-1">
              <span className="block text-lg font-bold text-slate-900">100%</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Free
              </span>
            </div>
          </section>

          {/* Browse grid */}
          <section className="px-5 pt-8">
            <div className="flex justify-between items-end mb-5">
              <h2 className="text-lg font-bold text-slate-900">Browse Resources</h2>
              <button
                onClick={() => navigate("/browse")}
                className="text-xs font-semibold text-emerald-700"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {browseTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <button
                    key={tile.label}
                    onClick={tile.onClick}
                    className={`text-left p-4 rounded-2xl border ${tile.cardBg} ${tile.cardBorder} active:scale-95 transition-transform`}
                  >
                    <div
                      className={`w-10 h-10 ${tile.iconBg} rounded-xl flex items-center justify-center mb-3 text-white shadow-sm`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="block font-bold text-slate-800 text-sm">
                      {tile.label}
                    </span>
                    <span className="text-[11px] text-slate-500">{tile.sub}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Search results or Recent Uploads */}
          {searchQuery.trim() ? (
            <section className="px-5 mt-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Search Results</h2>
              <div className="grid gap-3">
                {searchLoading && (
                  <div className="p-4 text-sm text-slate-500">Searching...</div>
                )}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="p-4 text-sm text-slate-500">No results found.</div>
                )}
                {!searchLoading &&
                  searchResults.map((r) => (
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
                      downloads={downloadCounts[r.id] || 0}
                      isBookmarked={bookmarkedIds.has(r.id)}
                      onView={() => handleView(r.file_url, r.title)}
                      onDownload={() => handleDownload(r.id, r.file_url, r.title)}
                      onBookmark={() => toggleBookmark(r.id)}
                    />
                  ))}
              </div>
            </section>
          ) : (
            <section className="px-5 mt-8">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold text-slate-900">Recent Uploads</h2>
                <button
                  onClick={() => navigate("/browse")}
                  className="text-xs font-semibold text-emerald-700"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2.5">
                {recentUploads.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    No resources uploaded yet. Be the first!
                  </div>
                ) : (
                  recentUploads.map((r) => {
                    const ext = (r.file_url || "").split(".").pop()?.toUpperCase().slice(0, 4) || "PDF";
                    const when = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";
                    return (
                      <button
                        key={r.id}
                        onClick={() => navigate(`/course/${r.course_code}`)}
                        className="w-full flex items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="w-10 h-12 bg-slate-100 rounded-md flex items-center justify-center mr-3 text-slate-500 font-bold text-[10px]">
                          {ext}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-800 truncate">
                            {r.title}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span>{r.course_code}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{when}</span>
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* Bookmarks quick-link */}
          <section className="px-5 mt-8">
            <button
              onClick={() => requireAuth("/bookmarks", "Please login or signup to view bookmarks")}
              className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
                  <Star className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800 text-sm">Your Bookmarks</p>
                  <p className="text-xs text-slate-500">Saved resources for later</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
