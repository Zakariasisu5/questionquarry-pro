import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FilterBarProps {
  selectedYear?: string;
  selectedSemester?: string;
  selectedType?: string;
  onYearChange: (value: string) => void;
  onSemesterChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onClearFilters: () => void;
}

export const FilterBar = ({
  selectedYear,
  selectedSemester,
  selectedType,
  onYearChange,
  onSemesterChange,
  onTypeChange,
  onClearFilters,
}: FilterBarProps) => {
  const hasFilters = selectedYear || selectedSemester || selectedType;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2021">2021</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSemester} onValueChange={onSemesterChange}>
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value="first">First Semester</SelectItem>
            <SelectItem value="second">Second Semester</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="note">Lecture Notes</SelectItem>
            <SelectItem value="question">Past Questions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedYear && selectedYear !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Year: {selectedYear}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onYearChange("all")} />
            </Badge>
          )}
          {selectedSemester && selectedSemester !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {selectedSemester === "first" ? "First Sem" : "Second Sem"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onSemesterChange("all")} />
            </Badge>
          )}
          {selectedType && selectedType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {selectedType === "note" ? "Notes" : "Questions"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onTypeChange("all")} />
            </Badge>
          )}
          <button
            onClick={onClearFilters}
            className="text-xs text-primary hover:underline ml-auto"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
