import { useRef, useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface CleanTimelineProps {
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

export const CleanTimeline = ({
  captions,
  duration,
  currentTime,
  isPlaying,
  selectedWordIndex,
  onSeek,
  onPlayPause,
  onCaptionClick,
  onCaptionResize,
}: CleanTimelineProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{ index: number; edge: 'start' | 'end' } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Pixel width per second for comfortable spacing
  const PIXELS_PER_SECOND = 80;
  const timelineWidth = Math.max(duration * PIXELS_PER_SECOND, 1000);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || resizing) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / timelineWidth) * duration;
    
    onSeek(Math.max(0, Math.min(duration, time)));
  };

  const handleResizeStart = (e: React.MouseEvent, index: number, edge: 'start' | 'end') => {
    e.stopPropagation();
    setResizing({ index, edge });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
    const time = Math.max(0, Math.min(duration, (x / timelineWidth) * duration));

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

  // Auto-scroll to follow playhead
  useEffect(() => {
    if (!scrollContainerRef.current || !isPlaying) return;
    
    const playheadX = (currentTime / duration) * timelineWidth;
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    const scrollPos = container.scrollLeft;
    
    // Keep playhead in center third of visible area
    if (playheadX > scrollPos + containerWidth * 0.66) {
      container.scrollLeft = playheadX - containerWidth * 0.5;
    } else if (playheadX < scrollPos + containerWidth * 0.33) {
      container.scrollLeft = Math.max(0, playheadX - containerWidth * 0.5);
    }
  }, [currentTime, isPlaying, duration, timelineWidth]);

  return (
    <div className="space-y-3">
      {/* Transport Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onPlayPause}
            className="h-9 w-9 rounded-lg hover:bg-accent"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
            )}
          </Button>

          <span className="text-sm font-mono text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          {captions.length} {captions.length === 1 ? 'word' : 'words'}
        </div>
      </div>

      {/* Scrollable Timeline Container */}
      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent',
        }}
      >
        <div
          ref={timelineRef}
          className="relative bg-background rounded-lg cursor-crosshair"
          style={{
            width: `${timelineWidth}px`,
            height: '120px',
          }}
          onClick={handleTimelineClick}
        >
          {/* Time Markers */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => {
              const x = (i / duration) * timelineWidth;
              return (
                <div
                  key={i}
                  className="absolute top-0 h-full flex flex-col items-center"
                  style={{ left: `${x}px` }}
                >
                  <div className="w-px h-2 bg-border" />
                  <span className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                    {i}s
                  </span>
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 w-0.5 h-full bg-blue-500 z-50 pointer-events-none transition-all duration-100"
            style={{
              left: `${(currentTime / duration) * timelineWidth}px`,
            }}
          >
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-lg" />
          </div>

          {/* Caption Word Blocks */}
          <div className="absolute top-8 left-0 right-0 h-20">
            {captions.map((caption, index) => {
              const left = (caption.start / duration) * timelineWidth;
              const width = ((caption.end - caption.start) / duration) * timelineWidth;
              const isSelected = selectedWordIndex === index;
              const isHovered = hoveredIndex === index;
              const isActive = currentTime >= caption.start && currentTime <= caption.end;

              return (
                <div
                  key={index}
                  className={cn(
                    "absolute top-0 h-full rounded-md transition-all duration-150 cursor-pointer group",
                    "border border-border/40",
                    isActive && "ring-1 ring-blue-400/50",
                    isSelected && "ring-2 ring-blue-500 bg-blue-50 border-blue-400 shadow-sm z-40",
                    !isSelected && "bg-background hover:bg-accent hover:border-foreground/30 z-30"
                  )}
                  style={{
                    left: `${left}px`,
                    width: `${Math.max(width, 40)}px`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCaptionClick(index);
                    // Seek to the start of the selected word so it appears on video
                    onSeek(caption.start + 0.01);
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Resize Handle - Start */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 w-1 h-full cursor-ew-resize transition-colors",
                      isSelected || isHovered ? "bg-blue-500" : "bg-transparent group-hover:bg-border"
                    )}
                    onMouseDown={(e) => handleResizeStart(e, index, 'start')}
                  />

                  {/* Caption Text */}
                  <div className="absolute inset-0 flex items-center justify-center px-2 overflow-hidden">
                    <p
                      className={cn(
                        "text-xs font-medium truncate select-none transition-colors",
                        isSelected ? "text-blue-600" : "text-foreground/80"
                      )}
                      style={{ fontFamily: caption.fontFamily || 'Inter' }}
                    >
                      {caption.word}
                    </p>
                  </div>

                  {/* Time Labels on Hover */}
                  {(isHovered || isSelected) && (
                    <div className="absolute -top-6 left-0 right-0 flex justify-between px-1 text-[9px] font-mono text-muted-foreground pointer-events-none">
                      <span className="bg-background px-1 rounded">{formatTime(caption.start)}</span>
                      <span className="bg-background px-1 rounded">{formatTime(caption.end)}</span>
                    </div>
                  )}

                  {/* Resize Handle - End */}
                  <div
                    className={cn(
                      "absolute right-0 top-0 w-1 h-full cursor-ew-resize transition-colors",
                      isSelected || isHovered ? "bg-blue-500" : "bg-transparent group-hover:bg-border"
                    )}
                    onMouseDown={(e) => handleResizeStart(e, index, 'end')}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-[11px] text-muted-foreground/60 text-center">
        Click to jump • Drag edges to adjust timing • Scroll to navigate
      </p>
    </div>
  );
};
