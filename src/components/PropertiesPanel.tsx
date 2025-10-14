import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Type, Palette, Move } from "lucide-react";

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

interface PropertiesPanelProps {
  caption: Caption | null;
  onUpdate: (updates: Partial<Caption>) => void;
}

const FONTS = [
  "Inter", "Bebas Neue", "Poppins", "Montserrat", "Roboto", "Open Sans",
  "Lato", "Raleway", "Oswald", "Playfair Display", "Merriweather",
  "Bungee", "Permanent Marker", "Bangers", "Righteous", "Audiowide",
];

export const PropertiesPanel = ({ caption, onUpdate }: PropertiesPanelProps) => {
  if (!caption) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Type className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Select a caption to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      {/* Text Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Type className="w-4 h-4" />
          <span>Text</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="text" className="text-xs text-muted-foreground">Content</Label>
          <Input
            id="text"
            value={caption.word}
            onChange={(e) => onUpdate({ word: e.target.value })}
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="font" className="text-xs text-muted-foreground">Font Family</Label>
            <Select value={caption.fontFamily || "Inter"} onValueChange={(v) => onUpdate({ fontFamily: v })}>
              <SelectTrigger id="font" className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {FONTS.map((font) => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size" className="text-xs text-muted-foreground">Size</Label>
            <Input
              id="size"
              type="number"
              value={caption.fontSize || 32}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 32 })}
              className="h-9"
              min="12"
              max="144"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Color Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="w-4 h-4" />
          <span>Color</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color" className="text-xs text-muted-foreground">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={caption.color || "#ffffff"}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="h-9 w-16"
            />
            <Input
              value={caption.color || "#ffffff"}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="h-9 flex-1 font-mono text-xs"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Position Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Move className="w-4 h-4" />
          <span>Position</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="posX" className="text-xs text-muted-foreground">
              X: {caption.positionX || 50}%
            </Label>
            <input
              id="posX"
              type="range"
              min="0"
              max="100"
              value={caption.positionX || 50}
              onChange={(e) => onUpdate({ positionX: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="posY" className="text-xs text-muted-foreground">
              Y: {caption.positionY || 80}%
            </Label>
            <input
              id="posY"
              type="range"
              min="0"
              max="100"
              value={caption.positionY || 80}
              onChange={(e) => onUpdate({ positionY: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Timing Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>Timing</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Start</Label>
            <Input
              type="number"
              value={caption.start.toFixed(2)}
              readOnly
              className="h-9 font-mono text-xs bg-muted/50"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">End</Label>
            <Input
              type="number"
              value={caption.end.toFixed(2)}
              readOnly
              className="h-9 font-mono text-xs bg-muted/50"
              step="0.01"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Duration</Label>
          <Input
            type="text"
            value={`${(caption.end - caption.start).toFixed(2)}s`}
            readOnly
            className="h-9 font-mono text-xs bg-muted/50"
          />
        </div>
      </div>
    </div>
  );
};
