import React from 'react';

const SettingsIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M8 10a2 2 0 100-4 2 2 0 000 4z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M1.333 8.586V7.413A1.27 1.27 0 012.6 6.146c1.206 0 1.7-.853 1.093-1.9-.347-.6-.14-1.38.467-1.726l1.153-.66a1.113 1.113 0 011.52.4l.073.126c.6 1.047 1.587 1.047 2.194 0l.073-.126a1.113 1.113 0 011.52-.4l1.153.66c.607.346.814 1.126.467 1.726-.607 1.047-.113 1.9 1.093 1.9a1.27 1.27 0 011.267 1.267v1.173a1.27 1.27 0 01-1.267 1.267c-1.206 0-1.7.853-1.093 1.9.347.607.14 1.38-.467 1.727l-1.153.66a1.113 1.113 0 01-1.52-.4l-.073-.127c-.6-1.047-1.587-1.047-2.194 0l-.073.127a1.113 1.113 0 01-1.52.4l-1.153-.66a1.266 1.266 0 01-.467-1.727c.607-1.047.113-1.9-1.093-1.9a1.27 1.27 0 01-1.267-1.267z"
      />
    </svg>
  );
};

export default SettingsIcon;
