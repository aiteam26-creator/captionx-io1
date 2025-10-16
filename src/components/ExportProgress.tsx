import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ExportProgressProps {
  open: boolean;
  progress: number;
  status: string;
}

export const ExportProgress = ({ open, progress, status }: ExportProgressProps) => {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Exporting Video
          </DialogTitle>
          <DialogDescription>{status}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
