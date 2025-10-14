import { useRef, useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

interface ProTimelineProps {
  captions: Caption[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  selectedWordIndex: number | null;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
  onCaptionClick: (index: number) => void;
  onCaptionResize: (index: number, newStart: number, newEnd: number) => void;
}

export const ProTimeline = ({
  captions,
  duration,
  currentTime,
  isPlaying,
  selectedWordIndex,
  onSeek,
  onPlayPause,
  onCaptionClick,
  onCaptionResize,
}: ProTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{ index: number; edge: 'start' | 'end' } | null>(null);
  const [zoom, setZoom] = useState(1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || resizing) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * duration;
    
    onSeek(time);
  };

  const handleResizeStart = (e: React.MouseEvent, index: number, edge: 'start' | 'end') => {
    e.stopPropagation();
    setResizing({ index, edge });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = Math.max(0, Math.min(duration, percent * duration));

    const caption = captions[resizing.index];
    
    if (resizing.edge === 'start') {
      const newStart = Math.min(time, caption.end - 0.1);
      onCaptionResize(resizing.index, newStart, caption.end);
    } else {
      const newEnd = Math.max(time, caption.start + 0.1);
      onCaptionResize(resizing.index, caption.start, newEnd);
    }
  };

  const handleMouseUp = () => {
    setResizing(null);
  };

  useEffect(() => {
    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing, captions, duration]);

  const skip = (direction: 'back' | 'forward') => {
    const newTime = direction === 'back' 
      ? Math.max(0, currentTime - 5)
      : Math.min(duration, currentTime + 5);
    onSeek(newTime);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Transport controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => skip('back')}>
                  <SkipBack className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Skip back 5s</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="default" size="icon" onClick={onPlayPause}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => skip('forward')}>
                  <SkipForward className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Skip forward 5s</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Zoom:</span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-xs font-medium w-8">{zoom}x</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {/* Time ruler */}
        <div className="relative h-6 bg-muted/30 rounded-t">
          {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => {
            const left = (i / duration) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-border/50"
                style={{ left: `${left}%` }}
              >
                <span className="absolute -top-5 -translate-x-1/2 text-[10px] text-muted-foreground font-mono">
                  {i}s
                </span>
              </div>
            );
          })}
        </div>

        {/* Caption blocks */}
        <div
          ref={timelineRef}
          className="relative h-24 bg-muted/20 rounded-b cursor-crosshair overflow-x-auto"
          onClick={handleTimelineClick}
          style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left' }}
        >
          {/* Playhead */}
          <div
            className="absolute top-0 w-0.5 h-full bg-primary z-50 pointer-events-none"
            style={{
              left: `${(currentTime / duration) * 100}%`,
              boxShadow: '0 0 8px rgba(var(--primary), 0.5)',
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full" />
          </div>

          {/* Caption blocks */}
          {captions.map((caption, index) => {
            const left = (caption.start / duration) * 100;
            const width = ((caption.end - caption.start) / duration) * 100;
            const isSelected = selectedWordIndex === index;

            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        absolute top-2 h-20 rounded group/block
                        transition-all duration-150 cursor-pointer
                        ${isSelected 
                          ? 'bg-primary/80 ring-2 ring-primary ring-offset-2 ring-offset-muted/20 z-40' 
                          : 'bg-primary/40 hover:bg-primary/60 z-30'
                        }
                      `}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCaptionClick(index);
                      }}
                    >
                      {/* Resize handles */}
                      <div
                        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-primary/0 hover:bg-primary group-hover/block:bg-primary/50 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, index, 'start')}
                      />
                      <div
                        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-primary/0 hover:bg-primary group-hover/block:bg-primary/50 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, index, 'end')}
                      />

                      {/* Caption text */}
                      <div className="absolute inset-2 flex items-center justify-center overflow-hidden">
                        <p 
                          className="text-xs font-medium text-primary-foreground truncate px-1"
                          style={{ fontFamily: caption.fontFamily || 'Inter' }}
                        >
                          {caption.word}
                        </p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="font-mono text-xs">
                    <div className="space-y-1">
                      <p>{caption.word}</p>
                      <p className="text-muted-foreground">
                        {formatTime(caption.start)} → {formatTime(caption.end)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </div>
  );
};
