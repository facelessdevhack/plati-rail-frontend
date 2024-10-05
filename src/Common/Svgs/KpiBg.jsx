import React from 'react';

function KpiBg({ bg = '#313C6F', ...props }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="38"
      height="38"
      viewBox="0 0 38 38"
    >
      <circle cx="19" cy="19" r="19" fill={bg} />
    </svg>
  );
}

export default KpiBg;
