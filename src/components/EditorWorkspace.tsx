import { useState, useRef } from "react";
import { CaptionTimeline } from "./CaptionTimeline";
import { WordEditor } from "./WordEditor";
import { VideoPreview } from "./VideoPreview";
import { VideoUpload } from "./VideoUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

export const EditorWorkspace = () => {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [assContent, setAssContent] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoSelect = async (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    
    // Start transcription
    await transcribeVideo(file);
  };

  const extractAudio = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const audioContext = new AudioContext();
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convert to WAV format
          const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
          );
          
          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineContext.destination);
          source.start();
          
          const renderedBuffer = await offlineContext.startRendering();
          
          // Convert to base64 using chunks to avoid stack overflow
          const wav = audioBufferToWav(renderedBuffer);
          const base64 = arrayBufferToBase64(wav);
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // Process in 32KB chunks
    let binary = '';
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        const sample = Math.max(-1, Math.min(1, channels[i][offset]));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
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
      });

      console.log('Calling transcribe-video function...');
      const { data, error } = await supabase.functions.invoke('transcribe-video', {
        body: { audioBase64 }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.captions) {
        throw new Error('No captions returned from API');
      }

      setProgress(80);
      console.log('Received captions:', data.captions.length);
      setCaptions(data.captions);
      setAssContent(data.assContent);
      setProgress(100);

      toast({
        title: "Success!",
        description: "Captions generated successfully",
      });
    } catch (error) {
      console.error('Error transcribing video:', error);
      toast({
        title: "Error",
        description: "Failed to generate captions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadASS = () => {
    if (!assContent) return;
    
    const blob = new Blob([assContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.ass';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleWordClick = (index: number, time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleWordSelect = (index: number) => {
    setSelectedWordIndex(index);
  };

  const handleWordUpdate = (updates: Partial<Caption>) => {
    if (selectedWordIndex === null) return;
    
    setCaptions(prev => prev.map((caption, index) => 
      index === selectedWordIndex 
        ? { ...caption, ...updates }
        : caption
    ));
  };

  const selectedCaption = selectedWordIndex !== null ? captions[selectedWordIndex] : null;

  if (!videoFile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <VideoUpload onVideoSelect={handleVideoSelect} />
      </div>
    );
  }

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {isProcessing && (
          <div className="mb-6 bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">Generating Captions...</h3>
            </div>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">{progress}% complete</p>
          </div>
        )}

        {captions.length > 0 && (
          <div className="mb-4 flex justify-end">
            <Button onClick={downloadASS} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download .ASS Captions
            </Button>
          </div>
        )}
        
        {/* Word Editor - Top */}
        {captions.length > 0 && (
          <WordEditor
            caption={selectedCaption}
            onUpdate={handleWordUpdate}
          />
        )}

        {/* Video Preview and Timeline - Below */}
        <div className="space-y-6">
          {videoUrl && (
            <div className="relative w-full">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full rounded-lg border border-border"
                controls
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
              {/* Caption overlay on video */}
              {(() => {
                const currentIndex = captions.findIndex(c => currentTime >= c.start && currentTime <= c.end);
                if (currentIndex === -1) return null;
                
                // Get 2 words before and 2 words after the current word (total 5 words)
                const startIndex = Math.max(0, currentIndex - 2);
                const endIndex = Math.min(captions.length, currentIndex + 3);
                const visibleWords = captions.slice(startIndex, endIndex);
                
                const currentCaption = captions[currentIndex];
                
                return (
                  <div 
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center justify-center pointer-events-none px-8"
                  >
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                      {visibleWords.map((caption, idx) => {
                        const isCurrentWord = startIndex + idx === currentIndex;
                        return (
                          <span
                            key={startIndex + idx}
                            style={{
                              fontFamily: caption.fontFamily || "Inter",
                              fontSize: `${caption.fontSize || 32}px`,
                              color: caption.color || "#ffffff",
                              fontWeight: caption.isKeyword ? "bold" : "normal",
                              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                              backgroundColor: isCurrentWord ? "rgba(59, 130, 246, 0.8)" : "transparent",
                              padding: isCurrentWord ? "4px 12px" : "0",
                              borderRadius: isCurrentWord ? "8px" : "0",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {caption.word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <CaptionTimeline
            captions={captions}
            currentTime={currentTime}
            onWordClick={handleWordClick}
            onWordSelect={handleWordSelect}
            selectedWordIndex={selectedWordIndex}
          />
        </div>
      </div>
    </section>
  );
};
