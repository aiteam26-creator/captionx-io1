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
      // If user has active session, show editor directly
      if (session?.user) {
        setShowEditor(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowSignIn(false);
        setShowEditor(true);
        setTimeout(() => {
          document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      {/* Brand name and theme toggle - only on landing page */}
      {!showEditor && (
        <>
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
        </>
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
