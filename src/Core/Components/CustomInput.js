/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { cva } from "class-variance-authority";
import { Input } from "antd";
import { Controller } from "react-hook-form";
import AlertIcon from "../../Common/Svgs/AlertIcon";

const input = cva([
  "flex w-full rounded-md border bg-background text-sm transition-all duration-200",
  "file:border-0 file:bg-transparent file:text-sm file:font-medium",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50"
], {
  variants: {
    variant: {
      default: [
        "border-input hover:border-ring/50",
        "focus:border-ring focus:ring-ring/20"
      ],
      success: [
        "border-success hover:border-success/80",
        "focus:border-success focus:ring-success/20"
      ],
      warning: [
        "border-warning hover:border-warning/80",
        "focus:border-warning focus:ring-warning/20"
      ],
      destructive: [
        "border-destructive hover:border-destructive/80",
        "focus:border-destructive focus:ring-destructive/20"
      ],
      ghost: [
        "border-transparent bg-transparent",
        "focus:border-ring focus:bg-background"
      ],
      // Legacy variants for backward compatibility
      primary: "border-light-grey hover:border-ring/50 focus:border-ring",
      login: "bg-transparent text-black placeholder:text-black h-12 border-transparent",
      loginWhite: "bg-transparent text-white placeholder:text-white h-12 border-transparent focus:bg-transparent hover:bg-transparent",
      filter: "bg-background-grey hover:bg-background-grey border-transparent",
      dropdown: "bg-background-grey border-transparent",
      search: "bg-background-grey hover:bg-background-grey border-transparent",
      searchHome: "bg-background-grey hover:bg-background-grey border-transparent",
    },
    size: {
      sm: "h-8 px-2 text-xs",
      md: "h-10 px-3 text-sm",
      lg: "h-12 px-4 text-base",
    },
    width: {
      auto: "w-auto",
      full: "w-full",
      fit: "w-fit",
      // Legacy widths
      filter: "w-[312px]",
      dropdown: "w-[192px]",
      search: "w-[288px]",
    }
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    width: "full",
  },
});

const CustomInput = ({
  variant,
  size,
  width,
  className,
  // Legacy props
  intent,
  border,
  placeholderText,
  placeholder,
  ...props
}) => {
  // Map legacy props to new variants
  const mappedVariant = variant || intent || "default";
  const mappedSize = size || "md";
  const mappedWidth = width || "full";

  return (
    <Input
      {...props}
      className={input({ variant: mappedVariant, size: mappedSize, width: mappedWidth, className })}
      placeholder={placeholder}
    />
  );
};

export const CustomInputWithController = ({ 
  name, 
  placeholder, 
  control, 
  formState, 
  rules, 
  inputType, 
  variant,
  size,
  width,
  className,
  // Legacy props
  intent,
  ...InputProps 
}) => {
  const { errors } = formState;
  const hasError = errors[name];
  
  // Determine variant based on error state
  const inputVariant = hasError ? "destructive" : (variant || intent || "default");

  return (
    <div className="w-full space-y-2">
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <CustomInput
            {...field}
            {...InputProps}
            variant={inputVariant}
            size={size}
            width={width}
            className={className}
            placeholder={placeholder}
            suffix={hasError ? <AlertIcon /> : null}
            type={inputType}
          />
        )}
      />
      {hasError && (
        <p className="text-xs text-destructive font-medium animate-in">
          {hasError?.message}
        </p>
      )}
    </div>
  );
};

export default CustomInput;
