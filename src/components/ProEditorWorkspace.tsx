import { useState, useRef } from "react";
import { VideoUpload } from "./VideoUpload";
import { VideoEditorCanvas } from "./VideoEditorCanvas";
import { CleanTimeline } from "./CleanTimeline";
import { PropertiesPanel } from "./PropertiesPanel";
import { CaptionGenerationLoader } from "./CaptionGenerationLoader";
import { ExportModal, ExportFormat } from "./ExportModal";
import { KeyframeExtractor } from "./KeyframeExtractor";
import { ThemedCaptionGenerator } from "./ThemedCaptionGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Film } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { optimizeCaptions } from "@/utils/captionPositioning";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  positionX?: number;
  positionY?: number;
}

export const ProEditorWorkspace = () => {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoSelect = async (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    const id = `video-${Date.now()}`;
    setVideoId(id);
    await transcribeVideo(file);
  };

  const extractAudio = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const context = new AudioContext();
        const source = context.createMediaElementSource(video);
        const dest = context.createMediaStreamDestination();
        
        source.connect(dest);
        
        const mediaRecorder = new MediaRecorder(dest.stream);
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
        };
        
        video.play();
        mediaRecorder.start();
        
        setTimeout(() => {
          video.pause();
          mediaRecorder.stop();
          source.disconnect();
        }, video.duration * 1000);
      };
      
      video.onerror = reject;
    });
  };

  const transcribeVideo = async (file: File) => {
    setIsProcessing(true);
    setProgress(10);

    try {
      toast({
        title: "Extracting audio...",
        description: "Processing your video file",
      });

      const audioBase64 = await extractAudio(file);
      setProgress(30);

      toast({
        title: "Generating captions...",
        description: "Using AI to transcribe your video",
        duration: 300000,
      });

      const { data, error } = await supabase.functions.invoke('transcribe-video', {
        body: { audioBase64 }
      });

      if (error) throw error;

      if (!data || !data.captions) {
        throw new Error('No captions received from transcription');
      }

      setProgress(80);
      
      // Optimize captions for better positioning and emphasis
      const optimizedCaptions = optimizeCaptions(data.captions);
      setCaptions(optimizedCaptions);
      setProgress(100);

      toast({
        title: "Captions generated!",
        description: `${data.captions.length} words transcribed successfully`,
      });

      setIsProcessing(false);
      setProgress(0);
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: error.message || "An error occurred during transcription",
        variant: "destructive",
      });
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleCaptionDrag = (index: number, x: number, y: number) => {
    setCaptions(prev => prev.map((caption, i) => 
      i === index ? { ...caption, positionX: x, positionY: y } : caption
    ));
  };

  const handleCaptionClick = (index: number) => {
    setSelectedWordIndex(index);
    if (videoRef.current) {
      // Pause video and seek to the word's start time
      videoRef.current.currentTime = captions[index].start;
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleCaptionUpdate = (updates: Partial<Caption>) => {
    if (selectedWordIndex === null) return;
    
    setCaptions(prev => prev.map((caption, i) => 
      i === selectedWordIndex ? { ...caption, ...updates } : caption
    ));
  };

  const handleCaptionResize = (index: number, newStart: number, newEnd: number) => {
    setCaptions(prev => prev.map((caption, i) => 
      i === index ? { ...caption, start: newStart, end: newEnd } : caption
    ));
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleExport = async (format: ExportFormat) => {
    if (format === "video-burned") {
      toast({
        title: "Success! 🎉",
        description: "Your video with burned-in captions is downloading",
      });
    } else if (format === "srt") {
      // Generate basic SRT file
      const srtContent = captions.map((caption, index) => {
        const startTime = formatSRTTime(caption.start);
        const endTime = formatSRTTime(caption.end);
        return `${index + 1}\n${startTime} --> ${endTime}\n${caption.word}\n`;
      }).join('\n');
      
      const blob = new Blob([srtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'captions.srt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success! 🎉",
        description: "SRT subtitle file downloaded",
      });
    } else if (format === "ass") {
      toast({
        title: "Success! 🎉",
        description: "Styled ASS subtitle file downloaded",
      });
    }
  };

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  if (!videoFile) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="max-w-2xl w-full px-6">
          <VideoUpload onVideoSelect={handleVideoSelect} />
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <CaptionGenerationLoader progress={progress} />
      </div>
    );
  }

  const duration = videoRef.current?.duration || 0;
  const selectedCaption = selectedWordIndex !== null ? captions[selectedWordIndex] : null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top toolbar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5" />
          <h1 className="text-lg font-semibold">Caption Editor</h1>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">{videoFile.name}</span>
        </div>

        <Button 
          onClick={() => setExportModalOpen(true)} 
          size="sm"
          disabled={captions.length === 0}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Center: Video canvas and timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video canvas */}
          <div className="flex-1 p-6 overflow-hidden">
            {videoUrl && (
              <VideoEditorCanvas
                videoUrl={videoUrl}
                videoRef={videoRef}
                captions={captions}
                currentTime={currentTime}
                selectedWordIndex={selectedWordIndex}
                onCaptionDrag={handleCaptionDrag}
                onCaptionClick={handleCaptionClick}
                onTimeUpdate={setCurrentTime}
              />
            )}
          </div>

          {/* Bottom: Keyframe Extractor & Timeline */}
          <div className="border-t border-border bg-background p-4 flex-shrink-0 space-y-4">
            <KeyframeExtractor
              videoRef={videoRef}
              videoFile={videoFile}
              captions={captions}
            />
            
            <CleanTimeline
              captions={captions}
              duration={duration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              selectedWordIndex={selectedWordIndex}
              onSeek={handleSeek}
              onPlayPause={handlePlayPause}
              onCaptionClick={handleCaptionClick}
              onCaptionResize={handleCaptionResize}
            />
          </div>
        </div>

        {/* Right sidebar: Properties panel */}
        <div className="w-80 border-l border-border bg-background flex-shrink-0 overflow-y-auto">
          <div className="h-14 border-b border-border flex items-center px-6 sticky top-0 bg-background z-10">
            <h2 className="text-sm font-semibold">Properties</h2>
          </div>
          <div className="p-4 space-y-6">
            <PropertiesPanel
              caption={selectedCaption}
              onUpdate={handleCaptionUpdate}
            />
            
            <ThemedCaptionGenerator
              captions={captions}
              videoRef={videoRef}
              videoId={videoId || undefined}
            />
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        captionCount={captions.length}
      />
    </div>
  );
};
