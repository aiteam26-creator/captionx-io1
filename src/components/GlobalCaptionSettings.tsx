import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wand2, RotateCcw } from "lucide-react";
import { Separator } from "./ui/separator";

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

interface GlobalCaptionSettingsProps {
  captions: Caption[];
  onApplySettings: (updates: Partial<Caption>) => void;
  selectedAnimation?: string;
  onAnimationChange?: (animation: string) => void;
  wordsPerCaption?: number;
  onWordsPerCaptionChange?: (words: number) => void;
}

const FONTS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Open Sans",
  "Lato",
  "Raleway",
  "Playfair Display",
  "Merriweather",
  "Lora",
  "Bebas Neue",
  "Oswald",
  "Nunito",
  "Ubuntu",
  "PT Sans",
  "Crimson Text",
  "Archivo",
  "Cabin",
  "Quicksand",
  "Barlow",
  "Barlow Condensed",
  "Righteous",
  "Bungee",
  "Permanent Marker",
  "Bangers",
  "Black Ops One",
  "Fredoka One",
  "Audiowide",
  "Pacifico",
  "Dancing Script",
  "Great Vibes",
  "Sacramento",
  "Satisfy",
  "Caveat",
  "Kaushan Script",
  "Lobster",
  "Cookie",
  "Courgette",
  "Amatic SC",
  "Indie Flower",
  "Shadows Into Light",
  "Patrick Hand",
  "Reenie Beanie",
  "Rock Salt",
  "Covered By Your Grace",
  "Homemade Apple",
  "Architects Daughter",
  "Waiting for the Sunrise",
  "Arial",
  "Helvetica",
];

const POSITION_PRESETS = [
  { name: "Bottom Center", x: 50, y: 85 },
  { name: "Top Center", x: 50, y: 15 },
  { name: "Bottom Left", x: 15, y: 85 },
  { name: "Bottom Right", x: 85, y: 85 },
  { name: "Top Left", x: 15, y: 15 },
  { name: "Top Right", x: 85, y: 15 },
  { name: "Middle Left", x: 15, y: 50 },
  { name: "Middle Right", x: 85, y: 50 },
];

const COLOR_PRESETS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
  { name: "Gold", value: "#FFD700" },
  { name: "Cyan", value: "#00FFFF" },
  { name: "Pink", value: "#FF1493" },
  { name: "Green", value: "#00FF00" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0080FF" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Purple", value: "#9B30FF" },
];

const ANIMATIONS = [
  { id: 'none', name: 'No Animation', description: 'Simple fade in/out' },
  { id: 'popup', name: 'Pop Up', description: 'Scale from small to normal size' },
  { id: 'jump', name: 'Jump', description: 'Bounce up and settle down' },
  { id: 'slide-left', name: 'Slide Left to Right', description: 'Enter from left side' },
  { id: 'slide-right', name: 'Slide Right to Left', description: 'Enter from right side' },
  { id: 'slide-up', name: 'Slide Up', description: 'Enter from bottom' },
  { id: 'slide-down', name: 'Slide Down', description: 'Enter from top' },
  { id: 'fade', name: 'Fade In', description: 'Smooth opacity transition' },
  { id: 'zoom', name: 'Zoom In', description: 'Scale from large to normal' },
  { id: 'rotate', name: 'Rotate In', description: 'Spin and fade in' },
  { id: 'wave', name: 'Wave', description: 'Character-by-character wave effect' }
];

export const GlobalCaptionSettings = ({ 
  captions, 
  onApplySettings,
  selectedAnimation = 'popup',
  onAnimationChange,
  wordsPerCaption = 4,
  onWordsPerCaptionChange
}: GlobalCaptionSettingsProps) => {
  const { toast } = useToast();
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [color, setColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("rgba(0, 0, 0, 0.75)");
  const [selectedPosition, setSelectedPosition] = useState<string>("Bottom Center");

  const handleApplyToAll = () => {
    const position = POSITION_PRESETS.find(p => p.name === selectedPosition);
    
    const updates: Partial<Caption> = {
      fontSize,
      fontFamily,
      color,
      backgroundColor,
      ...(position && { positionX: position.x, positionY: position.y })
    };

    onApplySettings(updates);

    toast({
      title: "Settings Applied! ✨",
      description: `Updated ${captions.length} captions`,
    });
  };

  const handleReset = () => {
    setFontSize(32);
    setFontFamily("Inter");
    setColor("#FFFFFF");
    setBackgroundColor("rgba(0, 0, 0, 0.75)");
    setSelectedPosition("Bottom Center");

    toast({
      title: "Reset Complete",
      description: "Settings restored to defaults",
    });
  };

  const handleQuickColor = (colorValue: string) => {
    setColor(colorValue);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          Global Caption Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Customize all captions at once
        </p>
      </div>

      <Separator />

      {/* Font Settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Font Family</Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80 bg-background z-50">
              {FONTS.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font, fontSize: "16px" }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Font Size</Label>
            <span className="text-sm text-muted-foreground">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={(value) => setFontSize(value[0])}
            min={16}
            max={72}
            step={2}
            className="w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Color Settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Text Color</Label>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleQuickColor(preset.value)}
                className={`
                  h-10 rounded border-2 transition-all hover:scale-110
                  ${color === preset.value ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                `}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
              />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-20 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Background</Label>
          <div className="flex gap-2 items-center">
            <Select 
              value={backgroundColor} 
              onValueChange={setBackgroundColor}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transparent">Transparent</SelectItem>
                <SelectItem value="rgba(0, 0, 0, 0.5)">Semi-transparent Black</SelectItem>
                <SelectItem value="rgba(0, 0, 0, 0.75)">Dark</SelectItem>
                <SelectItem value="rgba(0, 0, 0, 1)">Solid Black</SelectItem>
                <SelectItem value="rgba(255, 255, 255, 0.5)">Semi-transparent White</SelectItem>
                <SelectItem value="rgba(255, 255, 255, 0.9)">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Position Settings */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Position Preset</Label>
        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POSITION_PRESETS.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Apply a consistent position to all captions
        </p>
      </div>

      <Separator />

      {/* Caption Settings */}
      {onAnimationChange && onWordsPerCaptionChange && (
        <>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Caption Settings</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Animation Style</Label>
                <Select value={selectedAnimation} onValueChange={onAnimationChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select animation" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {ANIMATIONS.map((anim) => (
                      <SelectItem key={anim.id} value={anim.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{anim.name}</span>
                          <span className="text-xs text-muted-foreground">{anim.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Words Per Caption</Label>
                <Select 
                  value={wordsPerCaption.toString()} 
                  onValueChange={(v) => onWordsPerCaptionChange(parseInt(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'word' : 'words'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Each caption will show {wordsPerCaption} words in a single line
                </p>
              </div>
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preview</Label>
        <div className="relative h-24 bg-muted/50 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
          <div
            className="px-4 py-2 rounded-lg"
            style={{
              fontFamily,
              fontSize: `${fontSize * 0.5}px`,
              color,
              backgroundColor,
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            }}
          >
            Sample Caption
          </div>
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleApplyToAll}
          className="gap-2 flex-1"
          disabled={captions.length === 0}
        >
          <Wand2 className="w-4 h-4" />
          Apply to All ({captions.length})
        </Button>

        <Button
          onClick={handleReset}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>
    </Card>
  );
};
