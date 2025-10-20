import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const useBookmarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        setBookmarkedIds(new Set());
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("bookmarks")
          .select("resource_id")
          .eq("user_id", user.id);

        if (error) throw error;

        const ids = new Set(data.map((b) => b.resource_id));
        setBookmarkedIds(ids);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  const toggleBookmark = async (resourceId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark resources",
        variant: "destructive",
      });
      return;
    }

    const isBookmarked = bookmarkedIds.has(resourceId);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("resource_id", resourceId);

        if (error) throw error;

        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });

        toast({ title: "Removed from bookmarks" });
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, resource_id: resourceId });

        if (error) throw error;

        setBookmarkedIds((prev) => new Set(prev).add(resourceId));
        toast({ title: "Added to bookmarks" });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  };

  return { bookmarkedIds, toggleBookmark, loading };
};
