import React from 'react';

const TrikeIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      //   fill="none"
      viewBox="0 0 24 24"
    >
      <path
        // stroke="#1F1F1F"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M14 5v7c0 1.1-.9 2-2 2H1v-4"
      />
      <path
        // stroke="#1F1F1F"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M21 18l-1-6h-3m2 8H9c0-1.1-.9-2-2-2s-2 .9-2 2H1v-6h11c1.1 0 2-.9 2-2V5h-3 9"
      />
      <path
        // stroke="#1F1F1F"
        // fill={fillColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M7 22a2 2 0 100-4 2 2 0 000 4zM21 22a2 2 0 100-4 2 2 0 000 4z"
      />
    </svg>
  );
};

export const ActiveTrikeIcon = () => {
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
        d="M14 5v7c0 1.1-.9 2-2 2H1v-4"
      />
      <path
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M21 18l-1-6h-3m2 8H9c0-1.1-.9-2-2-2s-2 .9-2 2H1v-6h11c1.1 0 2-.9 2-2V5h-3 9"
      />
      <path
        fill="#4C9A58"
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M7 22a2 2 0 100-4 2 2 0 000 4zM21 22a2 2 0 100-4 2 2 0 000 4z"
      />
    </svg>
  );
};

export default TrikeIcon;
