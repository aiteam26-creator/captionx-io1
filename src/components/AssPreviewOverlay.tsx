import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, EyeOff, Edit3, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface AssPreviewOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  assContent: string | null;
  onAssContentChange?: (content: string) => void;
}

export const AssPreviewOverlay = ({ 
  videoRef, 
  assContent,
  onAssContentChange 
}: AssPreviewOverlayProps) => {
  const { toast } = useToast();
  const [showOverlay, setShowOverlay] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(assContent || '');
  const [parsedStyles, setParsedStyles] = useState<any[]>([]);
  const [parsedDialogues, setParsedDialogues] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (assContent) {
      setEditedContent(assContent);
      parseAssContent(assContent);
    }
  }, [assContent]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoRef]);

  const parseAssContent = (content: string) => {
    try {
      // Parse styles
      const stylesMatch = content.match(/\[V4\+ Styles\]([\s\S]*?)\[Events\]/);
      if (stylesMatch) {
        const styleLines = stylesMatch[1].split('\n').filter(l => l.startsWith('Style:'));
        const styles = styleLines.map(line => {
          const parts = line.substring(7).split(',').map(s => s.trim());
          return {
            name: parts[0],
            fontname: parts[1],
            fontsize: parseInt(parts[2]),
            primaryColor: parts[3],
          };
        });
        setParsedStyles(styles);
      }

      // Parse dialogue lines
      const eventsMatch = content.match(/\[Events\]([\s\S]*?)$/);
      if (eventsMatch) {
        const dialogueLines = eventsMatch[1].split('\n').filter(l => l.startsWith('Dialogue:'));
        const dialogues = dialogueLines.map(line => {
          const parts = line.substring(10).split(',');
          const startTime = parseAssTime(parts[1]);
          const endTime = parseAssTime(parts[2]);
          const style = parts[3];
          const text = parts.slice(9).join(',').trim();
          
          return {
            start: startTime,
            end: endTime,
            style,
            text: text.replace(/\{[^}]*\}/g, ''), // Remove ASS tags for preview
            rawText: text,
          };
        });
        setParsedDialogues(dialogues);
      }
    } catch (error) {
      console.error('Error parsing ASS content:', error);
    }
  };

  const parseAssTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const handleSaveEdit = () => {
    parseAssContent(editedContent);
    onAssContentChange?.(editedContent);
    setIsEditing(false);
    toast({
      title: "Captions updated",
      description: "Your changes have been saved",
    });
  };

  const handleDownload = () => {
    const content = isEditing ? editedContent : assContent;
    if (!content) return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.ass';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: ".ass caption file saved",
    });
  };

  if (!assContent) return null;

  const activeDialogues = parsedDialogues.filter(
    d => currentTime >= d.start && currentTime <= d.end
  );

  return (
    <Card className="mt-4 overflow-hidden">
      <Tabs defaultValue="preview" className="w-full">
        <div className="border-b px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Generated .ass Captions</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowOverlay(!showOverlay)}
                className="gap-2"
              >
                {showOverlay ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showOverlay ? 'Hide' : 'Show'} Overlay
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="w-3 h-3" />
                Download
              </Button>
            </div>
          </div>
          <TabsList className="w-full">
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
            <TabsTrigger value="edit" className="flex-1">Edit Source</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="preview" className="p-4 space-y-3 m-0">
          {showOverlay && activeDialogues.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
              <p className="text-xs text-muted-foreground mb-2">Active Captions:</p>
              {activeDialogues.map((d, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <span className="font-semibold text-sm">{d.text}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({d.start.toFixed(2)}s - {d.end.toFixed(2)}s)
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-xs font-medium">Caption Stats:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-muted rounded">
                <span className="text-muted-foreground">Total Captions:</span>
                <span className="ml-2 font-semibold">{parsedDialogues.length}</span>
              </div>
              <div className="p-2 bg-muted rounded">
                <span className="text-muted-foreground">Styles:</span>
                <span className="ml-2 font-semibold">{parsedStyles.length}</span>
              </div>
            </div>
          </div>

          {parsedStyles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Style Definitions:</p>
              <div className="space-y-1">
                {parsedStyles.map((style, i) => (
                  <div key={i} className="text-xs p-2 bg-muted/50 rounded">
                    <span className="font-semibold">{style.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {style.fontname}, {style.fontsize}px
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="edit" className="p-4 space-y-3 m-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Edit .ass Source</Label>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="gap-2"
                >
                  <Check className="w-3 h-3" />
                  Save Changes
                </Button>
              )}
            </div>
            <Textarea
              value={editedContent}
              onChange={(e) => {
                setEditedContent(e.target.value);
                setIsEditing(true);
              }}
              className="font-mono text-xs h-64 resize-none"
              placeholder=".ass file content..."
            />
            <p className="text-xs text-muted-foreground">
              Edit the .ass file directly. Changes will update the preview when saved.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
