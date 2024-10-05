import React from "react";
import { cva } from "class-variance-authority";

const button = cva(["font-poppins text-xs font-medium capitalize rounded-md"], {
  variants: {
    padding: {
      primary: "px-4 py-3",
      filter: "py-2.75 px-3",
      arrows: "py-1 px-2",
      mobilize: "py-1 px-2",
      checkIn: "p-1",
      kpis: "p-3",
      mapMarkers: "px-3 py-2",
      location: "p-2",
      geofence: "py-1.75 px-2",
    },
    size: {
      primary: ["h-10.5"],
      filter: ["h-10"],
      arrows: ["h-6 w-8"],
      maps: ["h-8.5"],
      mobilize: ["h-6.5"],
      slim: ["h-6.5"],
      checkIn: ["h-6 w-6"],
      kpis: ["h-12.5"],
      location: ["h-8"],
      viewDetails: ["h-6"],
    },
    width: {
      login: "w-[312px]",
      full: "w-full",
      dynamic: "max-w-max",
      mobilize: "w-27",
      save: "w-37.5",
      maximize: "w-8",
      newbattery: "w-[129px]",
      homeKpis: "w-[156px]",
      viewDetails: "w-6",
      moreColumns: "w-[142px]",
    },
    colors: {
      primary: "bg-primary-green hover:bg-primary-green-hover text-white",
      mobilizePrimary:
        "bg-light-primary-green hover:bg-light-primary-green-hover text-primary-green",
      alert: "bg-alert-red hover:bg-alert-red-hover text-white",
      "light-alert":
        "bg-light-alert-red-hover hover:bg-light-alert-red text-alert-red",
      white: "bg-white hover:bg-background-grey text-dark-grey-text",
      grey: "bg-background-grey hover:bg-background-grey-hover text-black",
      checkIn: "bg-light-primary-green",
      checkOut: "bg-light-blue-10",
      kpis: "bg-white text-dark-grey-text",
      location: "bg-primary-blue text-white",
      viewDetails: "bg-light-primary-green",
    },
    modifier: {
      shadow: "shadow-button",
      disabled: "cursor-not-allowed red-cursor opacity-50",
      truncate: "truncate",
      blur: "opacity-50",
      disabledAndShadow: "shadow-button cursor-not-allowed red-cursor",
    },
  },
  defaultVariants: {
    padding: "primary",
    size: "primary",
    colors: "primary",
  },
});

export default function Button({
  children,
  padding,
  colors,
  size,
  width,
  testId,
  modifier,
  type = "button",
  ...restProps
}) {
  return (
    <button
      {...restProps}
      className={button({ modifier, padding, size, width, colors })}
      // eslint-disable-next-line react/button-has-type
      type={type}
      data-testid={testId}
    >
      {children}
    </button>
  );
}
