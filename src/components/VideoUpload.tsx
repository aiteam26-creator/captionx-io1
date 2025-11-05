import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
}

const SUPPORTED_FORMATS = ['video/mp4', 'video/webm', 'video/mpeg'];

export const VideoUpload = ({ onVideoSelect }: VideoUploadProps) => {
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Unsupported video format",
          description: "Please use MP4, WebM, or MPEG format"
        });
        return;
      }
      onVideoSelect(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg p-8">
      <Upload className="w-16 h-16 mb-4 text-muted-foreground" />
      <h3 className="text-xl font-semibold mb-2">Upload Your Video</h3>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Upload a video to automatically generate captions with AI-powered keyword emphasis
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Supported formats: MP4, WebM, MPEG
      </p>
      <label htmlFor="video-upload">
        <Button asChild>
          <span>Choose Video File</span>
        </Button>
      </label>
      <input
        id="video-upload"
        type="file"
        accept="video/mp4,video/webm,video/mpeg"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
