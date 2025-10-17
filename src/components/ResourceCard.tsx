import { Download, Bookmark, CheckCircle, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResourceCardProps {
  id: string;
  title: string;
  courseCode: string;
  type: "note" | "question";
  year?: string;
  semester?: string;
  examType?: string;
  verified?: boolean;
  downloads: number;
  isBookmarked?: boolean;
  onView: () => void;
  onDownload: () => void;
  onBookmark: () => void;
}

export const ResourceCard = ({
  title,
  courseCode,
  type,
  year,
  semester,
  examType,
  verified,
  downloads,
  isBookmarked,
  onView,
  onDownload,
  onBookmark,
}: ResourceCardProps) => {
  return (
    <Card className="card-academic p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="text-xs shrink-0">
                {courseCode}
              </Badge>
              {verified && (
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
              )}
            </div>
            <h3 className="font-medium text-foreground line-clamp-2 text-sm">{title}</h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {year && <span>Year: {year}</span>}
          {semester && <span>• {semester}</span>}
          {examType && <span>• {examType}</span>}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">{downloads} downloads</span>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={onBookmark}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current text-secondary' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={onView}
            >
              <Eye className="h-4 w-4" />
              <span className="text-xs">View</span>
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-primary hover:bg-primary-hover"
              onClick={onDownload}
            >
              <Download className="h-4 w-4" />
              <span className="text-xs">Download</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
