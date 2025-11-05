import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
}

const SUPPORTED_FORMATS = ['video/mp4', 'video/webm', 'video/mpeg'];
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
      
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        toast({
          variant: "destructive",
          title: "File size exceeds 25MB limit",
          description: `Your video is ${fileSizeMB}MB. Please use a video smaller than 25MB.`
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
      <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center">
        <p className="text-sm font-medium mb-1">Supported Formats</p>
        <p className="text-sm text-muted-foreground">MP4, WebM, MPEG</p>
        <p className="text-sm font-medium mt-3 mb-1">Maximum File Size</p>
        <p className="text-sm text-muted-foreground">25MB</p>
      </div>
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
