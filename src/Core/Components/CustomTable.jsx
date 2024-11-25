import React from 'react'
import { Table, message } from 'antd'

const CustomTable = ({
  title,
  data,
  totalCount,
  columns,
  position = 'topRight',
  titleOnTop = true,
  expandedData,
  currentPage,
  handlePageChange,
  currentPageSize,
  expanded = true,
  expandable = true,
  onRowClick,
  editFunction,
  isAdmin
}) => {
  // Error handling wrapper for the row click
  const handleRowClick = record => {
    if (onRowClick) {
      onRowClick(record) // Call the onRowClick function passed as a prop
    }
  }

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
        expandable={
          expandable
            ? {
                expandedRowRender: record => (
                  <Table dataSource={record.variants} columns={expandedData} />
                ),
                rowExpandable: record => record.name !== 'Not Expandable'
              }
            : false
        }
        expanded={expanded}
        columns={columns}
        dataSource={data}
        onRow={record => ({
          onContextMenu: e => {
            if (isAdmin) {
              e.preventDefault()
              console.log(record, 'EVENT')
              message.info('Right-click on a row')
              if (editFunction) {
                editFunction(record)
              }
            }
          },
          onClick: () => handleRowClick(record) // Use error-handling wrapper
        })}
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
