import { useState } from "react";
import { Hero } from "@/components/Hero";
import { ProEditorWorkspace } from "@/components/ProEditorWorkspace";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [showEditor, setShowEditor] = useState(false);

  const handleTryNow = () => {
    setShowEditor(true);
    // Smooth scroll to editor
    setTimeout(() => {
      document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Hero onTryNow={handleTryNow} />
      
      {showEditor && (
        <div id="editor">
          <ProEditorWorkspace />
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Index;
