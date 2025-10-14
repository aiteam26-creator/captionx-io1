import { useState } from "react";
import { VideoPreviewPane } from "./VideoPreviewPane";
import { CaptionControls } from "./CaptionControls";
import { TypographyTemplates } from "./TypographyTemplates";

export const EditorWorkspace = () => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState({ x: 50, y: 80 });

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">AI-Powered Caption Editor</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Preview - Left */}
          <div className="lg:col-span-2">
            <VideoPreviewPane 
              selectedWord={selectedWord}
              fontSize={fontSize}
              fontFamily={fontFamily}
              color={color}
              position={position}
              onWordSelect={setSelectedWord}
            />
          </div>
          
          {/* Controls - Right */}
          <div className="space-y-6">
            <CaptionControls
              fontSize={fontSize}
              fontFamily={fontFamily}
              color={color}
              position={position}
              onFontSizeChange={setFontSize}
              onFontFamilyChange={setFontFamily}
              onColorChange={setColor}
              onPositionChange={setPosition}
            />
            
            <TypographyTemplates onTemplateSelect={(template) => {
              setFontFamily(template.fontFamily);
              setFontSize(template.fontSize);
              setColor(template.color);
            }} />
          </div>
        </div>
      </div>
    </section>
  );
};
