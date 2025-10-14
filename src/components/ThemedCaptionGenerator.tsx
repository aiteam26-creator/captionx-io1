import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Download, Loader2 } from "lucide-react";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { getKeyframesForVideo } from "@/utils/keyframeExtractor";

interface Caption {
  word: string;
  start: number;
  end: number;
}

interface ThemedCaptionGeneratorProps {
  captions: Caption[];
  videoRef: React.RefObject<HTMLVideoElement>;
  videoId?: string;
}

const THEMES = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Dramatic serif fonts with elegant fade effects',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'robotic',
    name: 'Robotic',
    description: 'Monospace fonts with glitch effects and cyan tones',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Organic fonts with earth tones and flowing animations',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Bold fonts with vibrant colors and glow effects',
    color: 'from-pink-500 to-yellow-500'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean sans-serif with simple, elegant positioning',
    color: 'from-gray-500 to-slate-500'
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Vintage fonts with warm colors and classic style',
    color: 'from-orange-500 to-red-500'
  }
];

export const ThemedCaptionGenerator = ({ 
  captions, 
  videoRef,
  videoId 
}: ThemedCaptionGeneratorProps) => {
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssContent, setGeneratedAssContent] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!videoRef.current || captions.length === 0) {
      toast({
        title: "Error",
        description: "No captions available. Please generate captions first.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedAssContent(null);

    try {
      toast({
        title: "Generating themed captions...",
        description: `Creating ${selectedTheme} style with AI`,
      });

      // Get keyframes if available
      let keyframes = null;
      if (videoId) {
        try {
          keyframes = await getKeyframesForVideo(videoId);
        } catch (e) {
          console.log('No keyframes available, proceeding without them');
        }
      }

      const { data, error } = await supabase.functions.invoke('generate-themed-captions', {
        body: {
          theme: selectedTheme,
          captions,
          keyframes,
          videoDuration: videoRef.current.duration
        }
      });

      if (error) throw error;
      if (!data || !data.assContent) throw new Error('No caption content generated');

      setGeneratedAssContent(data.assContent);

      toast({
        title: "Success! ✨",
        description: `${selectedTheme} themed captions generated`,
      });
    } catch (error) {
      console.error('Caption generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedAssContent) return;

    const blob = new Blob([generatedAssContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions-${selectedTheme}.ass`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Themed .ass caption file saved",
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Themed Captions
        </h3>
        <p className="text-sm text-muted-foreground">
          Generate beautifully styled .ass captions with AI-powered typography and positioning
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Select Theme</Label>
        <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {THEMES.map((theme) => (
              <Card 
                key={theme.id}
                className={`
                  relative overflow-hidden cursor-pointer transition-all
                  ${selectedTheme === theme.id 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : 'hover:shadow-md'
                  }
                `}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-10`} />
                <div className="relative p-4 flex items-start gap-3">
                  <RadioGroupItem value={theme.id} id={theme.id} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label 
                      htmlFor={theme.id} 
                      className="font-semibold cursor-pointer"
                    >
                      {theme.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {theme.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || captions.length === 0}
          className="gap-2 flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Themed Captions
            </>
          )}
        </Button>

        {generatedAssContent && (
          <Button
            onClick={handleDownload}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download .ass
          </Button>
        )}
      </div>

      {generatedAssContent && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Preview</p>
              <span className="text-xs text-muted-foreground">
                {generatedAssContent.length.toLocaleString()} characters
              </span>
            </div>
            <pre className="text-xs max-h-40 overflow-auto p-3 bg-background rounded border">
              {generatedAssContent.slice(0, 500)}...
            </pre>
          </div>
        </Card>
      )}
    </Card>
  );
};
