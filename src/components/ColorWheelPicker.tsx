import { useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pipette } from "lucide-react";

interface ColorWheelPickerProps {
  color: string;
  onChange: (color: string) => void;
  showPresets?: boolean;
}

const PRESET_COLORS = [
  "#000000", "#3B4252", "#5E6B7E", "#8892A3", "#B0B8C5", "#D8DEE9", "#E5E9F0", "#ECEFF4",
  "#EF5350", "#FF7043", "#FDD835", "#66BB6A", "#42A5F5", "#5C6BC0", "#AB47BC", "#EC407A",
  "#FFAB91", "#FFCC80", "#FFF59D", "#A5D6A7", "#90CAF9", "#B39DDB", "#CE93D8", "#F48FB1",
  "#FFCCBC", "#FFE0B2", "#FFF9C4", "#C8E6C9", "#BBDEFB", "#D1C4E9", "#E1BEE7", "#F8BBD0",
];

export const ColorWheelPicker = ({ color, onChange, showPresets = true }: ColorWheelPickerProps) => {
  const [opacity, setOpacity] = useState(100);

  return (
    <div className="space-y-4 p-4 bg-card rounded-2xl shadow-lg border">
      {/* Color Wheel */}
      <div className="relative">
        <HexColorPicker 
          color={color} 
          onChange={onChange}
          className="!w-full !h-64 rounded-2xl overflow-hidden"
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <Label className="text-xs mb-2 block">Hex</Label>
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-background">
            <span className="text-muted-foreground">#</span>
            <HexColorInput
              color={color}
              onChange={onChange}
              className="flex-1 bg-transparent outline-none text-sm"
              prefixed={false}
            />
          </div>
        </div>

        <div className="w-24">
          <Label className="text-xs mb-2 block">Opacity</Label>
          <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-background">
            <Input
              type="number"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value) || 0)}
              className="w-full border-0 p-0 h-auto text-sm bg-transparent"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>

        <div className="pt-6">
          <button className="p-2 rounded-xl border bg-background hover:bg-muted transition-colors">
            <Pipette className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Brand Colors */}
      {showPresets && (
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Brand Colors</Label>
          
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLORS.map((presetColor, index) => (
              <button
                key={index}
                onClick={() => onChange(presetColor)}
                className="w-10 h-10 rounded-full border-2 border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
