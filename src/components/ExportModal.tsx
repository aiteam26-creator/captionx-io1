import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Download, Sparkles, Check, FileVideo, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => Promise<void>;
  captionCount: number;
}

export type ExportFormat = "video-burned" | "srt" | "ass";

export const ExportModal = ({ open, onClose, onExport, captionCount }: ExportModalProps) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("video-burned");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  const exportOptions = [
    {
      id: "video-burned" as ExportFormat,
      label: "Burned-in Captions",
      description: "Captions permanently embedded in video",
      icon: FileVideo,
      recommended: true,
    },
    {
      id: "srt" as ExportFormat,
      label: "SRT Subtitles",
      description: "Standard subtitle file format",
      icon: FileText,
      recommended: false,
    },
    {
      id: "ass" as ExportFormat,
      label: "Styled ASS",
      description: "Advanced subtitle with styling",
      icon: FileText,
      recommended: false,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    try {
      await onExport(selectedFormat);
      setExportProgress(100);
      setExportComplete(true);
      
      // Show success state for 2 seconds before closing
      setTimeout(() => {
        clearInterval(progressInterval);
        setIsExporting(false);
        setExportProgress(0);
        setExportComplete(false);
        onClose();
      }, 2000);
    } catch (error) {
      clearInterval(progressInterval);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Export Your Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Caption Count Badge */}
          <div className="bg-accent/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground text-lg">{captionCount}</span> captions ready to export
            </p>
          </div>

          {/* Export Format Options */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Export Format
            </Label>
            <div className="space-y-2">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedFormat === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFormat(option.id)}
                    disabled={isExporting}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-left transition-all group",
                      "hover:border-primary/50 hover:bg-accent/30",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background",
                      isExporting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30 group-hover:border-primary/50"
                        )}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("font-semibold text-sm", isSelected && "text-primary")}>
                            {option.label}
                          </span>
                          {option.recommended && (
                            <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-3 animate-slide-up">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {exportComplete ? "Export complete!" : "Exporting..."}
                </span>
                <span className="font-mono font-semibold">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "w-full h-12 text-base font-semibold relative overflow-hidden group",
              exportComplete && "bg-green-600 hover:bg-green-600"
            )}
          >
            {exportComplete ? (
              <>
                <Check className="w-5 h-5 mr-2 animate-bounce-in" />
                <span className="animate-bounce-in">Downloaded!</span>
                {/* Confetti effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-white/80 rounded-full animate-ping"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.3}s`,
                        animationDuration: `${0.6 + Math.random() * 0.4}s`,
                      }}
                    />
                  ))}
                </div>
              </>
            ) : isExporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2 transition-transform group-hover:translate-y-0.5" />
                <span>Download {exportOptions.find(o => o.id === selectedFormat)?.label}</span>
              </>
            )}
          </Button>

          {/* Info Note */}
          {!isExporting && (
            <p className="text-xs text-center text-muted-foreground px-4 animate-slide-up">
              Your video will download automatically when ready
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
