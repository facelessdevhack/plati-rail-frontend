import React from 'react';

function SwitchIcon({ ...props }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
    >
      <path
        strokeLinecap="round"
        d="M10.667 2.624a6 6 0 11-5.333 0M8 1.333v5.334"
      />
    </svg>
  );
}

export default SwitchIcon;
