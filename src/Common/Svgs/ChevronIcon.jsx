import React from 'react';

const ChevronIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M4.455 9.96l3.26-3.26a.993.993 0 000-1.4l-3.26-3.26"
      />
    </svg>
  );
};

export default ChevronIcon;
