import React from 'react';

const SwapStationIcon = ({ ...props }) => {
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
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M5 5.56h4.933c.594 0 1.067.48 1.067 1.067v1.18"
      />
      <path
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M6.127 4.44L5 5.56l1.127 1.127M11 10.44H6.067C5.473 10.44 5 9.96 5 9.373v-1.18"
      />
      <path
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M9.873 11.56L11 10.44 9.873 9.313"
      />
      <path
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M8 14.667A6.667 6.667 0 108 1.333a6.667 6.667 0 000 13.334z"
      />
    </svg>
  );
};

export default SwapStationIcon;
