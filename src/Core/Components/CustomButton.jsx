import React from "react";
import { cva } from "class-variance-authority";

const button = cva([
  "font-sans text-sm font-medium rounded-lg transition-all duration-200 ease-in-out",
  "focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  "inline-flex items-center justify-center whitespace-nowrap relative overflow-hidden"
], {
  variants: {
    variant: {
      primary: [
        "bg-primary text-primary-foreground shadow-sm",
        "hover:bg-primary/90 hover:shadow-md hover:scale-[1.02]",
        "focus:ring-primary/50",
        "active:scale-[0.98]"
      ],
      secondary: [
        "bg-secondary text-secondary-foreground shadow-sm border border-border",
        "hover:bg-secondary/80 hover:shadow-md hover:scale-[1.02]",
        "focus:ring-secondary/50",
        "active:scale-[0.98]"
      ],
      outline: [
        "border border-primary text-primary bg-transparent",
        "hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:scale-[1.02]",
        "focus:ring-primary/50",
        "active:scale-[0.98]"
      ],
      ghost: [
        "text-primary bg-transparent",
        "hover:bg-primary/10 hover:text-primary",
        "focus:ring-primary/50"
      ],
      destructive: [
        "bg-destructive text-destructive-foreground shadow-sm",
        "hover:bg-destructive/90 hover:shadow-md hover:scale-[1.02]",
        "focus:ring-destructive/50",
        "active:scale-[0.98]"
      ],
      success: [
        "bg-success text-white shadow-sm",
        "hover:bg-success/90 hover:shadow-md hover:scale-[1.02]",
        "focus:ring-success/50",
        "active:scale-[0.98]"
      ],
      warning: [
        "bg-warning text-white shadow-sm",
        "hover:bg-warning/90 hover:shadow-md hover:scale-[1.02]",
        "focus:ring-warning/50",
        "active:scale-[0.98]"
      ],
      info: [
        "bg-info text-white shadow-sm",
        "hover:bg-info/90 hover:shadow-md hover:scale-[1.02]",
        "focus:ring-info/50",
        "active:scale-[0.98]"
      ],
      gradient: [
        "gradient-primary text-white shadow-md",
        "hover:shadow-lg hover:scale-[1.02]",
        "focus:ring-primary/50",
        "active:scale-[0.98]"
      ],
      glass: [
        "glass text-foreground backdrop-blur-sm",
        "hover:bg-white/20 hover:shadow-lg hover:scale-[1.02]",
        "focus:ring-primary/50",
        "active:scale-[0.98]"
      ],
      // Legacy variants for backward compatibility
      mobilizePrimary: "bg-light-primary-green hover:bg-light-primary-green-hover text-primary-green",
      alert: "bg-alert-red hover:bg-alert-red-hover text-white",
      "light-alert": "bg-light-alert-red-hover hover:bg-light-alert-red text-alert-red",
      white: "bg-white hover:bg-background-grey text-dark-grey-text",
      grey: "bg-background-grey hover:bg-background-grey-hover text-black",
      checkIn: "bg-light-primary-green",
      checkOut: "bg-light-blue-10",
      kpis: "bg-white text-dark-grey-text",
      location: "bg-primary-blue text-white",
      viewDetails: "bg-light-primary-green",
    },
    size: {
      xs: "h-7 px-2 text-xs",
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-6 text-base",
      xl: "h-12 px-8 text-lg",
      icon: "h-10 w-10",
      // Legacy sizes
      primary: "h-10.5 px-4",
      filter: "h-10 px-3",
      arrows: "h-6 w-8 px-1",
      maps: "h-8.5 px-3",
      mobilize: "h-6.5 px-2",
      slim: "h-6.5 px-2",
      checkIn: "h-6 w-6 p-1",
      kpis: "h-12.5 p-3",
      location: "h-8 p-2",
      viewDetails: "h-6 px-2",
    },
    width: {
      auto: "w-auto",
      full: "w-full",
      fit: "w-fit",
      // Legacy widths
      login: "w-[312px]",
      dynamic: "max-w-max",
      mobilize: "w-27",
      save: "w-37.5",
      maximize: "w-8",
      newbattery: "w-[129px]",
      homeKpis: "w-[156px]",
      viewDetails: "w-6",
      moreColumns: "w-[142px]",
    },
    loading: {
      true: "cursor-wait",
      false: ""
    }
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    width: "auto",
    loading: false
  },
});

const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default function Button({
  children,
  variant,
  size,
  width,
  loading = false,
  disabled,
  icon,
  iconPosition = "left",
  testId,
  type = "button",
  className,
  // Legacy props for backward compatibility
  padding,
  colors,
  modifier,
  ...restProps
}) {
  // Handle legacy props mapping
  const mappedVariant = variant || colors || "primary";
  const mappedSize = size || padding || "md";
  const mappedWidth = width || "auto";
  
  const isDisabled = disabled || loading;

  return (
    <button
      {...restProps}
      className={button({ 
        variant: mappedVariant, 
        size: mappedSize, 
        width: mappedWidth, 
        loading,
        className: [className, modifier === "shadow" && "shadow-button"].filter(Boolean).join(" ")
      })}
      type={type}
      disabled={isDisabled}
      data-testid={testId}
    >
      {loading && <LoadingSpinner />}
      {icon && iconPosition === "left" && (
        <span className={children ? "mr-2" : ""}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className={children ? "ml-2" : ""}>{icon}</span>
      )}
    </button>
  );
}
