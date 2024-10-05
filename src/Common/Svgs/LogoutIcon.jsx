import React from 'react';

const LogoutIcon = ({ ...props }) => {
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
        stroke="#626263"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M5.933 5.04c.207-2.4 1.44-3.38 4.14-3.38h.087c2.98 0 4.173 1.193 4.173 4.173v4.347c0 2.98-1.193 4.173-4.173 4.173h-.087c-2.68 0-3.913-.966-4.133-3.326M10 8H2.414M3.9 5.767L1.667 8 3.9 10.233"
      />
    </svg>
  );
};

export default LogoutIcon;
