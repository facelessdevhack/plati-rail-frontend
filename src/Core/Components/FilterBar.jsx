import React from 'react'
import { Input, Select, Dropdown, DatePicker } from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  DownOutlined,
} from '@ant-design/icons'
import moment from 'moment'

/**
 * FilterBar — pill-shaped filter controls in a white card
 *
 * @param {string} searchText - current search value
 * @param {function} onSearchChange - (value) => void
 * @param {string|null} selectedDealer - current dealer filter
 * @param {function} onDealerChange - (value) => void
 * @param {Array} dealerOptions - [{ label, value }]
 * @param {string} selectedDate - YYYY-MM-DD date string (single date mode)
 * @param {function} onDateChange - (dateString) => void (single date mode)
 * @param {Array|null} dateRange - [dayjs, dayjs] (range mode)
 * @param {function} onDateRangeChange - (dates) => void (range mode)
 * @param {function} onRefresh - () => void
 * @param {boolean} loading - refresh loading state
 * @param {Array} exportMenuItems - Dropdown menu items for export
 * @param {React.ReactNode} extraFilters - additional filter elements
 */
const FilterBar = ({
  searchText,
  onSearchChange,
  selectedDealer,
  onDealerChange,
  dealerOptions = [],
  selectedDate,
  onDateChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  loading = false,
  exportMenuItems = [],
  extraFilters,
}) => {
  const useDateRange = !!onDateRangeChange

  return (
    <>
      <div className="plati-filters-card">
        <div className="plati-filters">
          <Input
            placeholder="Search..."
            suffix={<SearchOutlined style={{ color: '#a0a0a8' }} />}
            value={searchText}
            onChange={e => onSearchChange(e.target.value)}
            allowClear
            className="plati-filter-search"
          />
          <Select
            placeholder="Select Dealer"
            value={selectedDealer}
            onChange={onDealerChange}
            allowClear
            showSearch
            optionFilterProp="label"
            options={dealerOptions}
            className="plati-filter-dealer"
          />

          {useDateRange ? (
            <DatePicker.RangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              format="DD MMM YYYY"
              placeholder={['Start Date', 'End Date']}
              className="plati-filter-daterange"
            />
          ) : (
            <div className="plati-filter-date-wrap">
              <input
                type="date"
                value={selectedDate}
                onChange={e => onDateChange(e.target.value)}
                className="plati-filter-date"
              />
              <span className="plati-filter-date-display">
                {moment(selectedDate).format('DD MMMM YYYY')}
              </span>
            </div>
          )}

          {extraFilters}

          <button className="plati-btn-refresh" onClick={onRefresh} disabled={loading}>
            <ReloadOutlined spin={loading} style={{ fontSize: 14 }} /> Refresh
          </button>
          {exportMenuItems.length > 0 && (
            <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
              <button className="plati-btn-export">
                <ExportOutlined style={{ fontSize: 14 }} /> Export <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
              </button>
            </Dropdown>
          )}
        </div>
      </div>
      <style>{`
        .plati-filters-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 20px;
          padding: 12px 32px;
          margin-bottom: 16px;
          box-shadow: 0px 1px 2px 0px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
        }

        .plati-filters {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .plati-filter-search { flex: 1; min-width: 200px; }

        .plati-filter-search.ant-input-affix-wrapper {
          height: 40px !important;
          border-radius: 123px !important;
          border: 1px solid #a0a0a8 !important;
          font-size: 16px !important;
          font-family: 'Inter', sans-serif !important;
          padding: 0 16px !important;
          box-shadow: none !important;
          background: white !important;
        }

        .plati-filter-search.ant-input-affix-wrapper .ant-input {
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          background: transparent !important;
          font-size: 16px !important;
          font-family: 'Inter', sans-serif !important;
        }

        .plati-filter-search .ant-input-suffix { color: #a0a0a8; font-size: 16px; }

        .plati-filter-dealer { width: 324px; flex-shrink: 0; height: 40px !important; }
        .plati-filter-dealer.ant-select { height: 40px !important; }

        .plati-filter-dealer .ant-select-selector {
          height: 40px !important;
          border-radius: 123px !important;
          border: 1px solid #a0a0a8 !important;
          display: flex !important;
          align-items: center !important;
          padding: 0 17px !important;
          font-size: 14px !important;
          font-family: 'Inter', sans-serif !important;
          box-shadow: none !important;
          background: white !important;
        }

        .plati-filter-dealer .ant-select-selection-placeholder {
          font-size: 14px !important;
          color: #1a1a1a !important;
          inset-inline-start: 17px !important;
          inset-inline-end: 40px !important;
        }

        .plati-filter-dealer .ant-select-selection-item {
          font-size: 14px !important;
          color: #1a1a1a !important;
          padding-inline-end: 24px !important;
        }

        .plati-filter-dealer .ant-select-arrow {
          color: #1a1a1a !important;
          inset-inline-end: 17px !important;
          font-size: 12px !important;
        }

        .plati-filter-dealer .ant-select-selection-search {
          inset-inline-start: 17px !important;
        }

        /* Single date */
        .plati-filter-date-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          flex: 1;
          min-width: 180px;
        }

        .plati-filter-date {
          height: 40px;
          border: 1px solid #a0a0a8;
          border-radius: 123px;
          padding: 0 17px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: transparent;
          outline: none;
          width: 100%;
          background: white;
          cursor: pointer;
        }

        .plati-filter-date::-webkit-calendar-picker-indicator {
          position: absolute;
          right: 17px;
          cursor: pointer;
          opacity: 0.5;
        }

        .plati-filter-date-display {
          position: absolute;
          left: 17px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
          pointer-events: none;
          line-height: 20px;
        }

        .plati-filter-date:focus { border-color: #4a90ff; }

        /* Date range */
        .plati-filter-daterange { flex: 1; min-width: 260px; }

        .plati-filter-daterange.ant-picker-range {
          height: 40px !important;
          border-radius: 123px !important;
          border: 1px solid #a0a0a8 !important;
          padding: 0 16px !important;
          font-size: 14px !important;
          font-family: 'Inter', sans-serif !important;
          box-shadow: none !important;
          background: white !important;
        }

        .plati-filter-daterange.ant-picker-range .ant-picker-input > input {
          font-size: 14px !important;
          font-family: 'Inter', sans-serif !important;
          color: #1a1a1a !important;
        }

        .plati-filter-daterange.ant-picker-range:hover,
        .plati-filter-daterange.ant-picker-range.ant-picker-focused {
          border-color: #4a90ff !important;
        }

        .plati-filter-daterange .ant-picker-active-bar {
          background: #4a90ff !important;
        }

        /* Buttons */
        .plati-btn-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          min-width: 100px;
          justify-content: center;
          background: #f3f3f5;
          border: none;
          border-radius: 123px;
          font-size: 14px;
          font-weight: 400;
          font-family: 'Inter', sans-serif;
          color: #1a1a1a;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .plati-btn-refresh:hover { background: #e8e8ea; }

        .plati-btn-export {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          min-width: 100px;
          justify-content: center;
          background: #1a1a1a;
          border: none;
          border-radius: 123px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .plati-btn-export:hover { background: #333; }

        @media (max-width: 768px) {
          .plati-filters { flex-direction: column; align-items: stretch; }
          .plati-filter-search, .plati-filter-dealer { width: 100% !important; }
        }
      `}</style>
    </>
  )
}

export default FilterBar
