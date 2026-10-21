import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** Branta Tech buttons: pill shape, orange used only for the primary action. */
const buttonVariants = cva(
  "group inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        hero: "bg-primary text-primary-foreground shadow-glow-soft hover:bg-primary-hover hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-surface text-foreground hover:border-foreground",
        secondary: "border border-input bg-surface/60 text-foreground hover:bg-muted",
        glass: "border border-foreground/20 bg-background/40 text-foreground backdrop-blur-md hover:border-foreground/60 hover:bg-background/60",
        ghost: "text-foreground hover:bg-muted",
        link: "rounded-none text-foreground underline decoration-border decoration-1 underline-offset-[6px] hover:decoration-primary",
      },
      size: {
        default: "h-11 px-6 text-small",
        sm: "h-9 px-4 text-small",
        lg: "h-12 px-7 text-body",
        xl: "h-14 px-8 text-body",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
