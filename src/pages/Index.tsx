import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { ProEditorWorkspace } from "@/components/ProEditorWorkspace";
import { Footer } from "@/components/Footer";
import { SignInForm } from "@/components/SignInForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && showSignIn) {
        setShowSignIn(false);
        setShowEditor(true);
        setTimeout(() => {
          document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [showSignIn]);

  const handleTryNow = () => {
    if (user) {
      // User already signed in, show editor directly
      setShowEditor(true);
      setTimeout(() => {
        document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // Show sign in form
      setShowSignIn(true);
    }
  };

  const handleSignInSuccess = () => {
    setShowEditor(true);
    setTimeout(() => {
      document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (showSignIn && !user) {
    return <SignInForm onSuccess={handleSignInSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Theme toggle - top right on landing page only */}
      {!showEditor && (
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      )}
      
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
