import React from "react";

// Manual variant classes (no CVA, no TS)
const cardVariants = {
  default: "rounded-2xl border bg-card text-card-foreground shadow-card hover:shadow-card-hover transition-all duration-300",
  elevated: "rounded-2xl border bg-card text-card-foreground shadow-medium hover:shadow-large hover:-translate-y-1 transition-all duration-300",
  interactive: "rounded-2xl border bg-card text-card-foreground shadow-card hover:shadow-card-hover hover:border-primary/20 cursor-pointer transition-all duration-300",
  ghost: "rounded-2xl border-transparent bg-card text-card-foreground shadow-none hover:bg-muted/50 transition-all duration-300"
};

// Utility: Merge classes safely
function mergeClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Card = React.forwardRef(function Card({ className = "", variant = "default", ...props }, ref) {
  return (
    <div
      ref={ref}
      className={mergeClasses(cardVariants[variant] || cardVariants.default, className)}
      {...props}
    />
  );
});

export const CardHeader = React.forwardRef(function CardHeader({ className = "", ...props }, ref) {
  return (
    <div
      ref={ref}
      className={mergeClasses("flex flex-col space-y-2 p-6", className)}
      {...props}
    />
  );
});

export const CardTitle = React.forwardRef(function CardTitle({ className = "", ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={mergeClasses("text-xl font-bold leading-tight tracking-tight", className)}
      {...props}
    />
  );
});

export const CardDescription = React.forwardRef(function CardDescription({ className = "", ...props }, ref) {
  return (
    <p
      ref={ref}
      className={mergeClasses("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  );
});

export const CardContent = React.forwardRef(function CardContent({ className = "", ...props }, ref) {
  return (
    <div ref={ref} className={mergeClasses("p-6 pt-0", className)} {...props} />
  );
});

export const CardFooter = React.forwardRef(function CardFooter({ className = "", ...props }, ref) {
  return (
    <div ref={ref} className={mergeClasses("flex items-center p-6 pt-0", className)} {...props} />
  );
});
