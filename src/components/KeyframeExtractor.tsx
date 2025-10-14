import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { detectShotsAndExtractKeyframes } from "@/utils/keyframeExtractor";
import { Film, Loader2 } from "lucide-react";
import { Progress } from "./ui/progress";
import { Card } from "./ui/card";

interface Caption {
  word: string;
  start: number;
  end: number;
}

interface KeyframeExtractorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoFile: File | null;
  captions: Caption[];
}

export const KeyframeExtractor = ({ videoRef, videoFile, captions }: KeyframeExtractorProps) => {
  const { toast } = useToast();
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [keyframes, setKeyframes] = useState<any[]>([]);

  const handleExtractKeyframes = async () => {
    if (!videoRef.current || !videoFile) {
      toast({
        title: "Error",
        description: "No video loaded",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    setProgress(0);
    setKeyframes([]);

    try {
      toast({
        title: "Extracting keyframes...",
        description: "Analyzing video for shot changes",
      });

      const videoId = `video-${Date.now()}`;
      const extractedKeyframes = await detectShotsAndExtractKeyframes(
        videoRef.current,
        videoId,
        captions,
        setProgress
      );

      setKeyframes(extractedKeyframes);

      toast({
        title: "Success! 🎬",
        description: `Extracted ${extractedKeyframes.length} keyframes from ${extractedKeyframes[extractedKeyframes.length - 1]?.shot_number || 0} shots`,
      });
    } catch (error) {
      console.error('Keyframe extraction error:', error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          onClick={handleExtractKeyframes}
          disabled={isExtracting || !videoFile || captions.length === 0}
          className="gap-2"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting Keyframes...
            </>
          ) : (
            <>
              <Film className="w-4 h-4" />
              Extract Keyframes
            </>
          )}
        </Button>
        
        {keyframes.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {keyframes.length} keyframes extracted
          </span>
        )}
      </div>

      {isExtracting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground">
            Analyzing video shots... {progress}%
          </p>
        </div>
      )}

      {keyframes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Extracted Keyframes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {keyframes.map((keyframe, index) => (
              <Card key={index} className="overflow-hidden hover:ring-2 ring-primary transition-all">
                <img 
                  src={keyframe.image_url} 
                  alt={`Shot ${keyframe.shot_number}`}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-2 space-y-1">
                  <p className="text-xs font-semibold">Shot {keyframe.shot_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {keyframe.timestamp.toFixed(2)}s
                  </p>
                  {keyframe.transcription && (
                    <p className="text-xs line-clamp-2 italic">
                      "{keyframe.transcription}"
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
