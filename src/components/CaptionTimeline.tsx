import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
}

interface CaptionTimelineProps {
  captions: Caption[];
  currentTime: number;
  onWordClick: (index: number, time: number) => void;
  onWordSelect: (index: number) => void;
  selectedWordIndex: number | null;
}

export const CaptionTimeline = ({
  captions,
  currentTime,
  onWordClick,
  onWordSelect,
  selectedWordIndex,
}: CaptionTimelineProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg mb-4">Caption Timeline</h3>
      <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2">
        {captions.map((caption, index) => {
          const isCurrent = currentTime >= caption.start && currentTime <= caption.end;
          const isSelected = selectedWordIndex === index;

          return (
            <div
              key={index}
              className={`
                flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
                ${isCurrent ? "bg-primary/20 border-l-4 border-primary" : "hover:bg-muted"}
                ${isSelected ? "ring-2 ring-primary" : ""}
              `}
              onClick={() => onWordClick(index, caption.start)}
            >
              <span className="text-xs text-muted-foreground min-w-[45px]">
                {formatTime(caption.start)}
              </span>
              <span
                className={`
                  flex-1 ${caption.isKeyword ? "text-yellow-600 font-bold" : ""}
                  ${isCurrent ? "font-semibold" : ""}
                `}
              >
                {caption.word}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onWordSelect(index);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
