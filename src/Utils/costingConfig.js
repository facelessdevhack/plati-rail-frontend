import dayjs from 'dayjs'

// Invoice-backed costing starts here. The backend clamps every P&L endpoint
// to the same date (COSTING_REPORT_FROM in product-cost.controller.js) —
// keep the two in sync. Months before this carry static cost estimates only
// and are excluded from profit reporting; move the date back when earlier
// purchase invoices are imported.
export const COSTING_REPORT_FROM = dayjs('2026-04-01')

// For antd DatePicker/RangePicker disabledDate props
export const disableBeforeCostingStart = date =>
  date && date.isBefore(COSTING_REPORT_FROM, 'day')
