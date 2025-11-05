import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { ArrowRight, Sparkles, Type, Sliders } from "lucide-react";

interface HeroProps {
  onTryNow: () => void;
}

export const Hero = ({ onTryNow }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Theme toggle - top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Subtle gradient background */}
      <div className="absolute inset-0 gradient-accent opacity-60 -z-10" />
      
      <div className="max-w-6xl mx-auto px-6 py-32">
        {/* Badge */}
        <div className="flex justify-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium tracking-wide">AI-Powered Caption Editor</span>
          </div>
        </div>

        {/* Hero heading */}
        <h1 className="text-center text-6xl md:text-8xl font-semibold tracking-tight mb-6 text-balance animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Turn captions into
          <br />
          <span className="relative inline-block mt-2">
            creative art
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 10C52.3333 4.66667 152.4 -1.6 298 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed text-balance animate-slide-up" style={{ animationDelay: "0.2s" }}>
          Edit every word with precision. Choose from 30+ fonts, adjust sizes, colors, and position captions exactly where they belong.
        </p>

        {/* CTA */}
        <div className="flex justify-center mb-24 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <Button
            onClick={onTryNow}
            size="lg"
            className="h-14 px-8 text-base font-medium hover-lift group"
          >
            Start Creating
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="group p-8 rounded-2xl glass hover-lift hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Transcription</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automatic speech-to-text with high accuracy
            </p>
          </div>

          <div className="group p-8 rounded-2xl glass hover-lift hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Type className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">30+ Fonts</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional typography library at your fingertips
            </p>
          </div>

          <div className="group p-8 rounded-2xl glass hover-lift hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">100% Customizable</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fine-tune every detail to match your vision
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
