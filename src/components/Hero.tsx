import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onTryNow: () => void;
}

export const Hero = ({ onTryNow }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Simple badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-xs font-medium text-primary tracking-wide">AI-Powered Caption Editor</span>
        </div>

        {/* Clean heading */}
        <h1 className="text-5xl md:text-7xl font-light tracking-tight text-foreground">
          Turn captions into
          <br />
          <span className="font-semibold text-primary">creative typographies</span>
        </h1>

        {/* Simple description */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Edit each word individually with precision. 
          Choose fonts, adjust sizes, and position captions exactly where you want them.
        </p>

        {/* Minimal CTA */}
        <div className="pt-4">
          <Button
            onClick={onTryNow}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-lg text-base group"
          >
            Start Creating
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Simple features */}
        <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-primary">AI</div>
            <p className="text-sm text-muted-foreground">Transcription</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-primary">30+</div>
            <p className="text-sm text-muted-foreground">Fonts</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-primary">100%</div>
            <p className="text-sm text-muted-foreground">Customizable</p>
          </div>
        </div>
      </div>
    </section>
  );
};
