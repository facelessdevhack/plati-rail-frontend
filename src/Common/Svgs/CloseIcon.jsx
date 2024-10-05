import React from 'react';

const CloseIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M4 20L20 4M20 20L4 4"
      />
    </svg>
  );
};

export default CloseIcon;
