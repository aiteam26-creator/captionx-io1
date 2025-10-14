import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface HeroProps {
  onTryNow: () => void;
}

export const Hero = ({ onTryNow }: HeroProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary/30 py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Turn captions into creative typographies — instantly.
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
          CaptionX.io lets you edit each word individually — move, resize, and restyle captions easily with trending typography templates.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Button 
            size="lg" 
            onClick={onTryNow}
            className="text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Try Now
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-accent transition-all"
          >
            <Play className="w-5 h-5 mr-2" />
            Watch Demo
          </Button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/30 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};
