import { useEffect, useState } from "react";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}

interface VideoPreviewProps {
  captions: Caption[];
  currentTime: number;
}

export const VideoPreview = ({ captions, currentTime }: VideoPreviewProps) => {
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);

  useEffect(() => {
    const caption = captions.find(
      (c) => currentTime >= c.start && currentTime <= c.end
    );
    setCurrentCaption(caption || null);
  }, [currentTime, captions]);

  return (
    <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden border border-border shadow-lg">
      {/* Placeholder video area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Video Preview Area</div>
      </div>

      {/* Caption overlay */}
      {currentCaption && (
        <div 
          className="absolute inset-x-0 bottom-0 pb-8 flex items-center justify-center"
        >
          <div
            className="px-4 py-2 rounded-lg"
            style={{
              fontFamily: currentCaption.fontFamily || "Inter",
              fontSize: `${currentCaption.fontSize || 32}px`,
              color: currentCaption.color || "#ffffff",
              backgroundColor: currentCaption.backgroundColor === "shadow" 
                ? "transparent" 
                : currentCaption.backgroundColor || "rgba(0, 0, 0, 0.75)",
              textShadow: currentCaption.backgroundColor === "shadow"
                ? "2px 2px 8px rgba(0,0,0,0.9), -2px -2px 8px rgba(0,0,0,0.9), 2px -2px 8px rgba(0,0,0,0.9), -2px 2px 8px rgba(0,0,0,0.9)"
                : "2px 2px 4px rgba(0,0,0,0.8)",
              fontWeight: currentCaption.isKeyword ? "bold" : "normal",
            }}
          >
            {currentCaption.word}
          </div>
        </div>
      )}
    </div>
  );
};
