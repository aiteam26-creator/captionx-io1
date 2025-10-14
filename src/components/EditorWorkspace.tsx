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
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  positionX?: number;
  positionY?: number;
}

export const EditorWorkspace = () => {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [editedCaption, setEditedCaption] = useState<Caption | null>(null);
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
    setEditedCaption({ ...captions[index] });
  };

  const handleWordUpdate = (updates: Partial<Caption>) => {
    if (!editedCaption) return;
    setEditedCaption({ ...editedCaption, ...updates });
  };

  const saveWordChanges = () => {
    if (selectedWordIndex === null || !editedCaption) return;
    
    setCaptions(prev => prev.map((caption, index) => 
      index === selectedWordIndex 
        ? { ...editedCaption }
        : caption
    ));

    toast({
      title: "Changes saved!",
      description: "Your caption edits have been applied",
    });
  };

  const selectedCaption = editedCaption;

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
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <h2 className="text-5xl font-bebas tracking-wide text-gradient mb-2 bg-[length:200%_200%] animate-rainbow">
            Caption Editor Studio
          </h2>
          <p className="text-muted-foreground font-poppins">Create magic with every word ✨</p>
        </div>

        {isProcessing && (
          <div className="mb-6 bg-white/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-primary shadow-glow animate-bounce-in">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <h3 className="text-lg font-bebas tracking-wide text-primary">Generating Captions...</h3>
            </div>
            <Progress value={progress} className="mb-2 h-3" />
            <p className="text-sm text-muted-foreground font-poppins">{progress}% complete</p>
          </div>
        )}

        
        {/* Video Preview and Controls */}
        <div className="space-y-6 animate-slide-up">
          {videoUrl && (
            <div className="relative w-full bg-white/60 backdrop-blur-sm p-4 rounded-2xl border-2 border-primary shadow-glow">
              <div 
                className="relative cursor-crosshair"
                onClick={(e) => {
                  if (selectedWordIndex === null) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  handleWordUpdate({ positionX: Math.round(x), positionY: Math.round(y) });
                }}
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full rounded-lg"
                  controls
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                />
                
                {/* Caption overlay */}
                {(() => {
                  const currentIndex = captions.findIndex(c => currentTime >= c.start && currentTime <= c.end);
                  
                  // When editing a word, show the preview box at custom position
                  if (selectedWordIndex !== null && selectedCaption) {
                    return (
                      <div 
                        className="absolute pointer-events-none z-50"
                        style={{
                          left: `${selectedCaption.positionX || 50}%`,
                          top: `${selectedCaption.positionY || 80}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div 
                          className="relative border-4 border-dashed border-primary bg-primary/10 backdrop-blur-sm rounded-lg p-3 animate-pulse"
                          style={{
                            fontFamily: selectedCaption.fontFamily || "Inter",
                            fontSize: `${selectedCaption.fontSize || 32}px`,
                            color: selectedCaption.color || "#ffffff",
                            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                          }}
                        >
                          {selectedCaption.word}
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Click anywhere to reposition
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // During normal playback, show 5 words together at bottom center
                  if (currentIndex === -1) return null;
                  
                  const startIndex = Math.max(0, currentIndex - 2);
                  const endIndex = Math.min(captions.length, currentIndex + 3);
                  const visibleWords = captions.slice(startIndex, endIndex);
                  const currentCaption = captions[currentIndex];
                  
                  return (
                    <div 
                      className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-40"
                      style={{
                        fontFamily: currentCaption.fontFamily || "Inter",
                        fontSize: `${currentCaption.fontSize || 32}px`,
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap px-4">
                        {visibleWords.map((caption, idx) => {
                          const wordIndex = startIndex + idx;
                          const isCurrentWord = wordIndex === currentIndex;
                          
                          return (
                            <span
                              key={wordIndex}
                              className="transition-all duration-200"
                              style={{
                                fontFamily: caption.fontFamily || "Inter",
                                fontSize: `${caption.fontSize || 32}px`,
                                color: caption.color || "#ffffff",
                                fontWeight: isCurrentWord ? "bold" : "normal",
                                textShadow: "3px 3px 6px rgba(0,0,0,0.9)",
                                backgroundColor: isCurrentWord ? "rgba(59, 130, 246, 0.8)" : "transparent",
                                padding: isCurrentWord ? "6px 14px" : "2px 4px",
                                borderRadius: isCurrentWord ? "10px" : "0",
                                display: "inline-block",
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
            </div>
          )}

          {/* Individual Editing Controls Below Video */}
          {captions.length > 0 && selectedCaption && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Text Edit */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-primary/30 shadow-glow">
                <Label htmlFor="word-text" className="font-bebas text-lg text-primary mb-2 block">Text ✏️</Label>
                <Input
                  id="word-text"
                  value={selectedCaption.word}
                  onChange={(e) => handleWordUpdate({ word: e.target.value })}
                  className="border-primary/50"
                />
              </div>

              {/* Font Selector */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-primary/30 shadow-glow">
                <Label className="font-bebas text-lg text-primary mb-2 block">Font 🎨</Label>
                <select
                  value={selectedCaption.fontFamily || "Inter"}
                  onChange={(e) => handleWordUpdate({ fontFamily: e.target.value })}
                  className="w-full p-2 rounded-lg border border-primary/50 bg-white"
                  style={{ fontFamily: selectedCaption.fontFamily || "Inter" }}
                >
                  {[
                    "Inter", "Bebas Neue", "Poppins", "Bungee", "Permanent Marker", "Bangers", 
                    "Righteous", "Audiowide", "Black Ops One", "Fredoka One",
                    "Pacifico", "Dancing Script", "Great Vibes", "Sacramento", "Satisfy",
                    "Caveat", "Kaushan Script", "Lobster", "Cookie", "Courgette",
                    "Amatic SC", "Indie Flower", "Shadows Into Light", "Patrick Hand", "Reenie Beanie",
                    "Rock Salt", "Covered By Your Grace", "Homemade Apple", "Architects Daughter", "Waiting for the Sunrise"
                  ].map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-primary/30 shadow-glow">
                <Label className="font-bebas text-lg text-primary mb-2 block">Size 📏 {selectedCaption.fontSize || 32}px</Label>
                <input
                  type="range"
                  min="16"
                  max="72"
                  value={selectedCaption.fontSize || 32}
                  onChange={(e) => handleWordUpdate({ fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Color */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-primary/30 shadow-glow">
                <Label className="font-bebas text-lg text-primary mb-2 block">Color 🎨</Label>
                <Input
                  type="color"
                  value={selectedCaption.color || "#ffffff"}
                  onChange={(e) => handleWordUpdate({ color: e.target.value })}
                  className="h-12 cursor-pointer"
                />
              </div>

              {/* Position X */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-primary/30 shadow-glow">
                <Label className="font-bebas text-lg text-primary mb-2 block">X Position ↔️ {selectedCaption.positionX || 50}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedCaption.positionX || 50}
                  onChange={(e) => handleWordUpdate({ positionX: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Position Y */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-primary/30 shadow-glow">
                <Label className="font-bebas text-lg text-primary mb-2 block">Y Position ↕️ {selectedCaption.positionY || 80}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedCaption.positionY || 80}
                  onChange={(e) => handleWordUpdate({ positionY: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Save and Download Buttons */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-gradient-purple-blue p-4 rounded-xl border-2 border-primary shadow-glow flex items-center justify-center">
                  <Button 
                    onClick={saveWordChanges} 
                    className="bg-white text-primary hover:bg-white/90 w-full h-full text-lg font-bebas tracking-wider"
                  >
                    💾 Save Changes
                  </Button>
                </div>
                <div className="bg-gradient-purple-blue p-4 rounded-xl border-2 border-primary shadow-glow flex items-center justify-center">
                  <Button 
                    onClick={downloadASS} 
                    className="bg-white text-primary hover:bg-white/90 w-full h-full text-lg font-bebas tracking-wider"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download .ASS
                  </Button>
                </div>
              </div>
            </div>
          )}

          {captions.length > 0 && !selectedCaption && (
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border-2 border-dashed border-primary/50 text-center">
              <p className="text-muted-foreground font-poppins text-lg">
                ✨ Click the pencil icon on any word below to start editing
              </p>
            </div>
          )}

          {/* Caption Timeline */}
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
