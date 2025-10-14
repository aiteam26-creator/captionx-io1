import { useState } from "react";
import { VideoUpload } from "@/components/VideoUpload";
import { VideoPreview } from "@/components/VideoPreview";
import { CaptionTimeline } from "@/components/CaptionTimeline";
import { WordEditor } from "@/components/WordEditor";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

const Index = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleVideoSelect = async (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    
    // Start caption generation
    await generateCaptions(file);
  };

  const generateCaptions = async (file: File) => {
    setIsGenerating(true);
    toast({
      title: "Generating captions...",
      description: "This may take a minute",
    });

    try {
      // Convert video to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(file);
      });

      // Call transcription function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ video: base64 }),
        }
      );

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      
      // Identify keywords using AI
      const keywordResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/identify-keywords`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text: data.text }),
        }
      );

      const keywordData = await keywordResponse.json();
      const keywords = new Set(keywordData.keywords || []);

      // Map captions with keyword markers
      const captionsWithKeywords = data.words.map((word: any) => ({
        word: word.word,
        start: word.start,
        end: word.end,
        isKeyword: keywords.has(word.word.toLowerCase()),
        fontSize: 32,
        fontFamily: "Inter",
        color: "#ffffff",
      }));

      setCaptions(captionsWithKeywords);
      toast({
        title: "Captions generated!",
        description: "Keywords are highlighted in yellow",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate captions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWordClick = (index: number, time: number) => {
    setCurrentTime(time);
  };

  const handleWordUpdate = (updates: Partial<Caption>) => {
    if (selectedWordIndex === null) return;

    setCaptions((prev) =>
      prev.map((caption, idx) =>
        idx === selectedWordIndex ? { ...caption, ...updates } : caption
      )
    );
  };

  const handleDownload = () => {
    toast({
      title: "Preparing download...",
      description: "Your video with captions will be ready soon",
    });
    // Download functionality would be implemented here
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {!videoFile ? (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">Video Caption Editor</h1>
          <p className="text-muted-foreground text-center mb-8">
            AI-powered caption generation with keyword emphasis
          </p>
          <VideoUpload onVideoSelect={handleVideoSelect} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Video Editor</h1>
              <Button onClick={handleDownload} disabled={isGenerating}>
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
            </div>
            
            {isGenerating ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                  <p>Generating captions...</p>
                </div>
              </div>
            ) : (
              <VideoPreview
                videoUrl={videoUrl}
                captions={captions}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
              />
            )}

            <WordEditor
              caption={selectedWordIndex !== null ? captions[selectedWordIndex] : null}
              onUpdate={handleWordUpdate}
            />
          </div>

          {/* Right Column - Caption Timeline */}
          <div className="lg:col-span-1">
            <CaptionTimeline
              captions={captions}
              currentTime={currentTime}
              onWordClick={handleWordClick}
              onWordSelect={setSelectedWordIndex}
              selectedWordIndex={selectedWordIndex}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
