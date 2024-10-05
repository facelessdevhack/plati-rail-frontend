import React from 'react';

const LocationIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        strokeWidth="1.5"
        d="M8 8.953a2.08 2.08 0 100-4.16 2.08 2.08 0 000 4.16z"
      />
      <path
        strokeWidth="1.5"
        d="M2.414 5.66c1.313-5.773 9.866-5.767 11.173.007.767 3.386-1.34 6.253-3.187 8.026a3.462 3.462 0 01-4.806 0c-1.84-1.773-3.947-4.646-3.18-8.033z"
      />
    </svg>
  );
};

export default LocationIcon;
