import React from 'react';

const BatteryLowIcon = ({ ...props }) => {
  return (
    <svg
      data-testid="BatteryLowIcon"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="17"
      fill="none"
      viewBox="0 0 16 17"
    >
      <path
        stroke="#C84630"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M8.667 13.167h-4c-2.666 0-3.333-.667-3.333-3.334V7.167c0-2.667.667-3.334 3.333-3.334h4c2.667 0 3.334.667 3.334 3.334v2.666c0 2.667-.667 3.334-3.334 3.334zM13.666 6.833c1 0 1 .334 1 1v1.334c0 .666 0 1-1 1"
      />
    </svg>
  );
};

export const BatteryNeutralIcon = ({ ...props }) => {
  return (
    <svg
      data-testid="BatteryNeutralIcon"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="17"
      fill="none"
      viewBox="0 0 16 17"
    >
      <path
        stroke="#F18725"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M8.667 13.167h-4c-2.666 0-3.333-.667-3.333-3.334V7.167c0-2.667.667-3.334 3.333-3.334h4c2.667 0 3.334.667 3.334 3.334v2.666c0 2.667-.667 3.334-3.334 3.334zM13.666 6.833c1 0 1 .334 1 1v1.334c0 .666 0 1-1 1M4.254 7.167a5.47 5.47 0 010 2.666"
      />
    </svg>
  );
};

export const BatteryHighIcon = ({ ...props }) => {
  return (
    <svg
      data-testid="BatteryHighIcon"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="17"
      fill="none"
      viewBox="0 0 16 17"
    >
      <path
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M13.666 6.833c1 0 1 .334 1 1v1.334c0 .666 0 1-1 1M8.667 13.167h-4c-2.666 0-3.333-.667-3.333-3.334V7.167c0-2.667.667-3.334 3.333-3.334h4c2.667 0 3.334.667 3.334 3.334v2.666c0 2.667-.667 3.334-3.334 3.334zM4.254 7.167a5.47 5.47 0 010 2.666M6.586 7.167a5.47 5.47 0 010 2.666M8.92 7.167a5.47 5.47 0 010 2.666"
      />
    </svg>
  );
};

export const BatteryNoStatusIcon = ({ ...props }) => {
  return (
    <svg
      data-testid="BatteryNoStatusIcon"
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        stroke="#DFDFDF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M8.667 12.667h-4c-2.666 0-3.333-.667-3.333-3.334V6.667c0-2.667.667-3.334 3.333-3.334h4c2.667 0 3.334.667 3.334 3.334v2.666c0 2.667-.667 3.334-3.334 3.334zM13.666 6.333c1 0 1 .334 1 1v1.334c0 .666 0 1-1 1"
      />
    </svg>
  );
};

export default BatteryLowIcon;
