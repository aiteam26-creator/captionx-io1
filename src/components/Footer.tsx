import { Sparkles } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-secondary/30 py-8 px-6 mt-20">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span>Made by</span>
          <span className="font-semibold text-foreground">CaptionEase Team</span>
          <span>—</span>
          <span className="flex items-center gap-1">
            Powered by AI
            <Sparkles className="w-4 h-4 text-primary" />
          </span>
        </div>
      </div>
    </footer>
  );
};
