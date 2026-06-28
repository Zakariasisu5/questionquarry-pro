import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, GraduationCap, CalendarDays, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type CourseRow = {
  id: string;
  code: string;
  title: string;
  level: string;
  trimester: string;
  lecturer: string | null;
  updated_at: string;
};

const TRIMESTER_LABEL: Record<string, string> = {
  "1": "First Trimester",
  "2": "Second Trimester",
  "3": "Third Trimester",
};

// simple session-scoped cache
const cache = {
  levels: null as string[] | null,
  trimesters: new Map<string, string[]>(),
  courses: new Map<string, CourseRow[]>(),
  counts: new Map<string, number>(),
};

const Browse = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();

  const level = params.get("level") || "";
  const trimester = params.get("trimester") || "";
  const step: "level" | "trimester" | "courses" = !level ? "level" : !trimester ? "trimester" : "courses";

  const [levels, setLevels] = useState<string[] | null>(cache.levels);
  const [trimesters, setTrimesters] = useState<string[] | null>(level ? cache.trimesters.get(level) ?? null : null);
  const [courses, setCourses] = useState<CourseRow[] | null>(
    level && trimester ? cache.courses.get(`${level}|${trimester}`) ?? null : null
  );
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch levels
  useEffect(() => {
    if (step !== "level" || levels) return;
    setLoading(true);
    (async () => {
      const { data, error } = await (supabase as any)
        .from("courses")
        .select("level");
      if (error) {
        toast({ title: "Failed to load levels", description: error.message, variant: "destructive" });
      } else {
        const unique = Array.from(new Set((data || []).map((r: any) => r.level as string))).sort();
        cache.levels = unique as string[];
        setLevels(unique as string[]);
      }
      setLoading(false);
    })();
  }, [step, levels, toast]);

  // Fetch trimesters for level
  useEffect(() => {
    if (step !== "trimester" || !level) return;
    if (cache.trimesters.has(level)) {
      setTrimesters(cache.trimesters.get(level)!);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await (supabase as any)
        .from("courses")
        .select("trimester")
        .eq("level", level);
      if (error) {
        toast({ title: "Failed to load trimesters", description: error.message, variant: "destructive" });
      } else {
        const unique = Array.from(new Set((data || []).map((r: any) => r.trimester as string))).sort();
        cache.trimesters.set(level, unique as string[]);
        setTrimesters(unique as string[]);
      }
      setLoading(false);
    })();
  }, [step, level, toast]);

  // Fetch courses + resource counts
  useEffect(() => {
    if (step !== "courses" || !level || !trimester) return;
    const key = `${level}|${trimester}`;
    if (cache.courses.has(key)) {
      setCourses(cache.courses.get(key)!);
    }
    setLoading(true);
    (async () => {
      const { data, error } = await (supabase as any)
        .from("courses")
        .select("id, code, title, level, trimester, lecturer, updated_at")
        .eq("level", level)
        .eq("trimester", trimester)
        .order("code");
      if (error) {
        toast({ title: "Failed to load courses", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const list = (data || []) as CourseRow[];
      cache.courses.set(key, list);
      setCourses(list);

      // counts
      if (list.length) {
        const codes = list.map((c) => c.code);
        const { data: res } = await supabase
          .from("resources")
          .select("course_code")
          .in("course_code", codes)
          .eq("verified", true);
        const map: Record<string, number> = {};
        (res || []).forEach((r: any) => {
          map[r.course_code] = (map[r.course_code] || 0) + 1;
        });
        list.forEach((c) => cache.counts.set(c.code, map[c.code] || 0));
        setCounts(map);
      }
      setLoading(false);
    })();
  }, [step, level, trimester, toast]);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const goBack = () => {
    if (step === "courses") {
      const p = new URLSearchParams(params);
      p.delete("trimester");
      setParams(p);
    } else if (step === "trimester") {
      const p = new URLSearchParams(params);
      p.delete("level");
      setParams(p);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={goBack}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">Browse Resources</h1>
            <nav className="text-xs opacity-90 flex items-center gap-1 flex-wrap">
              <button onClick={() => setParams(new URLSearchParams())} className="hover:underline">
                Levels
              </button>
              {level && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <button
                    onClick={() => {
                      const p = new URLSearchParams();
                      p.set("level", level);
                      setParams(p);
                    }}
                    className="hover:underline"
                  >
                    Level {level}
                  </button>
                </>
              )}
              {trimester && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span>{TRIMESTER_LABEL[trimester] || `Trimester ${trimester}`}</span>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 animate-in fade-in duration-300">
        {step === "level" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Select your academic level</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose a level to see available trimesters.</p>
            </div>
            {loading && !levels ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : levels && levels.length === 0 ? (
              <EmptyState message="No academic levels available yet." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {levels?.map((lv) => (
                  <Card
                    key={lv}
                    onClick={() => {
                      const p = new URLSearchParams();
                      p.set("level", lv);
                      setParams(p);
                    }}
                    className="card-academic p-6 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <GraduationCap className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Level</p>
                        <p className="text-3xl font-bold">{lv}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {step === "trimester" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Select a trimester</h2>
              <p className="text-sm text-muted-foreground mt-1">Showing trimesters with courses for Level {level}.</p>
            </div>
            {loading && !trimesters ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : trimesters && trimesters.length === 0 ? (
              <EmptyState message="No trimesters available for this level yet." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {trimesters?.map((t) => (
                  <Card
                    key={t}
                    onClick={() => {
                      const p = new URLSearchParams(params);
                      p.set("trimester", t);
                      setParams(p);
                    }}
                    className="card-academic p-5 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                        <CalendarDays className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Trimester</p>
                        <p className="text-lg font-semibold">{TRIMESTER_LABEL[t] || `Trimester ${t}`}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {step === "courses" && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Available courses</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Level {level} · {TRIMESTER_LABEL[trimester] || `Trimester ${trimester}`}
                </p>
              </div>
              <div className="relative sm:w-72">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {loading && !courses ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <EmptyState
                message={
                  courses && courses.length === 0
                    ? "No courses available for this trimester yet."
                    : "No courses match your search."
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((c) => (
                  <Card
                    key={c.id}
                    onClick={() => navigate(`/course/${c.code}`)}
                    className="card-academic p-5 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold truncate">{c.code}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{c.title}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {counts[c.code] ?? cache.counts.get(c.code) ?? 0}
                        </Badge>
                      </div>
                      {c.lecturer && (
                        <p className="text-xs text-muted-foreground">Lecturer: {c.lecturer}</p>
                      )}
                      <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                        Updated {new Date(c.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <Card className="card-academic p-8 text-center">
    <p className="text-muted-foreground">{message}</p>
  </Card>
);

export default Browse;
