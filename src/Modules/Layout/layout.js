import React from 'react'

const Layout = ({ children }) => {
  return (
    <div className='grid w-full h-screen grid-rows-12 '>
      <div className=''>{children}</div>
    </div>
  )
}

export default Layout
