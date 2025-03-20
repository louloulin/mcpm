import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CalloutProps {
  children: ReactNode;
  className?: string;
}

export function Callout({ children, className }: CalloutProps) {
  return (
    <div className={cn("bg-muted p-4 rounded-md border", className)}>
      {children}
    </div>
  );
} 