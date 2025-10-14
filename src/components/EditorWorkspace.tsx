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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
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
  const [globalFont, setGlobalFont] = useState<string>("Inter");
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
        duration: 300000, // 5 minutes - keeps toast visible
      });

      const audioBase64 = await extractAudio(file);
      setProgress(30);

      toast({
        title: "Generating captions...",
        description: "Using AI to transcribe your video",
        duration: 300000, // 5 minutes - keeps toast visible
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
        duration: 3000,
      });
    } catch (error) {
      console.error('Error transcribing video:', error);
      toast({
        title: "Error",
        description: "Failed to generate captions. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAssContent = (): string => {
    // ASS file header with style information
    let assContent = `[Script Info]
Title: Generated Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    // Convert captions to ASS dialogue lines with styling
    captions.forEach((caption) => {
      const start = formatAssTime(caption.start);
      const end = formatAssTime(caption.end);
      const fontName = caption.fontFamily || 'Arial';
      const fontSize = caption.fontSize || 48;
      const color = hexToAssColor(caption.color || '#ffffff');
      
      // ASS positioning: \pos(x,y) where x,y are in pixels
      const posX = caption.positionX ? Math.round((caption.positionX / 100) * 1920) : 960;
      const posY = caption.positionY ? Math.round((caption.positionY / 100) * 1080) : 900;
      
      // ASS override tags for styling
      const styleTag = `{\\fn${fontName}\\fs${fontSize}\\c${color}\\pos(${posX},${posY})}`;
      
      assContent += `Dialogue: 0,${start},${end},Default,,0,0,0,,${styleTag}${caption.word}\n`;
    });

    return assContent;
  };

  const formatAssTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const centiseconds = Math.floor((seconds % 1) * 100);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const hexToAssColor = (hex: string): string => {
    // Convert #RRGGBB to &H00BBGGRR (ASS format)
    const r = hex.slice(1, 3);
    const g = hex.slice(3, 5);
    const b = hex.slice(5, 7);
    return `&H00${b}${g}${r}`.toUpperCase();
  };

  const downloadAssFile = () => {
    if (captions.length === 0) {
      toast({
        title: "No captions available",
        description: "Please transcribe a video first to generate captions.",
        variant: "destructive",
      });
      return;
    }

    const generatedAssContent = generateAssContent();
    const blob = new Blob([generatedAssContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions-styled.ass';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Styled ASS file downloaded!",
      description: "Your subtitle file includes all typography edits (fonts, colors, sizes, positions).",
    });
  };

  const downloadVideoWithCaptions = async () => {
    if (!videoRef.current || !videoUrl || captions.length === 0) {
      toast({
        title: "Cannot download",
        description: "Please upload and transcribe a video first.",
        variant: "destructive",
      });
      return;
    }

    // Prepare to render captions into the video

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    toast({
      title: "Processing video...",
      description: "Rendering captions into your video. This may take a few moments.",
    });

    // Create a new video element to avoid audio issues with existing one
    const tempVideo = document.createElement('video');
    tempVideo.src = videoUrl;
    tempVideo.crossOrigin = "anonymous";
    tempVideo.muted = true; // Mute the temp video to avoid double audio
    
    await tempVideo.play();
    tempVideo.pause();
    tempVideo.currentTime = 0;

    // Capture canvas stream
    const canvasStream = canvas.captureStream(30); // 30 fps
    
    // Get original video audio
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(tempVideo);
    const dest = audioContext.createMediaStreamDestination();
    source.connect(dest);
    
    // Combine video and audio streams
    const tracks = [
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ];
    const combinedStream = new MediaStream(tracks);

    const mimeCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    const selectedMime = (typeof MediaRecorder !== 'undefined' && (MediaRecorder as any).isTypeSupported)
      ? (mimeCandidates.find((type) => (MediaRecorder as any).isTypeSupported(type)) || '')
      : '';

    const mediaRecorder = new MediaRecorder(combinedStream, selectedMime
      ? { mimeType: selectedMime, videoBitsPerSecond: 5000000 }
      : { videoBitsPerSecond: 5000000 }
    );

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const fileExtension = selectedMime.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: selectedMime || `video/${fileExtension}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-with-captions.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Cleanup
      audioContext.close();
      tempVideo.remove();
      
      toast({
        title: "Download complete!",
        description: "Your video with burned-in captions and ASS file have been downloaded.",
      });
    };

    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms

    const renderFrame = () => {
      if (tempVideo.ended) {
        mediaRecorder.stop();
        return;
      }

      // Draw video frame
      ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);

      // Find and draw current captions (5 words at a time)
      const currentTime = tempVideo.currentTime;
      const currentIndex = captions.findIndex(c => currentTime >= c.start && currentTime <= c.end);
      
      if (currentIndex !== -1) {
        const startIndex = Math.max(0, currentIndex - 2);
        const endIndex = Math.min(captions.length, currentIndex + 3);
        const visibleWords = captions.slice(startIndex, endIndex);

        // Setup text styling
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Calculate total width to center the group
        let totalWidth = 0;
        const wordWidths: number[] = [];
        
        visibleWords.forEach((caption) => {
          ctx.font = `${caption.fontSize || 32}px "${caption.fontFamily || 'Inter'}"`;
          const width = ctx.measureText(caption.word).width;
          wordWidths.push(width);
          totalWidth += width + 10; // Add gap
        });

        // Start position (centered)
        let xPos = (canvas.width - totalWidth) / 2;
        const yPos = canvas.height - 100; // Bottom position

        // Draw each word
        visibleWords.forEach((caption, idx) => {
          const wordIndex = startIndex + idx;
          const isCurrentWord = wordIndex === currentIndex;
          
          ctx.font = `${isCurrentWord ? 'bold' : 'normal'} ${caption.fontSize || 32}px "${caption.fontFamily || 'Inter'}"`;
          
          // Draw background for current word
          if (isCurrentWord) {
            const padding = 14;
            const bgWidth = wordWidths[idx] + padding * 2;
            const bgHeight = (caption.fontSize || 32) + padding;
            
            ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
            ctx.beginPath();
            ctx.roundRect(xPos - padding, yPos - (caption.fontSize || 32) - padding, bgWidth, bgHeight, 10);
            ctx.fill();
          }
          
          // Draw text shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
          ctx.fillText(caption.word, xPos + wordWidths[idx] / 2 + 3, yPos + 3);
          
          // Draw text
          ctx.fillStyle = caption.color || '#ffffff';
          ctx.fillText(caption.word, xPos + wordWidths[idx] / 2, yPos);
          
          xPos += wordWidths[idx] + 10;
        });
      }

      requestAnimationFrame(renderFrame);
    };

    // Start playback and rendering
    await tempVideo.play();
    renderFrame();
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

    // Deselect the word after saving so playback can resume
    setSelectedWordIndex(null);
    setEditedCaption(null);

    toast({
      title: "Changes saved!",
      description: "Your caption edits have been applied. Play the video to see them!",
    });
  };

  const applyFontToAll = () => {
    setCaptions(prev => prev.map(caption => ({
      ...caption,
      fontFamily: globalFont
    })));

    toast({
      title: "Font applied!",
      description: `All captions now use ${globalFont}`,
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

          {/* Download Buttons Section */}
          {captions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-purple-blue p-4 rounded-xl border-2 border-primary shadow-glow flex items-center justify-center">
                <Button 
                  onClick={downloadVideoWithCaptions} 
                  className="bg-white text-primary hover:bg-white/90 w-full h-full text-lg font-bebas tracking-wider"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Video with Captions
                </Button>
              </div>
              <div className="bg-gradient-purple-blue p-4 rounded-xl border-2 border-primary shadow-glow flex items-center justify-center">
                <Button 
                  onClick={downloadAssFile} 
                  className="bg-white text-primary hover:bg-white/90 w-full h-full text-lg font-bebas tracking-wider"
                >
                  ⬇️ Download .ASS Subtitle File
                </Button>
              </div>
            </div>
          )}

          {/* Global Font Change Section */}
          {captions.length > 0 && (
            <div className="bg-gradient-purple-blue p-6 rounded-2xl border-2 border-primary shadow-glow">
              <h3 className="text-2xl font-bebas tracking-wide text-white mb-4">🎨 Change Font for All Text</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label className="font-bebas text-lg text-white mb-2 block">Select Font</Label>
                  <Select value={globalFont} onValueChange={setGlobalFont}>
                    <SelectTrigger className="w-full p-3 rounded-lg border-2 border-white/50 bg-white text-lg" style={{ fontFamily: globalFont }}>
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {[
                        "Inter", "Bebas Neue", "Poppins", "Bungee", "Permanent Marker", "Bangers", 
                        "Righteous", "Audiowide", "Black Ops One", "Fredoka One",
                        "Pacifico", "Dancing Script", "Great Vibes", "Sacramento", "Satisfy",
                        "Caveat", "Kaushan Script", "Lobster", "Cookie", "Courgette",
                        "Amatic SC", "Indie Flower", "Shadows Into Light", "Patrick Hand", "Reenie Beanie",
                        "Rock Salt", "Covered By Your Grace", "Homemade Apple", "Architects Daughter", "Waiting for the Sunrise"
                      ].map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={applyFontToAll}
                  className="bg-white text-primary hover:bg-white/90 h-[52px] px-8 text-lg font-bebas tracking-wider"
                >
                  Apply to All
                </Button>
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
                <Select value={selectedCaption.fontFamily || "Inter"} onValueChange={(v) => handleWordUpdate({ fontFamily: v })}>
                  <SelectTrigger className="w-full p-2 rounded-lg border border-primary/50 bg-white" style={{ fontFamily: selectedCaption.fontFamily || "Inter" }}>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {[
                      "Inter", "Bebas Neue", "Poppins", "Bungee", "Permanent Marker", "Bangers", 
                      "Righteous", "Audiowide", "Black Ops One", "Fredoka One",
                      "Pacifico", "Dancing Script", "Great Vibes", "Sacramento", "Satisfy",
                      "Caveat", "Kaushan Script", "Lobster", "Cookie", "Courgette",
                      "Amatic SC", "Indie Flower", "Shadows Into Light", "Patrick Hand", "Reenie Beanie",
                      "Rock Salt", "Covered By Your Grace", "Homemade Apple", "Architects Daughter", "Waiting for the Sunrise"
                    ].map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Save Changes Button */}
              <div className="md:col-span-2 lg:col-span-4">
                <div className="bg-gradient-purple-blue p-4 rounded-xl border-2 border-primary shadow-glow flex items-center justify-center">
                  <Button 
                    onClick={saveWordChanges} 
                    className="bg-white text-primary hover:bg-white/90 w-full h-full text-lg font-bebas tracking-wider"
                  >
                    💾 Save Changes
                  </Button>
                </div>
              </div>

              {/* Apply to All Section */}
              <div className="md:col-span-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6 rounded-xl border-2 border-primary/40 shadow-glow space-y-4">
                <h3 className="font-bebas text-2xl text-primary tracking-wide text-center">Apply to All Text 🎯</h3>
                
                {/* Global Color */}
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-primary/30">
                  <Label className="font-bebas text-lg text-primary mb-2 block">Global Color 🎨</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="global-color"
                      defaultValue="#ffffff"
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Button
                      onClick={() => {
                        const colorInput = document.getElementById('global-color') as HTMLInputElement;
                        const newColor = colorInput.value;
                        setCaptions(captions.map(cap => ({ ...cap, color: newColor })));
                        toast({ title: "Color applied to all text!" });
                      }}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bebas text-lg"
                    >
                      Apply Color
                    </Button>
                  </div>
                </div>

                {/* Global Size */}
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-primary/30">
                  <Label className="font-bebas text-lg text-primary mb-2 block" htmlFor="global-size-value">
                    Global Size 📏 <span id="global-size-value">32</span>px
                  </Label>
                  <input
                    type="range"
                    id="global-size"
                    min="16"
                    max="72"
                    defaultValue="32"
                    onChange={(e) => {
                      const valueSpan = document.getElementById('global-size-value');
                      if (valueSpan) valueSpan.textContent = e.target.value;
                    }}
                    className="w-full mb-3"
                  />
                  <Button
                    onClick={() => {
                      const sizeInput = document.getElementById('global-size') as HTMLInputElement;
                      const newSize = parseInt(sizeInput.value);
                      setCaptions(captions.map(cap => ({ ...cap, fontSize: newSize })));
                      toast({ title: `Size ${newSize}px applied to all text!` });
                    }}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bebas text-lg"
                  >
                    Apply Size
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
