import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Zap } from "lucide-react";

interface HeroProps {
  onTryNow: () => void;
}

export const Hero = ({ onTryNow }: HeroProps) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-6">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-rainbow opacity-20 animate-rainbow bg-[length:200%_200%]" />
      
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 animate-slide-up">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-primary shadow-glow animate-bounce-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-bebas tracking-wider text-primary">AI-Powered Caption Magic</span>
        </div>

        {/* Main heading */}
        <h1 className="text-6xl md:text-8xl font-bebas tracking-tight">
          <span className="text-gradient block mb-2 bg-[length:200%_200%] animate-rainbow">
            CAPTIONX.IO
          </span>
          <span className="text-foreground text-4xl md:text-5xl font-poppins font-light">
            Transform Your Captions
          </span>
        </h1>

        {/* Description */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-poppins">
          Edit <span className="text-primary font-semibold">each word</span> individually. 
          Choose from <span className="text-accent font-semibold">stunning fonts</span>. 
          Create <span className="gradient-pink-purple text-transparent bg-clip-text font-semibold">creative typographies</span> instantly.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            onClick={onTryNow}
            size="lg"
            className="gradient-purple-blue text-white hover:scale-105 transition-all duration-300 shadow-glow text-lg px-8 py-6 rounded-2xl font-bebas tracking-wider"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            Start Creating
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-primary hover:bg-primary/10 transition-all duration-300 text-lg px-8 py-6 rounded-2xl font-bebas tracking-wider"
          >
            <Zap className="w-5 h-5 mr-2" />
            See Demo
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[
            { icon: "🎨", title: "Creative Fonts", color: "gradient-pink-purple" },
            { icon: "⚡", title: "AI Transcription", color: "gradient-purple-blue" },
            { icon: "✨", title: "Word-by-Word Edit", color: "gradient-blue-cyan" },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-border hover:scale-105 transition-all duration-300 animate-bounce-in shadow-glow"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className={`font-bebas text-xl tracking-wide ${feature.color} text-transparent bg-clip-text`}>
                {feature.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
