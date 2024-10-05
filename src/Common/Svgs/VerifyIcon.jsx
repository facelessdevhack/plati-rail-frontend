import React from 'react';

const VerifyIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      fill="none"
      viewBox="0 0 17 16"
    >
      <path
        fill="#313C6F"
        stroke="#313C6F"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M7.738 1.633c.46-.393 1.214-.393 1.68 0l1.054.907c.2.173.573.313.84.313h1.133c.707 0 1.287.58 1.287 1.287v1.133c0 .26.14.64.313.84l.906 1.054c.394.46.394 1.213 0 1.68L14.045 9.9c-.174.2-.313.573-.313.84v1.133c0 .707-.58 1.287-1.287 1.287h-1.133c-.26 0-.64.14-.84.313l-1.054.907c-.46.393-1.213.393-1.68 0l-1.053-.907a1.478 1.478 0 00-.84-.313H4.692c-.707 0-1.287-.58-1.287-1.287v-1.14c0-.26-.14-.633-.307-.833l-.9-1.06c-.386-.46-.386-1.207 0-1.667l.9-1.06c.167-.2.307-.573.307-.833V4.133c0-.706.58-1.286 1.287-1.286h1.153c.26 0 .64-.14.84-.314l1.053-.9z"
      />
      <path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M6.158 8l1.607 1.613 3.22-3.226"
      />
    </svg>
  );
};

export default VerifyIcon;
