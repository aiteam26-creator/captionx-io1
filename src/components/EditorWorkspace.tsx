import { useState } from "react";
import { CaptionTimeline } from "./CaptionTimeline";
import { WordEditor } from "./WordEditor";
import { VideoPreview } from "./VideoPreview";

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
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([
    { word: "Welcome", start: 0, end: 0.5, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
    { word: "to", start: 0.5, end: 0.8, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
    { word: "our", start: 0.8, end: 1.2, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
    { word: "caption", start: 1.2, end: 1.8, isKeyword: true, fontSize: 36, fontFamily: "Poppins", color: "#fbbf24" },
    { word: "editor", start: 1.8, end: 2.4, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
    { word: "where", start: 2.4, end: 2.8, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
    { word: "you", start: 2.8, end: 3.0, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
    { word: "can", start: 3.0, end: 3.3, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
    { word: "edit", start: 3.3, end: 3.8, isKeyword: true, fontSize: 36, fontFamily: "Poppins", color: "#fbbf24" },
    { word: "each", start: 3.8, end: 4.2, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
    { word: "word", start: 4.2, end: 4.6, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
    { word: "individually", start: 4.6, end: 5.4, fontSize: 32, fontFamily: "Inter", color: "#ffffff" },
  ]);

  const handleWordClick = (index: number, time: number) => {
    setCurrentTime(time);
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

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">AI-Powered Caption Editor</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Preview - Left */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPreview 
              captions={captions}
              currentTime={currentTime}
            />
            <CaptionTimeline
              captions={captions}
              currentTime={currentTime}
              onWordClick={handleWordClick}
              onWordSelect={handleWordSelect}
              selectedWordIndex={selectedWordIndex}
            />
          </div>
          
          {/* Word Editor - Right */}
          <div>
            <WordEditor
              caption={selectedCaption}
              onUpdate={handleWordUpdate}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
