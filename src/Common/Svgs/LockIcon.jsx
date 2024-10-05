import React from 'react';

const LockRedIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 14 14"
    >
      <path
        stroke="#C84630"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M3.5 5.833V4.667c0-1.931.583-3.5 3.5-3.5s3.5 1.569 3.5 3.5v1.166"
      />
      <path
        fill="#C84630"
        stroke="#C84630"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M9.916 12.833H4.083c-2.333 0-2.917-.583-2.917-2.916V8.75c0-2.333.584-2.917 2.917-2.917h5.833c2.334 0 2.917.584 2.917 2.917v1.167c0 2.333-.583 2.916-2.917 2.916z"
      />
    </svg>
  );
};

export const LockGreenIcon = ({ ...props }) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 14 14"
    >
      <path
        fill="#4C9A58"
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.917 12.833H4.083c-2.333 0-2.916-.583-2.916-2.916V8.75c0-2.333.583-2.917 2.916-2.917h5.834c2.333 0 2.916.584 2.916 2.917v1.167c0 2.333-.583 2.916-2.916 2.916z"
      />
      <path
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 5.833V4.667c0-1.931.583-3.5 3.5-3.5 1.986 0 2.97.667 3.332 1.75"
      />
      <path
        fill="#4C9A58"
        stroke="#4C9A58"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 10.792a1.458 1.458 0 100-2.917 1.458 1.458 0 000 2.917z"
      />
    </svg>
  );
};

export default LockRedIcon;
