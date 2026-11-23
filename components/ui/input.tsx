import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex min-h-11 w-full rounded-xl border border-blush-200 bg-white px-3.5 text-sm text-charcoal shadow-xs transition-colors outline-none placeholder:text-charcoal-soft/50 focus:border-blush-400 focus:ring-2 focus:ring-blush-100 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-24 w-full rounded-xl border border-blush-200 bg-white px-3.5 py-2.5 text-sm text-charcoal shadow-xs transition-colors outline-none placeholder:text-charcoal-soft/50 focus:border-blush-400 focus:ring-2 focus:ring-blush-100 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
