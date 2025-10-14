import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface Caption {
  word: string;
  start: number;
  end: number;
  isKeyword?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

interface WordEditorProps {
  caption: Caption | null;
  onUpdate: (updates: Partial<Caption>) => void;
}

const FONTS = [
  "Inter",
  "Roboto",
  "Playfair Display",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Raleway",
  "Poppins",
  "Merriweather",
  "Oswald",
  "Source Sans Pro",
  "Nunito",
  "Ubuntu",
  "PT Sans",
  "Lora",
  "Bebas Neue",
  "Crimson Text",
  "Archivo",
  "Cabin",
  "Quicksand",
];

export const WordEditor = ({ caption, onUpdate }: WordEditorProps) => {
  const [showFonts, setShowFonts] = useState(false);

  if (!caption) {
    return (
      <div className="p-6 border rounded-lg bg-muted/30">
        <p className="text-muted-foreground text-center">
          Select a word from the timeline to edit
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="font-semibold text-lg">Edit Word</h3>

      <div className="space-y-2">
        <Label htmlFor="word-text">Text</Label>
        <Input
          id="word-text"
          value={caption.word}
          onChange={(e) => onUpdate({ word: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Font Family</Label>
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowFonts(!showFonts)}
          >
            <span style={{ fontFamily: caption.fontFamily || "Inter" }}>
              {caption.fontFamily || "Inter"}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
          {showFonts && (
            <div className="absolute z-10 w-full mt-1 max-h-[300px] overflow-y-auto bg-background border rounded-lg shadow-lg">
              {FONTS.map((font) => (
                <button
                  key={font}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                  style={{ fontFamily: font }}
                  onClick={() => {
                    onUpdate({ fontFamily: font });
                    setShowFonts(false);
                  }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="font-size">Font Size: {caption.fontSize || 32}px</Label>
        <input
          id="font-size"
          type="range"
          min="16"
          max="72"
          value={caption.fontSize || 32}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="word-color">Color</Label>
        <Input
          id="word-color"
          type="color"
          value={caption.color || "#ffffff"}
          onChange={(e) => onUpdate({ color: e.target.value })}
          className="h-12"
        />
      </div>
    </div>
  );
};
