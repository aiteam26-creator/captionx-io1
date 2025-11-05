import { useState, useRef } from "react";
import { VideoUpload } from "./VideoUpload";
import { VideoEditorCanvas } from "./VideoEditorCanvas";
import { CleanTimeline } from "./CleanTimeline";
import { PropertiesPanel } from "./PropertiesPanel";
import { CaptionGenerationLoader } from "./CaptionGenerationLoader";
import { ExportProgress } from "./ExportProgress";
import { ThemedCaptionGenerator } from "./ThemedCaptionGenerator";
import { GlobalCaptionSettings } from "./GlobalCaptionSettings";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { analytics } from "@/utils/analytics";
import { Download, Film, Settings, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { optimizeCaptions } from "@/utils/captionPositioning";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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
  const isMobile = useIsMobile();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportComplete, setExportComplete] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoSelect = async (file: File) => {
    // Track upload started
    await analytics.trackUploadStarted(undefined, { 
      fileSize: file.size,
      fileType: file.type 
    });

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    const id = `video-${Date.now()}`;
    setVideoId(id);

    // Track project created
    await analytics.trackProjectCreated(undefined, { videoId: id });
    
    await transcribeVideo(file);
  };

  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const transcribeVideo = async (file: File) => {
    setIsProcessing(true);
    setProgress(10);

    try {
      toast({
        title: "Generating captions...",
        description: "Processing your video with AI",
        duration: 300000,
      });

      const videoBase64 = await fileToBase64(file);
      setProgress(30);

      const { data, error } = await supabase.functions.invoke('transcribe-video', {
        body: { videoBase64, mimeType: file.type }
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

      // Track upload completed
      await analytics.trackUploadCompleted(undefined, { 
        captionCount: data.captions.length,
        videoDuration: videoRef.current?.duration 
      });

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
    if (videoRef.current && isPlaying) {
      // Just pause the video, don't seek
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleCaptionUpdate = (updates: Partial<Caption>) => {
    if (selectedWordIndex === null) return;
    
    setCaptions(prev => prev.map((caption, i) => 
      i === selectedWordIndex ? { ...caption, ...updates } : caption
    ));
  };

  const handleGlobalCaptionUpdate = (updates: Partial<Caption>) => {
    setCaptions(prev => prev.map(caption => ({
      ...caption,
      ...updates
    })));
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

  const handleExport = async () => {
    setExportError(null);
    setExportComplete(false);
    try {
      await downloadVideoWithCaptions();
    } catch (error: any) {
      console.error('Export error:', error);
      setExportError(error.message || "Export failed");
      toast({
        title: "Export failed",
        description: error.message || "An error occurred during export",
        variant: "destructive",
      });
    }
  };

  const generateAssContent = (): string => {
    const assHeader = `[Script Info]
Title: Generated Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${captions[0]?.fontFamily || 'Inter'},${captions[0]?.fontSize || 32},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const formatAssTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const centisecs = Math.floor((seconds % 1) * 100);
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centisecs).padStart(2, '0')}`;
    };

    const events = captions.map((caption) => {
      const start = formatAssTime(caption.start);
      const end = formatAssTime(caption.end);
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${caption.word}`;
    }).join('\n');

    return assHeader + events;
  };

  const downloadAssFile = async () => {
    const assContent = generateAssContent();
    const blob = new Blob([assContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.ass';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Track export success
    await analytics.trackExportSuccess(undefined, { format: "ass" });
    
    toast({
      title: "Success! 🎉",
      description: "Styled ASS subtitle file downloaded",
    });
  };

  const downloadVideoWithCaptions = async () => {
    if (!videoRef.current || !videoFile) {
      throw new Error("No video loaded");
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatus("Initializing video processing...");

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use video dimensions or scale to reasonable size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Capture video stream from canvas at 30fps
    const canvasStream = canvas.captureStream(30);
    const videoTrack = canvasStream.getVideoTracks()[0];
    
    // Create a new MediaStream from the video element to get audio
    const videoStream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream();
    const audioTrack = videoStream.getAudioTracks()[0];
    
    // Combine video track from canvas with audio track from video
    const combinedStream = new MediaStream();
    combinedStream.addTrack(videoTrack);
    if (audioTrack) {
      combinedStream.addTrack(audioTrack);
    }
    
    // Use high quality settings to prevent stuttering
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 12000000, // Higher bitrate for better quality
      audioBitsPerSecond: 256000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    
    mediaRecorder.onstop = async () => {
      setExportStatus("Finalizing download...");
      setExportProgress(95);
      
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video-with-captions.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      setExportStatus("Export complete!");
      setExportComplete(true);

      // Track export success
      await analytics.trackExportSuccess(undefined, { format: "video-burned" });
      
      toast({
        title: "Success! 🎉",
        description: "Your video with burned-in captions is ready",
      });
    };

    video.currentTime = 0;
    await new Promise(resolve => {
      video.onseeked = resolve;
    });

    setExportStatus("Rendering video with captions...");
    mediaRecorder.start();
    video.play();

    const duration = video.duration;
    
    // Better scaling - ensure captions are always visible and properly sized
    // Base the scale on the smaller dimension to ensure captions fit
    const baseSize = Math.min(canvas.width, canvas.height);
    const scaleFactor = baseSize / 1080; // Use 1080p as reference
    
    // Track rendering state
    let isRendering = true;
    let lastUpdateTime = 0;
    
    const renderLoop = () => {
      if (!isRendering) return;
      
      const currentTime = video.currentTime;
      
      // Only update every frame (30fps = ~33ms)
      const now = Date.now();
      if (now - lastUpdateTime < 30) {
        requestAnimationFrame(renderLoop);
        return;
      }
      lastUpdateTime = now;
      
      const progress = Math.min((currentTime / duration) * 90, 90);
      setExportProgress(progress);
      setExportStatus(`Rendering: ${Math.floor(currentTime)}s / ${Math.floor(duration)}s`);
      
      // Clear canvas and draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Filter captions for current time
      const activeCaptions = captions.filter(
        caption => currentTime >= caption.start && currentTime <= caption.end
      );

      // Render each active caption with better sizing
      activeCaptions.forEach((caption) => {
        // Use larger base font size and scale appropriately
        const baseFontSize = caption.fontSize || 64;
        // Ensure minimum readable size - scale up for larger videos
        const scaledFontSize = Math.max(baseFontSize * scaleFactor, 48);
        const fontFamily = caption.fontFamily || 'Inter';
        const color = caption.color || '#ffffff';
        const bgColor = caption.backgroundColor || 'transparent';
        
        ctx.font = `bold ${scaledFontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate position based on percentage
        const x = (caption.positionX || 50) * canvas.width / 100;
        const y = (caption.positionY || 85) * canvas.height / 100;

        // Draw background if specified
        if (bgColor !== 'transparent') {
          const metrics = ctx.measureText(caption.word);
          const padding = 20 * scaleFactor;
          ctx.fillStyle = bgColor;
          ctx.fillRect(
            x - metrics.width / 2 - padding,
            y - scaledFontSize / 2 - padding,
            metrics.width + padding * 2,
            scaledFontSize + padding * 2
          );
        }

        // Draw thick text outline for better visibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(6 * scaleFactor, 4);
        ctx.strokeText(caption.word, x, y);
        
        // Draw filled text
        ctx.fillStyle = color;
        ctx.fillText(caption.word, x, y);
      });

      // Continue rendering
      requestAnimationFrame(renderLoop);
    };

    // Start rendering loop
    requestAnimationFrame(renderLoop);
    
    // Stop recording when video ends
    video.onended = () => {
      isRendering = false;
      mediaRecorder.stop();
    };
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

  // Settings panel content (shared between mobile drawer and desktop sidebar)
  const SettingsContent = () => (
    <div className="p-4 space-y-6">
      {/* Global Settings */}
      <GlobalCaptionSettings
        captions={captions}
        onApplySettings={handleGlobalCaptionUpdate}
      />

      <Separator />

      {/* Individual Caption Properties */}
      <PropertiesPanel
        caption={selectedCaption}
        onUpdate={handleCaptionUpdate}
      />
      
      <Separator />

      {/* AI Themed Captions */}
      <ThemedCaptionGenerator
        captions={captions}
        videoRef={videoRef}
        videoId={videoId || undefined}
      />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background transition-colors duration-200">
      {/* Top toolbar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <Film className="w-5 h-5" />
          <h1 className="text-base md:text-lg font-semibold">Caption Editor</h1>
          <Separator orientation="vertical" className="h-6 hidden md:block" />
          <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[150px] md:max-w-none">
            {videoFile.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          
          <Button 
            onClick={handleExport} 
            size="sm"
            disabled={captions.length === 0 || isExporting}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Center: Video canvas and timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video canvas */}
          <div className="flex-1 p-3 md:p-6 flex items-center justify-center">
            {videoUrl && (
              <div className="w-full max-w-5xl">
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
              </div>
            )}
          </div>

          {/* Bottom: Timeline */}
          <div className="border-t border-border bg-background p-2 md:p-4 flex-shrink-0 transition-all duration-200">
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

          {/* Mobile: Styling Panel (below timeline, only when word selected) */}
          {isMobile && selectedWordIndex !== null && (
            <div className="border-t-2 border-primary/20 bg-card flex-shrink-0 overflow-hidden animate-slide-in max-h-[45vh]">
              <div className="sticky top-0 z-10 bg-gradient-to-b from-card to-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Styling Controls
                  </span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWordIndex(null)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  ✕
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[calc(45vh-60px)] overscroll-contain">
                <SettingsContent />
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: Properties panel (Desktop only) */}
        {!isMobile && (
          <div className="w-80 border-l border-border bg-background flex-shrink-0 overflow-y-auto">
            <div className="h-14 border-b border-border flex items-center px-6 sticky top-0 bg-background z-10">
              <h2 className="text-sm font-semibold">Settings</h2>
            </div>
            <SettingsContent />
          </div>
        )}
      </div>

      {/* Export Progress/Complete Dialog */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            {exportComplete ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-center">Export Complete!</h3>
                <p className="text-sm text-muted-foreground text-center">{exportStatus}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsExporting(false);
                      setExportComplete(false);
                      setExportProgress(0);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : exportError ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <X className="w-8 h-8 text-destructive" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-center">Export Failed</h3>
                <p className="text-sm text-muted-foreground text-center">{exportError}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsExporting(false);
                      setExportError(null);
                      setExportProgress(0);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setExportError(null);
                      handleExport();
                    }}
                    className="flex-1"
                  >
                    Retry
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-center">Exporting Video</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{exportStatus}</span>
                    <span className="font-mono font-semibold">{Math.round(exportProgress)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
