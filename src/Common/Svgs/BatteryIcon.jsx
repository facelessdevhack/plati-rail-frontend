import React from 'react';

const BatteryIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M20.5 9.5C22 9.5 22 10 22 11v2c0 1 0 1.5-1.5 1.5M13 19H7c-4 0-5-1-5-5v-4c0-4 1-5 5-5h6c4 0 5 1 5 5v4c0 4-1 5-5 5zM6.38 10c.33 1.31.33 2.69 0 4M9.88 10c.33 1.31.33 2.69 0 4M13.38 10c.33 1.31.33 2.69 0 4"
      />
    </svg>
  );
};

export const ActiveBatteryIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M20.5 9.5C22 9.5 22 10 22 11v2c0 1 0 1.5-1.5 1.5"
      />
      <path
        fill="#4C9A58"
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M13 19H7c-4 0-5-1-5-5v-4c0-4 1-5 5-5h6c4 0 5 1 5 5v4c0 4-1 5-5 5z"
      />
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M6.38 10c.33 1.31.33 2.69 0 4"
      />
      <path fill="#4C9A58" d="M9.88 10c.33 1.31.33 2.69 0 4v-4z" />
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M9.88 10c.33 1.31.33 2.69 0 4"
      />
      <path fill="#4C9A58" d="M13.38 10c.33 1.31.33 2.69 0 4v-4z" />
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M13.38 10c.33 1.31.33 2.69 0 4"
      />
    </svg>
  );
};

export const BatteryEmptyIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      fill="none"
      viewBox="0 0 40 40"
    >
      <path
        stroke="#626263"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M21.667 31.667h-10c-6.666 0-8.333-1.667-8.333-8.334v-6.666c0-6.667 1.667-8.334 8.333-8.334h10c6.667 0 8.334 1.667 8.334 8.334v6.666c0 6.667-1.667 8.334-8.334 8.334zM34.166 15.833c2.5 0 2.5.834 2.5 2.5v3.334c0 1.666 0 2.5-2.5 2.5"
      />
    </svg>
  );
};

export default BatteryIcon;
