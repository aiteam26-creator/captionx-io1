import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Film, Zap, Leaf, Palette, Minimize2, Clock } from "lucide-react";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { getKeyframesForVideo } from "@/utils/keyframeExtractor";
import { AssPreviewOverlay } from "./AssPreviewOverlay";

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
    color: 'from-purple-500 to-pink-500',
    icon: Film,
    preview: 'Dramatic & Elegant',
    fontStyle: 'font-serif text-lg font-bold',
    features: ['Serif Typography', 'Fade Transitions', 'Wide Letter Spacing']
  },
  {
    id: 'robotic',
    name: 'Robotic',
    description: 'Monospace fonts with glitch effects and cyan tones',
    color: 'from-cyan-500 to-blue-500',
    icon: Zap,
    preview: 'TECH_STYLE.EXE',
    fontStyle: 'font-mono text-sm tracking-wider',
    features: ['Monospace Font', 'Glitch Effects', 'Tech Aesthetic']
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Organic fonts with earth tones and flowing animations',
    color: 'from-green-500 to-emerald-500',
    icon: Leaf,
    preview: 'Natural Flow',
    fontStyle: 'font-sans text-base italic',
    features: ['Earth Tones', 'Smooth Flow', 'Organic Movement']
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Bold fonts with vibrant colors and glow effects',
    color: 'from-pink-500 to-yellow-500',
    icon: Palette,
    preview: 'BRIGHT & BOLD',
    fontStyle: 'font-bold text-xl tracking-wide',
    features: ['Vibrant Colors', 'Glow Effects', 'High Impact']
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean sans-serif with simple, elegant positioning',
    color: 'from-gray-500 to-slate-500',
    icon: Minimize2,
    preview: 'simple clean',
    fontStyle: 'font-sans text-sm tracking-tight',
    features: ['Clean Design', 'Sans-serif', 'Subtle Style']
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Vintage fonts with warm colors and classic style',
    color: 'from-orange-500 to-red-500',
    icon: Clock,
    preview: 'Groovy Vibes',
    fontStyle: 'font-bold text-lg',
    features: ['Vintage Style', 'Warm Colors', 'Classic Look']
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
    <Card className="p-6 space-y-6 bg-gradient-to-br from-background to-muted/20">
      <div className="space-y-3">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Themed Captions
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Generate beautifully styled .ass captions with AI-powered typography, positioning, and animations tailored to your content
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Choose Your Style</Label>
        <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEMES.map((theme) => {
              const Icon = theme.icon;
              return (
                <Card 
                  key={theme.id}
                  className={`
                    group relative overflow-hidden cursor-pointer transition-all duration-300
                    ${selectedTheme === theme.id 
                      ? 'ring-2 ring-primary shadow-xl scale-[1.02] bg-primary/5' 
                      : 'hover:shadow-lg hover:scale-[1.01] hover:bg-accent/50'
                    }
                  `}
                  onClick={() => setSelectedTheme(theme.id)}
                >
                  {/* Animated gradient background */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${theme.color} 
                    ${selectedTheme === theme.id ? 'opacity-15' : 'opacity-10 group-hover:opacity-12'}
                    transition-opacity duration-300
                  `} />
                  
                  {/* Content */}
                  <div className="relative p-5 space-y-4">
                    {/* Header with icon and radio */}
                    <div className="flex items-start gap-3">
                      <RadioGroupItem 
                        value={theme.id} 
                        id={theme.id} 
                        className="mt-1.5" 
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-5 h-5 bg-gradient-to-br ${theme.color} bg-clip-text text-transparent`} />
                          <Label 
                            htmlFor={theme.id} 
                            className="font-bold text-base cursor-pointer"
                          >
                            {theme.name}
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {theme.description}
                        </p>
                      </div>
                    </div>

                    {/* Preview text with theme-specific styling */}
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border/50">
                      <div className={`
                        ${theme.fontStyle}
                        bg-gradient-to-r ${theme.color} bg-clip-text text-transparent
                        text-center py-2
                      `}>
                        {theme.preview}
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="flex flex-wrap gap-1.5">
                      {theme.features.map((feature, idx) => (
                        <span 
                          key={idx}
                          className={`
                            text-[10px] px-2 py-1 rounded-full
                            bg-gradient-to-r ${theme.color} 
                            ${selectedTheme === theme.id ? 'text-white' : 'text-white/90'}
                            font-medium
                          `}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || captions.length === 0}
          className="gap-2 flex-1 h-12 text-base font-semibold"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating {selectedTheme} style...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate {THEMES.find(t => t.id === selectedTheme)?.name} Captions
            </>
          )}
        </Button>
      </div>

      <AssPreviewOverlay
        videoRef={videoRef}
        assContent={generatedAssContent}
        onAssContentChange={setGeneratedAssContent}
      />
    </Card>
  );
};
