import { useState, useRef } from "react";
import { VideoUpload } from "./VideoUpload";
import { VideoEditorCanvas } from "./VideoEditorCanvas";
import { CleanTimeline } from "./CleanTimeline";
import { PropertiesPanel } from "./PropertiesPanel";
import { CaptionGenerationLoader } from "./CaptionGenerationLoader";
import { ExportModal, ExportFormat } from "./ExportModal";
import { ExportProgress } from "./ExportProgress";
import { KeyframeExtractor } from "./KeyframeExtractor";
import { ThemedCaptionGenerator } from "./ThemedCaptionGenerator";
import { GlobalCaptionSettings } from "./GlobalCaptionSettings";
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
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoSelect = async (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    const id = `video-${Date.now()}`;
    setVideoId(id);
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

  const handleExport = async (format: ExportFormat) => {
    if (format === "video-burned") {
      await downloadVideoWithCaptions();
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
      downloadAssFile();
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

  const downloadAssFile = () => {
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
    
    toast({
      title: "Success! 🎉",
      description: "Styled ASS subtitle file downloaded",
    });
  };

  const downloadVideoWithCaptions = async () => {
    if (!videoRef.current || !videoFile) return;

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
    
    mediaRecorder.onstop = () => {
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
      
      setTimeout(() => {
        setIsExporting(false);
        toast({
          title: "Success! 🎉",
          description: "Your video with burned-in captions is ready",
        });
      }, 1000);
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
          <div className="flex-1 p-6 flex items-center justify-center">
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
            <h2 className="text-sm font-semibold">Settings</h2>
          </div>
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
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        captionCount={captions.length}
      />

      {/* Export Progress */}
      <ExportProgress
        open={isExporting}
        progress={exportProgress}
        status={exportStatus}
      />
    </div>
  );
};
