import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Type, Palette, Move, Paintbrush } from "lucide-react";

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

interface PropertiesPanelProps {
  caption: Caption | null;
  onUpdate: (updates: Partial<Caption>) => void;
}

const FONTS = [
  "Inter", "Bebas Neue", "Poppins", "Montserrat", "Roboto", "Open Sans",
  "Lato", "Raleway", "Oswald", "Playfair Display", "Merriweather",
  "Bungee", "Permanent Marker", "Bangers", "Righteous", "Audiowide",
];

const COLOR_SWATCHES = [
  "#FFFFFF", "#000000", "#FF6B6B", "#4ECDC4", "#45B7D1", 
  "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
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
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Type className="w-4 h-4 text-primary" />
          <span>Typography</span>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="text" className="text-xs font-medium text-muted-foreground mb-2 block">Content</Label>
            <Input
              id="text"
              value={caption.word}
              onChange={(e) => onUpdate({ word: e.target.value })}
              className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <Label htmlFor="font" className="text-xs font-medium text-muted-foreground mb-2 block">Font Family</Label>
            <Select value={caption.fontFamily || "Inter"} onValueChange={(v) => onUpdate({ fontFamily: v })}>
              <SelectTrigger id="font" className="h-10 transition-all duration-200 hover:border-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {FONTS.map((font) => (
                  <SelectItem 
                    key={font} 
                    value={font} 
                    style={{ fontFamily: font }}
                    className="cursor-pointer transition-colors"
                  >
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="size" className="text-xs font-medium text-muted-foreground mb-2 block">
              Size: {caption.fontSize || 32}px
            </Label>
            <Slider
              id="size"
              min={12}
              max={144}
              step={1}
              value={[caption.fontSize || 32]}
              onValueChange={(value) => onUpdate({ fontSize: value[0] })}
              className="py-4"
            />
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Color Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Palette className="w-4 h-4 text-primary" />
          <span>Colors</span>
        </div>

        <div className="space-y-4">
          {/* Text Color */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Text Color</Label>
            <div className="space-y-3">
              {/* Color Swatches */}
              <div className="flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    onClick={() => onUpdate({ color: swatch })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                      caption.color?.toUpperCase() === swatch ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                    style={{ backgroundColor: swatch }}
                    title={swatch}
                  />
                ))}
              </div>
              
              {/* Custom Color Picker */}
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={caption.color || "#ffffff"}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className="h-10 w-16 cursor-pointer"
                />
                <Input
                  value={caption.color || "#ffffff"}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className="h-10 flex-1 font-mono text-xs transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          {/* Background Color */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Background</Label>
            <div className="space-y-3">
              {/* Background Swatches */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onUpdate({ backgroundColor: "transparent" })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                    !caption.backgroundColor || caption.backgroundColor === "transparent" ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                  }`}
                  style={{ 
                    background: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px'
                  }}
                  title="Transparent"
                />
                {COLOR_SWATCHES.slice(0, 5).map((swatch) => (
                  <button
                    key={swatch}
                    onClick={() => onUpdate({ backgroundColor: swatch + "CC" })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                      caption.backgroundColor?.slice(0, 7).toUpperCase() === swatch ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                    style={{ backgroundColor: swatch + "CC" }}
                    title={swatch}
                  />
                ))}
              </div>
              
              {/* Custom Background Color */}
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={caption.backgroundColor?.slice(0, 7) || "#000000"}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value + "CC" })}
                  className="h-10 w-16 cursor-pointer"
                />
                <Input
                  value={caption.backgroundColor || "transparent"}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  className="h-10 flex-1 font-mono text-xs transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Position Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Move className="w-4 h-4 text-primary" />
          <span>Position</span>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Horizontal: {caption.positionX || 50}%
            </Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[caption.positionX || 50]}
              onValueChange={(value) => onUpdate({ positionX: value[0] })}
              className="py-4"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Vertical: {caption.positionY || 80}%
            </Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[caption.positionY || 80]}
              onValueChange={(value) => onUpdate({ positionY: value[0] })}
              className="py-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
