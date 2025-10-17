import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload as UploadIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Upload successful!",
      description: "Your resource will be reviewed by moderators.",
    });
    setTimeout(() => navigate("/"), 1500);
  };

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
              <h1 className="text-xl font-bold">Upload Resource</h1>
              <p className="text-xs opacity-90">Share notes or questions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card className="card-academic p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Code */}
            <div className="space-y-2">
              <Label htmlFor="courseCode">Course Code *</Label>
              <Input 
                id="courseCode" 
                placeholder="e.g., CS 201" 
                required 
                className="h-12"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                placeholder="e.g., Final Exam Questions 2023" 
                required 
                className="h-12"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Resource Type *</Label>
              <Select required>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Lecture Notes</SelectItem>
                  <SelectItem value="question">Past Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year & Semester */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Select required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">First Semester</SelectItem>
                    <SelectItem value="second">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 Level</SelectItem>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Upload File *</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required
                />
                <label htmlFor="file" className="cursor-pointer">
                  <UploadIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  {file ? (
                    <p className="text-sm font-medium">{file.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click to upload PDF or Word document
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                placeholder="Add any additional information..."
                className="min-h-[100px]"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input 
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tags..."
                  className="h-12"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleAddTag}
                  className="h-12 px-6"
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                    >
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-primary hover:bg-primary-hover"
            >
              Submit for Review
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default Upload;
