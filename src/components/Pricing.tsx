import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingProps {
  onGetStarted: () => void;
}

export const Pricing = ({ onGetStarted }: PricingProps) => {
  return (
    <section id="pricing" className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One subscription. All features. No hidden costs.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="relative p-8 rounded-2xl border-2 border-primary bg-card shadow-xl shadow-primary/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              Best Value
            </div>
            
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-foreground mb-2">
                $12<span className="text-2xl text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground">
                Almost half the cost of premium auto-captioning services
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Unlimited video uploads",
                "AI transcription included",
                "All typography templates",
                "Priority support",
                "Export in multiple formats",
                "No watermarks"
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={onGetStarted}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg rounded-xl"
            >
              Get Started Now →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
