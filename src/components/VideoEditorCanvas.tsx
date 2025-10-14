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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const getCurrentCaptions = () => {
    return captions
      .map((caption, index) => ({ caption, index }))
      .filter(({ caption }) => currentTime >= caption.start && currentTime <= caption.end);
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const caption = captions[index];
    
    const currentX = ((caption.positionX || 50) / 100) * rect.width;
    const currentY = ((caption.positionY || 80) / 100) * rect.height;

    setDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY,
    });
    
    setDragging(index);
    onCaptionClick(index);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    onCaptionDrag(dragging, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  useEffect(() => {
    if (dragging !== null) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging]);

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
      {getCurrentCaptions().map(({ caption, index }) => {
        const isSelected = selectedWordIndex === index;
        const isDragging = dragging === index;
        const isEditing = editingIndex === index;

        return (
          <TooltipProvider key={index}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div
                  className={`
                    absolute cursor-move select-none transition-all duration-150
                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black/50' : ''}
                    ${isDragging ? 'scale-110 opacity-80' : 'hover:scale-105'}
                  `}
                  style={{
                    left: `${caption.positionX || 50}%`,
                    top: `${caption.positionY || 80}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isSelected ? 50 : 40,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, index)}
                  onDoubleClick={() => handleDoubleClick(index, caption.word)}
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
                      className="relative px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-200"
                      style={{
                        fontFamily: caption.fontFamily || "Inter",
                        fontSize: `${caption.fontSize || 32}px`,
                        color: caption.color || "#ffffff",
                        textShadow: "2px 2px 8px rgba(0,0,0,0.9)",
                        backgroundColor: isSelected 
                          ? "rgba(59, 130, 246, 0.3)" 
                          : isDragging 
                          ? "rgba(59, 130, 246, 0.2)" 
                          : "transparent",
                        border: isSelected ? "2px solid rgba(59, 130, 246, 0.6)" : "2px solid transparent",
                      }}
                    >
                      {caption.word}
                      
                      {/* Control hint on selected */}
                      {isSelected && !isDragging && (
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
