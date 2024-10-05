import React from 'react';

const AlertIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
    >
      <g clipPath="url(#clip0_514_42891)">
        <path
          stroke="#C84630"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.333"
          d="M8 5.333V8m0 2.667h.007M14.667 8A6.667 6.667 0 111.333 8a6.667 6.667 0 0113.334 0z"
        />
      </g>
      <defs>
        <clipPath id="clip0_514_42891">
          <path fill="#fff" d="M0 0H16V16H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const AlertTriangleIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        // stroke="#C84630"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M8 14.274H3.96c-2.313 0-3.28-1.654-2.16-3.674l2.08-3.746 1.96-3.52c1.187-2.14 3.134-2.14 4.32 0l1.96 3.526 2.08 3.747c1.12 2.02.147 3.673-2.16 3.673H8v-.006zM8 6v3.333"
      />
      <path
        // stroke="#C84630"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M7.996 11.333h.006"
      />
    </svg>
  );
};

export default AlertIcon;
