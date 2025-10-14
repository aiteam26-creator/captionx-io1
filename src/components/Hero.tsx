import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onTryNow: () => void;
}

export const Hero = ({ onTryNow }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
              <span className="text-xs font-medium text-muted-foreground tracking-wide">Built by AI Enthusiasts</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight">
              Turn captions into{" "}
              <span className="block mt-2">creative typographies</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Edit each word individually with precision. Choose fonts, adjust sizes, and position captions exactly where you want them.
            </p>

            {/* CTA Button */}
            <div className="pt-4">
              <Button
                onClick={onTryNow}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-xl text-lg group shadow-lg shadow-primary/20"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Experience smarter & more accurate answers
            </p>
          </div>

          {/* Right side - Preview/Demo */}
          <div className="relative">
            <div className="aspect-video rounded-2xl border-2 border-primary/30 bg-card/50 backdrop-blur-sm p-8 shadow-2xl shadow-primary/20">
              <div className="space-y-4">
                <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-muted rounded animate-pulse" />
                <div className="mt-8 flex gap-2">
                  <div className="h-10 w-32 bg-primary/20 rounded" />
                  <div className="h-10 w-32 bg-muted rounded" />
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};
