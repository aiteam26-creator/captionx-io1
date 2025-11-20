import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { analytics } from "@/utils/analytics";

interface SignInFormProps {
  onSuccess: () => void;
}

export const SignInForm = ({ onSuccess }: SignInFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Required fields",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && !name.trim()) {
      toast({
        title: "Required fields",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up with magic link
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            data: {
              name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a magic link to complete sign up.",
          });
          onSuccess();
        }
      } else {
        // Sign in with magic link
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a magic link to sign in.",
          });
          onSuccess();
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
      <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {isSignUp ? "Sign up to start creating" : "Sign in to continue creating"}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="mt-1"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending magic link..." : (isSignUp ? "Sign Up" : "Sign In")}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
