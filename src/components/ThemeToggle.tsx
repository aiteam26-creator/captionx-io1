import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ThemeToggle({ variant = "ghost", size = "sm", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={cn("inline-flex items-center gap-1 p-1 rounded-lg bg-muted/50", className)}>
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size={size}
        onClick={() => setTheme("light")}
        className={cn(
          "gap-2 transition-all duration-200",
          theme === "light" && "shadow-sm"
        )}
        title="Light Mode"
      >
        <Sun className="h-4 w-4" />
        <span className="text-xs hidden sm:inline">Light</span>
      </Button>

      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size={size}
        onClick={() => setTheme("dark")}
        className={cn(
          "gap-2 transition-all duration-200",
          theme === "dark" && "shadow-sm"
        )}
        title="Dark Mode"
      >
        <Moon className="h-4 w-4" />
        <span className="text-xs hidden sm:inline">Dark</span>
      </Button>
    </div>
  )
}