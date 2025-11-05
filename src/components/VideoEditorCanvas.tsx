import { useRef, useEffect, useState } from "react";
import { Move, Edit3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface VideoEditorCanvasProps {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  captions: Caption[];
  currentTime: number;
  selectedWordIndex: number | null;
  onCaptionDrag: (index: number, x: number, y: number) => void;
  onCaptionClick: (index: number) => void;
  onTimeUpdate: (time: number) => void;
}

export const VideoEditorCanvas = ({
  videoUrl,
  videoRef,
  captions,
  currentTime,
  selectedWordIndex,
  onCaptionDrag,
  onCaptionClick,
  onTimeUpdate,
}: VideoEditorCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isDragStarted, setIsDragStarted] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const getCurrentCaptions = () => {
    return captions
      .map((caption, index) => ({ caption, index }))
      .filter(({ caption }) => currentTime >= caption.start && currentTime <= caption.end);
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.button !== 0) return;

    // Always select the word immediately on click
    onCaptionClick(index);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const caption = captions[index];
    
    // Calculate the actual pixel position of the caption
    const currentX = ((caption.positionX || 50) / 100) * rect.width;
    const currentY = ((caption.positionY || 80) / 100) * rect.height;

    // Store the offset between mouse click and caption center
    setDragOffset({
      x: e.clientX - rect.left - currentX,
      y: e.clientY - rect.top - currentY,
    });
    
    // Store initial mouse position to detect drag vs click
    setDragStartPos({
      x: e.clientX,
      y: e.clientY,
    });
    
    setDragging(index);
    setIsDragStarted(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging === null || !containerRef.current) return;

    e.preventDefault();
    
    // Check if mouse has moved enough to start dragging (threshold: 5px)
    if (!isDragStarted) {
      const dx = Math.abs(e.clientX - dragStartPos.x);
      const dy = Math.abs(e.clientY - dragStartPos.y);
      
      if (dx > 5 || dy > 5) {
        setIsDragStarted(true);
      } else {
        // Not enough movement yet, don't start dragging
        return;
      }
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate new position as percentage
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      onCaptionDrag(dragging, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
    });
  };

  const handleMouseUp = () => {
    setDragging(null);
    setIsDragStarted(false);
  };

  useEffect(() => {
    if (dragging !== null) {
      document.addEventListener("mousemove", handleMouseMove, { passive: false });
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, dragOffset, isDragStarted, dragStartPos]);

  const handleDoubleClick = (index: number, word: string) => {
    setEditingIndex(index);
    setEditText(word);
  };

  const handleEditBlur = () => {
    if (editingIndex !== null && editText.trim()) {
      onCaptionDrag(editingIndex, captions[editingIndex].positionX || 50, captions[editingIndex].positionY || 80);
    }
    setEditingIndex(null);
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
      />

      {/* Caption overlays */}
      {getCurrentCaptions().map(({ caption, index: originalIndex }) => {
        const isSelected = selectedWordIndex === originalIndex;
        const isDraggingThis = dragging === originalIndex && isDragStarted;
        const isEditing = editingIndex === originalIndex;

        return (
          <TooltipProvider key={originalIndex}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div
                  className={`
                    absolute select-none
                    ${isDraggingThis ? 'cursor-grabbing' : 'cursor-grab'}
                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black/50' : ''}
                    ${isDraggingThis ? 'scale-105' : 'hover:scale-[1.02]'}
                    ${isDraggingThis ? '' : 'transition-all duration-150'}
                  `}
                  style={{
                    left: `${caption.positionX || 50}%`,
                    top: `${caption.positionY || 80}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isSelected || isDraggingThis ? 50 : 40,
                    willChange: isDraggingThis ? 'transform' : 'auto',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, originalIndex)}
                  onDoubleClick={() => handleDoubleClick(originalIndex, caption.word)}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={handleEditBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditBlur();
                        if (e.key === 'Escape') {
                          setEditingIndex(null);
                          setEditText("");
                        }
                      }}
                      autoFocus
                      className="px-3 py-1 rounded bg-black/80 border-2 border-primary text-white outline-none"
                      style={{
                        fontFamily: caption.fontFamily || "Inter",
                        fontSize: `${caption.fontSize || 32}px`,
                        color: caption.color || "#ffffff",
                      }}
                    />
                  ) : (
                    <div
                      className={`
                        relative px-6 py-3 rounded-lg transition-all duration-200
                        ${caption.isKeyword ? 'font-bold animate-scale-in' : 'font-semibold'}
                      `}
                      style={{
                        fontFamily: caption.fontFamily || "Inter",
                        fontSize: `${caption.fontSize || 32}px`,
                        color: caption.color || "#ffffff",
                        backgroundColor: isSelected 
                          ? "rgba(59, 130, 246, 0.4)" 
                          : isDraggingThis 
                          ? "rgba(59, 130, 246, 0.3)" 
                          : caption.backgroundColor || "rgba(0, 0, 0, 0.75)",
                        textShadow: caption.isKeyword 
                          ? "0 0 20px rgba(255, 215, 0, 0.8), 3px 3px 12px rgba(0,0,0,0.9)"
                          : "2px 2px 8px rgba(0,0,0,0.9)",
                        border: isSelected 
                          ? "2px solid rgba(59, 130, 246, 0.8)" 
                          : caption.isKeyword 
                          ? "2px solid rgba(255, 215, 0, 0.3)"
                          : "2px solid transparent",
                        letterSpacing: caption.isKeyword ? "0.05em" : "normal",
                        textTransform: caption.isKeyword ? "uppercase" : "none",
                      }}
                    >
                      {caption.word}
                      
                      {/* Keyword indicator */}
                      {caption.isKeyword && !isSelected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                      )}
                      
                      {/* Control hint on selected */}
                      {isSelected && !isDraggingThis && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-blue-500 px-3 py-1.5 rounded-md shadow-lg animate-fade-in">
                          <Move className="w-3.5 h-3.5 text-white" />
                          <span className="text-[10px] font-medium text-white uppercase tracking-wide">Drag to move</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-black/90 text-white border-blue-500">
                <p className="text-xs font-medium">Click to pause & select • Drag to reposition</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};
