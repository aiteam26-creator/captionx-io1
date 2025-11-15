import { useState } from "react";
import { Hero } from "@/components/Hero";
import { ProEditorWorkspace } from "@/components/ProEditorWorkspace";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [showEditor, setShowEditor] = useState(false);

  const handleTryNow = () => {
    setShowEditor(true);
    setTimeout(() => {
      document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Show editor if requested
  if (showEditor) {
    return (
      <div className="min-h-screen bg-background">
        <ProEditorWorkspace />
        <Footer />
      </div>
    );
  }

  // Show landing page
  return (
    <div className="min-h-screen bg-background">
      {/* Brand name - top left */}
      <div className="fixed top-4 left-4 z-50">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
          captionx.io
        </h1>
      </div>
      
      {/* Theme toggle - top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Hero onTryNow={handleTryNow} />
      <Footer />
    </div>
  );
};

export default Index;
