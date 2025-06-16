import React from "react";
import { cva } from "class-variance-authority";

const card = cva([
  "rounded-lg border bg-card text-card-foreground shadow-card transition-all duration-200 ease-in-out",
  "relative overflow-hidden"
], {
  variants: {
    variant: {
      default: "border-border",
      elevated: "shadow-card-hover border-border/50",
      outlined: "border-2 border-border shadow-none",
      ghost: "border-transparent shadow-none bg-transparent",
      gradient: "border-transparent gradient-primary text-white shadow-lg",
      glass: "glass border-white/20",
      success: "border-success/20 bg-success/5",
      warning: "border-warning/20 bg-warning/5",
      destructive: "border-destructive/20 bg-destructive/5",
      info: "border-info/20 bg-info/5",
    },
    size: {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      xl: "p-10",
    },
    hover: {
      none: "",
      lift: "hover:shadow-card-hover hover:scale-[1.02] hover:-translate-y-1",
      glow: "hover:shadow-glow",
      subtle: "hover:shadow-lg",
    },
    interactive: {
      true: "cursor-pointer transition-transform",
      false: "",
    },
    loading: {
      true: "animate-pulse pointer-events-none",
      false: "",
    }
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    hover: "none",
    interactive: false,
    loading: false,
  },
});

const cardHeader = cva([
  "flex flex-col space-y-1.5"
], {
  variants: {
    size: {
      sm: "pb-3",
      md: "pb-4",
      lg: "pb-6",
      xl: "pb-8",
    }
  },
  defaultVariants: {
    size: "md"
  }
});

const cardTitle = cva([
  "font-semibold leading-none tracking-tight"
], {
  variants: {
    size: {
      sm: "text-lg",
      md: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
    }
  },
  defaultVariants: {
    size: "md"
  }
});

const cardDescription = cva([
  "text-muted-foreground"
], {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
      xl: "text-lg",
    }
  },
  defaultVariants: {
    size: "md"
  }
});

const cardContent = cva([
  "pt-0"
], {
  variants: {
    size: {
      sm: "",
      md: "",
      lg: "",
      xl: "",
    }
  },
  defaultVariants: {
    size: "md"
  }
});

const cardFooter = cva([
  "flex items-center pt-0"
], {
  variants: {
    size: {
      sm: "pt-3",
      md: "pt-4",
      lg: "pt-6",
      xl: "pt-8",
    }
  },
  defaultVariants: {
    size: "md"
  }
});

export function Card({ 
  children, 
  className, 
  variant, 
  size, 
  hover, 
  interactive, 
  loading,
  onClick,
  ...props 
}) {
  return (
    <div
      className={card({ variant, size, hover, interactive, loading, className })}
      onClick={interactive ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, size, ...props }) {
  return (
    <div className={cardHeader({ size, className })} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, size, ...props }) {
  return (
    <h3 className={cardTitle({ size, className })} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, size, ...props }) {
  return (
    <p className={cardDescription({ size, className })} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, size, ...props }) {
  return (
    <div className={cardContent({ size, className })} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, size, ...props }) {
  return (
    <div className={cardFooter({ size, className })} {...props}>
      {children}
    </div>
  );
}

// Enhanced KPI Card Component
export function KPICard({
  title,
  value,
  growth,
  icon,
  trend = "up",
  suffix = "",
  prefix = "",
  loading = false,
  variant = "default",
  className,
  ...props
}) {
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const growthDisplay = growth !== undefined ? `${growth > 0 ? "+" : ""}${growth}%` : null;

  return (
    <Card 
      variant={variant} 
      hover="lift" 
      loading={loading}
      className={`${className} animate-in`}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle size="sm" className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && (
            <div className="h-4 w-4 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <CardTitle size="lg" className="text-2xl font-bold">
            {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
          </CardTitle>
          {growthDisplay && (
            <p className={`text-xs ${trendColor} flex items-center`}>
              {trend === "up" && "↗"}
              {trend === "down" && "↘"}
              {trend === "flat" && "→"}
              <span className="ml-1">{growthDisplay} from last period</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Stat Card Component
export function StatCard({
  title,
  value,
  description,
  icon,
  variant = "default",
  className,
  ...props
}) {
  return (
    <Card 
      variant={variant}
      hover="subtle"
      className={`${className} animate-in`}
      {...props}
    >
      <CardContent className="flex flex-row items-center justify-between space-y-0 p-6">
        <div className="space-y-1">
          <CardDescription className="text-sm font-medium">
            {title}
          </CardDescription>
          <CardTitle className="text-2xl font-bold">
            {typeof value === "number" ? value.toLocaleString() : value}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs">
              {description}
            </CardDescription>
          )}
        </div>
        {icon && (
          <div className="h-8 w-8 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Card;