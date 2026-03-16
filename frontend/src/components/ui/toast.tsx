import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 left-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:left-auto sm:top-0 sm:right-0 sm:flex-col md:max-w-[420px] gap-3",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between gap-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "border-border bg-card/95 text-foreground",
        destructive: "border-destructive/20 bg-destructive/95 text-destructive-foreground",
        success: "border-green-500/20 bg-green-500/95 text-white",
        warning: "border-yellow-500/20 bg-yellow-500/95 text-white",
        error: "border-red-500/20 bg-red-500/95 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// Définir les types avant de les utiliser
type ToastActionElement = React.ReactElement<typeof ToastAction>;

// Icônes par variante
const variantIcons = {
  default: Info,
  destructive: AlertTriangle,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>, VariantProps<typeof toastVariants> {
  isClosing?: boolean;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant, isClosing, children, ...props }, ref) => {
  const Icon = variant ? variantIcons[variant] : variantIcons.default;
  
  return (
    <ToastPrimitives.Root 
      ref={ref} 
      className={cn(
        toastVariants({ variant }), 
        isClosing && "opacity-50 scale-95 transition-all duration-300",
        className
      )} 
      {...props}
    >
      <div className="flex items-start gap-3 flex-1">
        {!isClosing && Icon && (
          <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        )}
        {isClosing && (
          <Loader2 className="h-5 w-5 shrink-0 mt-0.5 animate-spin" />
        )}
        <div className="flex-1 space-y-1">
          {children}
        </div>
      </div>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-medium text-white transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:pointer-events-none disabled:opacity-50 backdrop-blur-sm",
      "group-[.destructive]:border-destructive/30 group-[.destructive]:bg-destructive/20 group-[.destructive]:hover:bg-destructive/30",
      "group-[.success]:border-white/30 group-[.success]:bg-white/20 group-[.success]:hover:bg-white/30",
      "group-[.warning]:border-white/30 group-[.warning]:bg-white/20 group-[.warning]:hover:bg-white/30",
      "group-[.error]:border-white/30 group-[.error]:bg-white/20 group-[.error]:hover:bg-white/30",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-lg p-1.5 text-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:text-foreground hover:bg-black/5 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-foreground/25",
      "group-[.destructive]:text-red-200/70 group-[.destructive]:hover:text-red-100 group-[.destructive]:hover:bg-white/10 group-[.destructive]:focus:ring-white/25",
      "group-[.success]:text-white/70 group-[.success]:hover:text-white group-[.success]:hover:bg-white/10",
      "group-[.warning]:text-white/70 group-[.warning]:hover:text-white group-[.warning]:hover:bg-white/10",
      "group-[.error]:text-white/70 group-[.error]:hover:text-white group-[.error]:hover:bg-white/10",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title 
    ref={ref} 
    className={cn(
      "text-sm font-semibold leading-none tracking-tight",
      className
    )} 
    {...props} 
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description 
    ref={ref} 
    className={cn(
      "text-sm opacity-90 leading-relaxed",
      className
    )} 
    {...props} 
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// Types exportés
export type { ToastProps, ToastActionElement };

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};