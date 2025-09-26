import React from 'react'
import { Table, message } from 'antd'

const CustomTable = ({
  title,
  data,
  totalCount,
  columns,
  position = 'topRight',
  titleOnTop = true,
  currentPage,
  handlePageChange,
  currentPageSize,
  onRowClick,
  editFunction,
  isAdmin,
  showSort = false,
  ...otherProps
}) => {
  // Error handling wrapper for the row click
  const handleRowClick = record => {
    if (onRowClick) {
      onRowClick(record) // Call the onRowClick function passed as a prop
    }
  }

  // Add sorting logic to each column dynamically
  const sortableColumns = columns.map(column => ({
    ...column,
    sorter: column.sorter || undefined, // Use column-defined sorter if available
    sortDirections: column.sortDirections || ['ascend', 'descend'] // Default sort directions
  }))

  return (
    <div className='relative'>
      <div
        className={`${
          titleOnTop ? 'absolute' : ''
        } px-1 py-5 text-xl font-semibold font-poppins`}
      >
        {title}
      </div>
      <Table
        rowKey='id'
        columns={sortableColumns}
        dataSource={data}
        {...otherProps}
        onRow={record => ({
          onContextMenu: e => {
            // if (isAdmin) {
            e.preventDefault()
            console.log(record, 'EVENT')
            message.info('Right-click on a row')
            if (editFunction) {
              editFunction(record)
            }
            // }
          },
          onClick: () => handleRowClick(record) // Use error-handling wrapper
        })}
        showSorterTooltip={showSort}
        pagination={{
          total: totalCount,
          defaultCurrent: currentPage,
          defaultPageSize: 10,
          onChange: (page, pageSize) => handlePageChange(page, pageSize),
          pageSize: currentPageSize,
          position: [position]
        }}
      />
    </div>
  )
}

export default CustomTable
