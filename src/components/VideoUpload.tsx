import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
}

export const VideoUpload = ({ onVideoSelect }: VideoUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a video file
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    // Check file size (25MB limit for OpenAI Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      toast.error(
        `Video file is too large (${fileSizeMB}MB). Maximum size is 25MB.`,
        {
          description: "Please use a shorter video or compress it using a tool like HandBrake or an online compressor.",
          duration: 6000,
        }
      );
      return;
    }

    onVideoSelect(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg p-8">
      <Upload className="w-16 h-16 mb-4 text-muted-foreground" />
      <h3 className="text-xl font-semibold mb-2">Upload Your Video</h3>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Upload a video to automatically generate captions with AI-powered keyword emphasis
      </p>
      <p className="text-xs text-muted-foreground mb-6 text-center">
        Maximum file size: 25MB
      </p>
      <label htmlFor="video-upload">
        <Button asChild>
          <span>Choose Video File</span>
        </Button>
      </label>
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
