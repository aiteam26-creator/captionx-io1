import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CaptionGenerationLoaderProps {
  progress: number;
}

export const CaptionGenerationLoader = ({ progress }: CaptionGenerationLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6">
      {/* Animated sparkles container */}
      <div className="relative mb-12">
        {/* Main sparkle icon with pulse */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
          <Sparkles className="w-10 h-10 relative z-10 animate-pulse" style={{ animationDuration: '2s' }} />
        </div>
        
        {/* Floating sparkles */}
        <div className="absolute -top-2 -right-2 w-4 h-4">
          <Sparkles className="w-4 h-4 text-muted-foreground animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        </div>
        <div className="absolute -bottom-1 -left-3 w-3 h-3">
          <Sparkles className="w-3 h-3 text-muted-foreground animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }} />
        </div>
        <div className="absolute top-1 -right-6 w-2.5 h-2.5">
          <Sparkles className="w-2.5 h-2.5 text-muted-foreground/70 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }} />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center mb-8 space-y-2">
        <h3 className="text-2xl font-semibold tracking-tight">
          Generating captions
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Our AI is analyzing your video and creating perfectly timed captions
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-3">
        <Progress value={progress} className="h-1.5" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{progress}% complete</span>
          <span className="animate-pulse">Please wait...</span>
        </div>
      </div>

      {/* Reassuring message */}
      <p className="text-xs text-muted-foreground mt-8 text-center max-w-sm">
        This usually takes 30-60 seconds depending on video length
      </p>
    </div>
  );
};
