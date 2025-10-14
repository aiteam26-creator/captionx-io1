import { Check } from "lucide-react";
import { useState } from "react";

interface Template {
  name: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  preview: string;
}

const templates: Template[] = [
  {
    name: "Bold Impact",
    fontFamily: "Bebas Neue",
    fontSize: 48,
    color: "#ffffff",
    preview: "BOLD"
  },
  {
    name: "Elegant Serif",
    fontFamily: "Playfair Display",
    fontSize: 36,
    color: "#f5e6d3",
    preview: "Elegant"
  },
  {
    name: "Modern Sans",
    fontFamily: "Montserrat",
    fontSize: 32,
    color: "#e0e0e0",
    preview: "Modern"
  },
  {
    name: "Classic Times",
    fontFamily: "Merriweather",
    fontSize: 34,
    color: "#ffd700",
    preview: "Classic"
  },
  {
    name: "Trendy Pop",
    fontFamily: "Poppins",
    fontSize: 38,
    color: "#ff6b9d",
    preview: "Trendy"
  },
];

interface TypographyTemplatesProps {
  onTemplateSelect: (template: Template) => void;
}

export const TypographyTemplates = ({ onTemplateSelect }: TypographyTemplatesProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (template: Template) => {
    setSelected(template.name);
    onTemplateSelect(template);
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg p-6">
      <h3 className="font-semibold text-lg mb-4">Typography Templates</h3>
      <div className="grid grid-cols-2 gap-3">
        {templates.map((template) => (
          <button
            key={template.name}
            onClick={() => handleSelect(template)}
            className={`
              relative p-4 rounded-xl border-2 transition-all hover:scale-105
              ${selected === template.name 
                ? 'border-primary bg-primary/5 shadow-md' 
                : 'border-border bg-background hover:border-primary/30'
              }
            `}
          >
            {selected === template.name && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                <Check className="w-3 h-3" />
              </div>
            )}
            <div
              className="text-center mb-2 h-12 flex items-center justify-center"
              style={{
                fontFamily: template.fontFamily,
                fontSize: "20px",
                color: template.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {template.preview}
            </div>
            <p className="text-xs font-medium text-muted-foreground">{template.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
