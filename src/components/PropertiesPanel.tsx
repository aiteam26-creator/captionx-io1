import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Type, Palette, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorWheelPicker } from "./ColorWheelPicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

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
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const typographySectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to typography section when a caption is selected
  useEffect(() => {
    if (caption && typographySectionRef.current && containerRef.current) {
      setTimeout(() => {
        typographySectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }, 100);
    }
  }, [caption]);

  if (!caption) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-3 opacity-60">
          <Type className="w-10 h-10 mx-auto text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground font-medium">
            Select a caption to edit
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="p-5 space-y-5">
        
        {/* Typography Section */}
        <div ref={typographySectionRef} className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Typography</span>
          </div>
          
          {/* Caption Text */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Text</Label>
            <Input
              value={caption.word}
              onChange={(e) => onUpdate({ word: e.target.value })}
              className="h-9 text-sm border-border/60 focus:border-foreground transition-colors bg-background hover:bg-accent/30"
              placeholder="Enter caption text"
            />
          </div>

          {/* Font Selector with Live Preview */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Font</Label>
            <div className="relative">
              <button
                onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                className="w-full h-9 px-3 flex items-center justify-between text-sm border border-border/60 rounded-md bg-background hover:bg-accent/30 hover:border-foreground transition-all"
              >
                <span style={{ fontFamily: caption.fontFamily || "Inter" }} className="truncate">
                  {caption.fontFamily || "Inter"}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", fontDropdownOpen && "rotate-180")} />
              </button>
              
              {fontDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFontDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto animate-slide-up">
                    {FONTS.map((font) => (
                      <button
                        key={font}
                        onClick={() => {
                          onUpdate({ fontFamily: font });
                          setFontDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors flex items-center justify-between group",
                          caption.fontFamily === font && "bg-accent/50"
                        )}
                        style={{ fontFamily: font }}
                      >
                        <span className="truncate">{font}</span>
                        {caption.fontFamily === font && (
                          <Check className="w-3.5 h-3.5 text-foreground" strokeWidth={2.5} />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Size</Label>
              <span className="text-xs font-mono text-foreground bg-accent/50 px-2 py-0.5 rounded">
                {caption.fontSize || 32}px
              </span>
            </div>
            <Slider
              min={12}
              max={144}
              step={1}
              value={[caption.fontSize || 32]}
              onValueChange={(value) => onUpdate({ fontSize: value[0] })}
              className="py-3"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50" />

        {/* Colors Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colors</span>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Text Color</Label>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start h-10">
                  <div 
                    className="w-6 h-6 rounded-md border mr-2" 
                    style={{ backgroundColor: caption.color || "#ffffff" }}
                  />
                  <span className="font-mono text-xs">{caption.color || "#ffffff"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0" align="start">
                <ColorWheelPicker 
                  color={caption.color || "#ffffff"} 
                  onChange={(color) => onUpdate({ color })} 
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Background</Label>
            
            {/* Background Swatches */}
            <div className="flex flex-wrap gap-1.5">
              {/* Transparent Option */}
              <button
                onClick={() => onUpdate({ backgroundColor: "transparent" })}
                className={cn(
                  "w-7 h-7 rounded-md border-2 transition-all hover:scale-110 relative",
                  !caption.backgroundColor || caption.backgroundColor === "transparent"
                    ? "border-foreground shadow-md scale-105"
                    : "border-border/40 hover:border-foreground/40"
                )}
                style={{ 
                  background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 8px 8px'
                }}
                title="Transparent"
              >
                {(!caption.backgroundColor || caption.backgroundColor === "transparent") && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-3 h-3 text-foreground drop-shadow-md" strokeWidth={3} />
                  </div>
                )}
              </button>
              
              {COLOR_SWATCHES.slice(0, 6).map((swatch) => (
                <button
                  key={swatch}
                  onClick={() => onUpdate({ backgroundColor: swatch + "E6" })}
                  className={cn(
                    "w-7 h-7 rounded-md border-2 transition-all hover:scale-110 relative",
                    caption.backgroundColor?.slice(0, 7).toUpperCase() === swatch
                      ? "border-foreground shadow-md scale-105"
                      : "border-border/40 hover:border-foreground/40"
                  )}
                  style={{ backgroundColor: swatch + "E6" }}
                  title={swatch}
                >
                  {caption.backgroundColor?.slice(0, 7).toUpperCase() === swatch && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white drop-shadow-md" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Hex Input */}
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={caption.backgroundColor?.slice(0, 7) || "#000000"}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value + "E6" })}
                className="h-8 w-12 p-0.5 cursor-pointer border-border/60"
              />
              <Input
                value={caption.backgroundColor || "transparent"}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="h-8 flex-1 font-mono text-[11px] border-border/60 focus:border-foreground transition-colors bg-background"
                placeholder="transparent"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50" />

        {/* Position Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Position</span>
          </div>

          {/* Horizontal Position */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Horizontal</Label>
              <span className="text-xs font-mono text-foreground bg-accent/50 px-2 py-0.5 rounded">
                {caption.positionX || 50}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[caption.positionX || 50]}
              onValueChange={(value) => onUpdate({ positionX: value[0] })}
              className="py-3"
            />
          </div>

          {/* Vertical Position */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Vertical</Label>
              <span className="text-xs font-mono text-foreground bg-accent/50 px-2 py-0.5 rounded">
                {caption.positionY || 80}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[caption.positionY || 80]}
              onValueChange={(value) => onUpdate({ positionY: value[0] })}
              className="py-3"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
