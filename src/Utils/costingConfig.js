import dayjs from 'dayjs'

// FIFO reporting/replay period. The backend uses the same boundary and marks
// incomplete or fallback-costed periods instead of silently using master cost.
export const COSTING_REPORT_FROM = dayjs('2026-01-01')

// For antd DatePicker/RangePicker disabledDate props
export const disableBeforeCostingStart = date =>
  date && date.isBefore(COSTING_REPORT_FROM, 'day')
