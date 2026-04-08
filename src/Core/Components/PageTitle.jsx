import React from 'react'

const PageTitle = ({ children }) => {
  return (
    <h1 style={{
      fontFamily: "'Staff Wide Test', serif",
      fontSize: 42,
      fontWeight: 400,
      color: '#1a1a1a',
      margin: '0 0 24px',
      fontStyle: 'normal',
      lineHeight: '30px',
    }}>
      {children}
    </h1>
  )
}

export default PageTitle
