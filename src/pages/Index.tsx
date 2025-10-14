import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";
import { FAQs } from "@/components/FAQs";
import { AuthModal } from "@/components/AuthModal";
import { EditorWorkspace } from "@/components/EditorWorkspace";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowEditor(true);
    // Smooth scroll to editor
    setTimeout(() => {
      document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation onLoginClick={handleGetStarted} />
      <Hero onTryNow={handleGetStarted} />
      <Features />
      <Pricing onGetStarted={handleGetStarted} />
      <FAQs />
      
      {showEditor && isAuthenticated && (
        <div id="editor" className="py-20">
          <EditorWorkspace />
        </div>
      )}
      
      <Footer />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
