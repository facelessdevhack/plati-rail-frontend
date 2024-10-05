import React from 'react';

const AssemblyStationIcon = ({ ...props }) => {
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
        stroke="#1F1F1F"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M8 14.667A6.667 6.667 0 108 1.333a6.667 6.667 0 000 13.334z"
      />
      <path
        fill="#1F1F1F"
        d="M4.986 12a.51.51 0 01-.459-.256.55.55 0 01-.032-.544l2.998-7.157c.106-.25.28-.374.522-.374.256 0 .43.125.523.374l3.008 7.178c.078.2.064.38-.043.544-.1.157-.252.235-.458.235a.616.616 0 01-.31-.085.555.555 0 01-.202-.256l-2.646-6.57h.299l-2.688 6.57a.529.529 0 01-.224.256.542.542 0 01-.288.085zm.565-1.835l.427-.917h4.181l.427.917H5.551z"
      />
    </svg>
  );
};

export default AssemblyStationIcon;
