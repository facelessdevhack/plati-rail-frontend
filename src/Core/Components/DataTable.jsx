import React from 'react'
import DataTablePagination from './DataTablePagination'

/**
 * DataTable — white card table with Figma-styled headers and pagination
 *
 * @param {Array} columns - [{ key, title, render?, align?, width? }]
 * @param {Array} data - array of row objects
 * @param {string} rowKey - key field for rows
 * @param {boolean} loading
 * @param {string} emptyText
 * @param {number} currentPage
 * @param {number} pageSize
 * @param {number} totalItems
 * @param {function} onPageChange
 * @param {function} onPageSizeChange
 */
const DataTable = ({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  emptyText = 'No entries found',
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  return (
    <>
      <div className="plati-table-card">
        <div className="plati-table-wrap">
          <table className="plati-table">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={col.key}
                    style={{
                      textAlign: col.align || (i === 0 ? 'left' : undefined),
                      width: col.width,
                      paddingLeft: i === 0 ? 32 : undefined,
                    }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="plati-table-empty">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={columns.length} className="plati-table-empty">{emptyText}</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row[rowKey]}>
                    {columns.map((col, i) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align,
                          paddingLeft: i === 0 ? 32 : undefined,
                        }}
                      >
                        {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && onPageChange && (
          <DataTablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </div>
      <style>{`
        .plati-table-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0px 1px 2px 0px rgba(0,0,0,0.05);
        }

        .plati-table-wrap { overflow-x: auto; }

        .plati-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .plati-table thead th {
          background: #f3f3f5;
          padding: 12px 16px;
          text-align: left;
          font-weight: 500;
          color: rgba(26, 26, 26, 0.6);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          border-bottom: 1px solid #e5e5e5;
          white-space: nowrap;
          line-height: 20px;
          height: 40px;
        }

        .plati-table tbody td {
          padding: 14px 16px;
          color: #1a1a1a;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          line-height: 20px;
        }

        .plati-table tbody tr:hover { background: #fafafa; }

        .plati-table-empty {
          text-align: center;
          padding: 40px 16px !important;
          color: #f55e34;
          font-weight: 500;
        }
      `}</style>
    </>
  )
}

export default DataTable
