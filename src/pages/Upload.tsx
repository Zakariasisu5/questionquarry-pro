import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload as UploadIcon, X, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { user, loading: authLoading } = useAuth();

  // form fields
  const [courseCode, setCourseCode] = useState("");
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<"note" | "question" | "">("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return FileSpreadsheet;
    return FileText;
  };

  const getFileTypeLabel = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext?.toUpperCase() || 'Unknown';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileType(getFileTypeLabel(selectedFile.name));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Not signed in", description: "You must be signed in to upload." });
      return;
    }

    if (!file) {
      toast({ title: "No file selected", description: "Please choose a file to upload." });
      return;
    }

    if (!courseCode || !title || !resourceType) {
      toast({ title: "Missing fields", description: "Please fill required fields." });
      return;
    }

    setUploading(true);

    try {
      // Ensure you have created a storage bucket named 'resources' in Supabase
      const bucket = 'resources';
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Get a public URL for the uploaded file
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl ?? '';

      // Insert resource record for review
      const { data: insertData, error: insertError } = await supabase
        .from('resources')
        .insert({
          contributor_id: user.id,
          course_code: courseCode,
          title,
          type: resourceType || 'note',
          file_url: publicUrl,
          verified: false
        })
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      toast({
        title: 'Upload successful',
        description: 'Your resource was uploaded and submitted for review.'
      });

      // navigate home after a short delay
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) {
      console.error('Upload failed', err);

      const msg = err?.message ?? String(err);

      // Detect common storage bucket missing error and provide guidance
      if (msg.toLowerCase().includes('bucket') || msg.toLowerCase().includes('not found')) {
        toast({
          title: 'Storage bucket not found',
          description:
            "The storage bucket 'resources' was not found. Create it in Supabase Cloud: Project → Storage → Buckets → New bucket (name: resources). Then retry.",
        });
      } else {
        toast({ title: 'Upload failed', description: msg });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            <Navigation />
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
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Final Exam Questions 2023" 
                required 
                className="h-12"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Resource Type *</Label>
              <Select required onValueChange={(v) => setResourceType(v as any)}>
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
                <Select required onValueChange={(v) => setYear(v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Select required onValueChange={(v) => setSemester(v)}>
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
              <Select onValueChange={(v) => setLevel(v)}>
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
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileChange}
                  required
                />
                <label htmlFor="file" className="cursor-pointer">
                  <UploadIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  {file ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        {(() => {
                          const Icon = getFileIcon(file.name);
                          return <Icon className="h-5 w-5 text-primary" />;
                        })()}
                        <p className="text-sm font-medium">{file.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {fileType} File
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload document or image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported: PDF, Word, PowerPoint, Excel, Images
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              disabled={uploading || authLoading}
              className="w-full h-12 text-base bg-primary hover:bg-primary-hover"
            >
              {uploading ? 'Uploading...' : 'Submit for Review'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default Upload;
