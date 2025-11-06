import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { ColorWheelPicker } from "./ColorWheelPicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CaptionControlsProps {
  fontSize: number;
  fontFamily: string;
  color: string;
  position: { x: number; y: number };
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (font: string) => void;
  onColorChange: (color: string) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onApplyToAll?: (updates: { fontSize?: number; color?: string; fontFamily?: string }) => void;
}

const FONTS = [
  "Inter", "Playfair Display", "Montserrat", "Poppins", "Raleway",
  "Lora", "Bebas Neue", "Oswald", "Merriweather", "Roboto"
];

export const CaptionControls = ({
  fontSize,
  fontFamily,
  color,
  position,
  onFontSizeChange,
  onFontFamilyChange,
  onColorChange,
  onPositionChange,
  onApplyToAll,
}: CaptionControlsProps) => {
  const [showFonts, setShowFonts] = useState(false);
  const [globalColor, setGlobalColor] = useState("#ffffff");
  const [globalSize, setGlobalSize] = useState(32);

  const movePosition = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 5;
    switch (direction) {
      case 'up': onPositionChange({ ...position, y: Math.max(10, position.y - step) }); break;
      case 'down': onPositionChange({ ...position, y: Math.min(90, position.y + step) }); break;
      case 'left': onPositionChange({ ...position, x: Math.max(10, position.x - step) }); break;
      case 'right': onPositionChange({ ...position, x: Math.min(90, position.x + step) }); break;
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg p-6 space-y-6">
      <h3 className="font-semibold text-lg">Caption Controls</h3>
      
      {/* Position */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Position</Label>
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <Button variant="outline" size="sm" onClick={() => movePosition('up')} className="rounded-xl">
            <ArrowUp className="w-4 h-4" />
          </Button>
          <div></div>
          <Button variant="outline" size="sm" onClick={() => movePosition('left')} className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            {position.x}, {position.y}
          </div>
          <Button variant="outline" size="sm" onClick={() => movePosition('right')} className="rounded-xl">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div></div>
          <Button variant="outline" size="sm" onClick={() => movePosition('down')} className="rounded-xl">
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Font Style</Label>
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between rounded-xl"
            onClick={() => setShowFonts(!showFonts)}
          >
            <span style={{ fontFamily }}>{fontFamily}</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
          {showFonts && (
            <div className="absolute z-50 w-full mt-1 max-h-[200px] overflow-y-auto bg-background border rounded-xl shadow-xl">
              {FONTS.map((font) => (
                <button
                  key={font}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                  style={{ fontFamily: font }}
                  onClick={() => {
                    onFontFamilyChange(font);
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

      {/* Font Size */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Font Size: {fontSize}px</Label>
        <input
          type="range"
          min="16"
          max="72"
          value={fontSize}
          onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Color</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start rounded-xl">
              <div 
                className="w-6 h-6 rounded-md border mr-2" 
                style={{ backgroundColor: color }}
              />
              <span>{color}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0" align="start">
            <ColorWheelPicker color={color} onChange={onColorChange} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Global Controls */}
      {onApplyToAll && (
        <div className="pt-4 border-t space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground">Apply to All Text</h4>
          
          {/* Global Color */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Global Color</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start rounded-xl">
                  <div 
                    className="w-6 h-6 rounded-md border mr-2" 
                    style={{ backgroundColor: globalColor }}
                  />
                  <span>{globalColor}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0" align="start">
                <ColorWheelPicker color={globalColor} onChange={setGlobalColor} />
              </PopoverContent>
            </Popover>
            <Button
              onClick={() => onApplyToAll({ color: globalColor })}
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
            >
              Apply Color to All
            </Button>
          </div>

          {/* Global Size */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Global Size: {globalSize}px</Label>
            <input
              type="range"
              min="16"
              max="72"
              value={globalSize}
              onChange={(e) => setGlobalSize(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <Button
              onClick={() => onApplyToAll({ fontSize: globalSize })}
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
            >
              Apply Size to All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
