import { BookOpen, FileText, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourseCardProps {
  courseCode: string;
  courseName: string;
  noteCount: number;
  questionCount: number;
  lastUpdated: string;
  onClick: () => void;
}

export const CourseCard = ({ 
  courseCode, 
  courseName, 
  noteCount, 
  questionCount, 
  lastUpdated,
  onClick 
}: CourseCardProps) => {
  return (
    <Card 
      className="card-academic p-5 cursor-pointer hover:border-primary transition-all duration-300 btn-tap-target"
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{courseCode}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{courseName}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 bg-secondary text-secondary-foreground font-medium">
            {noteCount + questionCount}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span>{noteCount} notes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>{questionCount} questions</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
          <Clock className="h-3.5 w-3.5" />
          <span>Updated {lastUpdated}</span>
        </div>
      </div>
    </Card>
  );
};
