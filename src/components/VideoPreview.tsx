import { useEffect, useRef, useState } from "react";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
}

interface VideoPreviewProps {
  videoUrl: string;
  captions: Caption[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}

export const VideoPreview = ({ videoUrl, captions, currentTime, onTimeUpdate }: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [displayWords, setDisplayWords] = useState<Caption[]>([]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    // Find current word and get 2 words before and 2 after (total 5 words)
    const currentIndex = captions.findIndex(
      (caption) => currentTime >= caption.start && currentTime <= caption.end
    );

    if (currentIndex !== -1) {
      const start = Math.max(0, currentIndex - 2);
      const end = Math.min(captions.length, currentIndex + 3);
      setDisplayWords(captions.slice(start, end));
    }
  }, [currentTime, captions]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        controls
        onTimeUpdate={handleTimeUpdate}
      />
      
      {/* Caption Overlay */}
      <div className="absolute bottom-20 left-0 right-0 px-8 pointer-events-none">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {displayWords.map((caption, idx) => {
            const isCurrent = currentTime >= caption.start && currentTime <= caption.end;
            return (
              <span
                key={idx}
                className={`
                  transition-all duration-200 whitespace-nowrap
                  ${isCurrent ? "bg-primary text-primary-foreground px-2 py-1 rounded scale-110" : ""}
                  ${caption.isKeyword ? "text-yellow-400 font-extrabold text-[calc(1em+3px)] drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" : "font-semibold"}
                `}
                style={{ fontSize: "2rem" }}
              >
                {caption.word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
