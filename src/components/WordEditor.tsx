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
  positionX?: number;
  positionY?: number;
}

interface WordEditorProps {
  caption: Caption | null;
  onUpdate: (updates: Partial<Caption>) => void;
}

const FONTS = [
  "Inter",
  "Bebas Neue",
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
  "Crimson Text",
  "Archivo",
  "Cabin",
  "Quicksand",
  "Barlow",
  "Barlow Condensed",
  "Barlow Semi Condensed",
  "Dr Sugiyama",
  "Futura",
  "Gill Sans",
  "High Tide",
  "Righteous",
  "Bungee",
  "Bungee Shade",
  "Permanent Marker",
  "Bangers",
  "Black Ops One",
  "Fredoka One",
  "Audiowide",
];

export const WordEditor = ({ caption, onUpdate }: WordEditorProps) => {
  const [showFonts, setShowFonts] = useState(false);

  if (!caption) {
    return (
      <div className="p-8 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-primary/50">
        <p className="text-muted-foreground text-center font-poppins">
          ✨ Select a word from the timeline to edit
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-primary shadow-glow">
      <h3 className="font-bebas text-2xl tracking-wide text-gradient bg-[length:200%_200%]">Edit Word ✏️</h3>

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

      <div className="space-y-2">
        <Label htmlFor="position-x">Position X: {caption.positionX || 50}%</Label>
        <input
          id="position-x"
          type="range"
          min="0"
          max="100"
          value={caption.positionX || 50}
          onChange={(e) => onUpdate({ positionX: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="position-y">Position Y: {caption.positionY || 80}%</Label>
        <input
          id="position-y"
          type="range"
          min="0"
          max="100"
          value={caption.positionY || 80}
          onChange={(e) => onUpdate({ positionY: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
};
