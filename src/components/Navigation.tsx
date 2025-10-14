import { Button } from "@/components/ui/button";

interface NavigationProps {
  onLoginClick: () => void;
}

export const Navigation = ({ onLoginClick }: NavigationProps) => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-xl">C</span>
          </div>
          <span className="text-xl font-semibold text-foreground">CaptionAI</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1 px-4 py-2 rounded-full bg-muted/50 border border-border/40">
          <button
            onClick={() => scrollToSection('features')}
            className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection('faqs')}
            className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            FAQs
          </button>
        </div>

        {/* Log In Button */}
        <Button
          onClick={onLoginClick}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
        >
          Log In →
        </Button>
      </div>
    </nav>
  );
};
