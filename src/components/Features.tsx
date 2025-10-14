import { Check } from "lucide-react";

export const Features = () => {
  const features = [
    "AI-powered automatic transcription",
    "Word-level caption customization",
    "30+ professional fonts available",
    "Sentence and line-level editing",
    "Precise positioning controls",
    "Real-time preview",
    "Multiple export formats",
    "Typography templates included"
  ];

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create professional captions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-lg border border-primary/20 bg-card hover:bg-card/80 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <p className="text-foreground font-medium">{feature}</p>
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
