import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Split, Save, X } from "lucide-react";

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

interface ManualSubtitleEditorProps {
  caption: Caption;
  onUpdate: (updates: Partial<Caption>) => void;
  onSplit: () => void;
  onClose: () => void;
}

export const ManualSubtitleEditor = ({
  caption,
  onUpdate,
  onSplit,
  onClose,
}: ManualSubtitleEditorProps) => {
  const [text, setText] = useState(caption.word);
  const [startTime, setStartTime] = useState(caption.start.toFixed(2));
  const [endTime, setEndTime] = useState(caption.end.toFixed(2));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(timeStr);
  };

  const handleSave = () => {
    const updates: Partial<Caption> = {
      word: text,
      start: parseTime(startTime),
      end: parseTime(endTime),
    };
    onUpdate(updates);
  };

  return (
    <Card className="p-4 space-y-4 bg-background/95 backdrop-blur-sm border-primary/20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Edit Subtitle</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subtitle-text">Subtitle Text</Label>
          <Input
            id="subtitle-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type subtitle text..."
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="0:00.00"
            />
            <p className="text-xs text-muted-foreground">
              {formatTime(parseTime(startTime))}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="0:00.00"
            />
            <p className="text-xs text-muted-foreground">
              {formatTime(parseTime(endTime))}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button onClick={onSplit} variant="outline">
            <Split className="h-4 w-4 mr-2" />
            Split
          </Button>
        </div>
      </div>
    </Card>
  );
};
