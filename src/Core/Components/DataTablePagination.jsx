import React from 'react'
import { Dropdown } from 'antd'
import { DownOutlined } from '@ant-design/icons'

/**
 * DataTablePagination — custom pagination matching Figma design
 *
 * @param {number} currentPage
 * @param {number} totalItems
 * @param {number} pageSize
 * @param {function} onPageChange - (page) => void
 * @param {function} onPageSizeChange - (size) => void
 * @param {Array} pageSizeOptions - default [10, 20, 50, 100]
 */
const DataTablePagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const totalPages = Math.ceil(totalItems / pageSize)
  if (totalItems === 0) return null

  return (
    <>
      <div className="plati-pagination">
        <span className="plati-pagination-info">
          Showing {Math.min(currentPage * pageSize, totalItems)} of {totalItems} Results
        </span>
        <div className="plati-pagination-nav">
          <button
            className="plati-pagination-btn"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            &lsaquo; Previous
          </button>
          <div className="plati-pagination-pages">
            {(() => {
              const pages = []
              const maxVisible = 5
              let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
              let end = Math.min(totalPages, start + maxVisible - 1)
              if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)

              if (start > 1) {
                pages.push(1)
                if (start > 2) pages.push('...')
              }
              for (let i = start; i <= end; i++) pages.push(i)
              if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...')
                pages.push(totalPages)
              }

              return pages.map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="plati-pagination-ellipsis">…</span>
                ) : (
                  <button
                    key={page}
                    className={`plati-pagination-page ${currentPage === page ? 'active' : ''}`}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </button>
                )
              )
            })()}
          </div>
          <button
            className="plati-pagination-btn"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next &rsaquo;
          </button>
        </div>
        <Dropdown
          menu={{
            items: pageSizeOptions.map(size => ({
              key: size,
              label: `${size} per page`,
              onClick: () => onPageSizeChange(size),
            })),
          }}
          trigger={['click']}
        >
          <button className="plati-pagination-perpage">
            {pageSize} per page <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
          </button>
        </Dropdown>
      </div>
      <style>{`
        .plati-pagination {
          padding: 8px 32px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
        }

        .plati-pagination-info {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #1a1a1a;
          white-space: nowrap;
          line-height: 20px;
          padding-right: 16px;
        }

        .plati-pagination-nav {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .plati-pagination-btn {
          background: none;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #1a1a1a;
          cursor: pointer;
          padding: 8px;
          border-radius: 123px;
          line-height: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        .plati-pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .plati-pagination-btn:hover:not(:disabled) { background: #f3f3f5; }

        .plati-pagination-pages {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .plati-pagination-page {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          border-radius: 123px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #1a1a1a;
          cursor: pointer;
          line-height: 20px;
        }

        .plati-pagination-page:hover { background: #f3f3f5; }
        .plati-pagination-page.active { background: #dbeafe; color: #4a90ff; }

        .plati-pagination-ellipsis {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #9ca3af;
        }

        .plati-pagination-perpage {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #1a1a1a;
          background: white;
          border: 1px solid #a0a0a8;
          border-radius: 123px;
          padding: 8px 17px;
          white-space: nowrap;
          line-height: 20px;
          display: flex;
          align-items: center;
          height: 40px;
          cursor: pointer;
        }
      `}</style>
    </>
  )
}

export default DataTablePagination
