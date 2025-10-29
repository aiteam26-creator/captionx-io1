import { useEffect, useState } from "react";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

interface VideoPreviewProps {
  captions: Caption[];
  currentTime: number;
}

export const VideoPreview = ({ captions, currentTime }: VideoPreviewProps) => {
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);

  useEffect(() => {
    // Find the current word being spoken
    const activeCaption = captions.find(
      (c) => currentTime >= c.start && currentTime <= c.end
    );

    if (!activeCaption) {
      setCurrentCaption(null);
      return;
    }

    // Get the index of the current word
    const currentIndex = captions.findIndex(c => c === activeCaption);
    
    // Get 2 words before and 2 words after (total 5 words)
    const startIndex = Math.max(0, currentIndex - 2);
    const endIndex = Math.min(captions.length, currentIndex + 3);
    const wordGroup = captions.slice(startIndex, endIndex);

    // Combine the words
    const combinedText = wordGroup.map(c => c.word).join(' ');
    
    setCurrentCaption({
      ...activeCaption,
      word: combinedText
    });
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
          style={{
            fontFamily: currentCaption.fontFamily || "Inter",
            fontSize: `${currentCaption.fontSize || 32}px`,
            color: currentCaption.color || "#ffffff",
            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            fontWeight: currentCaption.isKeyword ? "bold" : "normal",
          }}
        >
          {currentCaption.word}
        </div>
      )}
    </div>
  );
};
