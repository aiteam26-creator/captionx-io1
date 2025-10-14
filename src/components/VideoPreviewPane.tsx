interface VideoPreviewPaneProps {
  selectedWord: string | null;
  fontSize: number;
  fontFamily: string;
  color: string;
  position: { x: number; y: number };
  onWordSelect: (word: string) => void;
}

const sampleWords = [
  { text: "Create", time: "0:01" },
  { text: "stunning", time: "0:02" },
  { text: "captions", time: "0:03" },
  { text: "with", time: "0:04" },
  { text: "AI", time: "0:05" },
];

export const VideoPreviewPane = ({
  selectedWord,
  fontSize,
  fontFamily,
  color,
  position,
  onWordSelect,
}: VideoPreviewPaneProps) => {
  return (
    <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
      {/* Video Preview Area */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
        
        {/* Caption Display */}
        <div 
          className="absolute z-10 transition-all duration-300"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            className="cursor-pointer hover:scale-105 transition-transform"
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              color,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              fontWeight: 600,
            }}
          >
            {selectedWord || "Click a word below"}
          </span>
        </div>
        
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
          00:05 / 00:30
        </div>
      </div>
      
      {/* Word Timeline */}
      <div className="p-6 bg-gradient-to-b from-card to-secondary/20">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Editable Words</h3>
        <div className="flex flex-wrap gap-2">
          {sampleWords.map((word, idx) => (
            <button
              key={idx}
              onClick={() => onWordSelect(word.text)}
              className={`
                px-4 py-2 rounded-xl border-2 transition-all hover:scale-105
                ${selectedWord === word.text 
                  ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                  : 'border-border bg-background hover:border-primary/50'
                }
              `}
            >
              <span className="font-medium">{word.text}</span>
              <span className="text-xs ml-2 opacity-60">{word.time}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
