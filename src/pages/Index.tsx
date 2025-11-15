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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // If user has active session, show editor directly
      if (session?.user) {
        setShowEditor(true);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowSignIn(false);
        setShowEditor(true);
      } else {
        setShowEditor(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showSignIn && !user) {
    return <SignInForm onSuccess={handleSignInSuccess} />;
  }

  // If user is logged in, show only the editor
  if (user && showEditor) {
    return (
      <div className="min-h-screen bg-background">
        <ProEditorWorkspace />
        <Footer />
      </div>
    );
  }

  // Show landing page for non-authenticated users
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
