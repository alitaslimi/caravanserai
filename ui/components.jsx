// Button and Input adapted from the shadcn/ui New York registry (MIT).
import React from "react";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...values) => twMerge(clsx(values));

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground",
        ghost: "text-primary hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-8 px-3 py-1",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button type="button" data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function Input({ className, ...props }) {
  return <input data-slot="input" className={cn(
    "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
    className
  )} {...props} />;
}
