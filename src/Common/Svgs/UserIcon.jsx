import React from 'react';

const UserIcon = ({ ...props }) => {
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
        d="M12.16 10.87c-.1-.01-.22-.01-.33 0a4.42 4.42 0 01-4.27-4.43C7.56 3.99 9.54 2 12 2a4.435 4.435 0 01.16 8.87zM7.16 14.56c-2.42 1.62-2.42 4.26 0 5.87 2.75 1.84 7.26 1.84 10.01 0 2.42-1.62 2.42-4.26 0-5.87-2.74-1.83-7.25-1.83-10.01 0z"
      />
    </svg>
  );
};

export const ActiveUserIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4C9A58"
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M12.16 10.87c-.1-.01-.22-.01-.33 0a4.42 4.42 0 01-4.27-4.43C7.56 3.99 9.54 2 12 2a4.435 4.435 0 01.16 8.87zM7.16 14.56c-2.42 1.62-2.42 4.26 0 5.87 2.75 1.84 7.26 1.84 10.01 0 2.42-1.62 2.42-4.26 0-5.87-2.74-1.83-7.25-1.83-10.01 0z"
      />
    </svg>
  );
};

export default UserIcon;
