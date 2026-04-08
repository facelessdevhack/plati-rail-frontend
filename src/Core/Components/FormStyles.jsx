import React from 'react'

/**
 * PlatiFormStyles — Global form styling that matches the Figma design language.
 * Wrap any form container with this to apply consistent input, select, label, and button styling.
 *
 * Usage: <PlatiFormStyles><Form>...</Form></PlatiFormStyles>
 * Or just render <PlatiFormStyles /> once in the page to inject the styles.
 */
const PlatiFormStyles = ({ children }) => {
  return (
    <>
      {children}
      <style>{`
        /* ===== PLATI FORM DESIGN LANGUAGE ===== */

        /* Labels */
        .plati-form .ant-form-item-label > label,
        .plati-form label {
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #1a1a1a !important;
          line-height: 20px !important;
        }

        /* Input fields */
        .plati-form .ant-input,
        .plati-form .ant-picker,
        .plati-form textarea.ant-input {
          background: white !important;
          border: 1px solid rgba(26, 26, 26, 0.2) !important;
          border-radius: 12px !important;
          height: 44px !important;
          padding: 10px 16px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #1a1a1a !important;
          letter-spacing: -0.15px !important;
          box-shadow: none !important;
        }

        .plati-form textarea.ant-input {
          height: auto !important;
          min-height: 80px !important;
          padding: 12px 16px !important;
        }

        .plati-form .ant-input::placeholder,
        .plati-form .ant-input-number-input::placeholder,
        .plati-form textarea.ant-input::placeholder {
          color: #a0a0a8 !important;
        }

        .plati-form .ant-input:focus,
        .plati-form .ant-input-number:focus,
        .plati-form .ant-input-number-focused,
        .plati-form .ant-picker-focused {
          border-color: #4a90ff !important;
          box-shadow: none !important;
        }

        .plati-form .ant-input:hover,
        .plati-form .ant-input-number:hover,
        .plati-form .ant-picker:hover {
          border-color: rgba(26, 26, 26, 0.35) !important;
        }

        /* Input Number wrapper */
        .plati-form .ant-input-number {
          background: white !important;
          border: 1px solid rgba(26, 26, 26, 0.2) !important;
          border-radius: 12px !important;
          height: 44px !important;
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          padding: 0 12px !important;
        }

        .plati-form .ant-input-number .ant-input-number-input-wrap {
          display: flex !important;
          align-items: center !important;
          height: 100% !important;
          flex: 1 !important;
        }

        .plati-form .ant-input-number-input {
          height: 100% !important;
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          color: #1a1a1a !important;
          line-height: 42px !important;
        }

        .plati-form .ant-input-number-handler-wrap {
          border-radius: 0 12px 12px 0 !important;
        }

        /* Select dropdowns */
        .plati-form .ant-select-selector {
          background: white !important;
          border: 1px solid rgba(26, 26, 26, 0.2) !important;
          border-radius: 12px !important;
          height: 44px !important;
          padding: 0 16px !important;
          display: flex !important;
          align-items: center !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          box-shadow: none !important;
        }

        .plati-form .ant-select-selection-placeholder {
          color: #a0a0a8 !important;
          font-weight: 500 !important;
        }

        .plati-form .ant-select-focused .ant-select-selector {
          border-color: #4a90ff !important;
        }

        .plati-form .ant-select-arrow {
          color: rgba(26, 26, 26, 0.4) !important;
          top: 0 !important;
          bottom: 0 !important;
          right: 16px !important;
          margin-top: 0 !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          transform: none !important;
        }

        /* Date picker */
        .plati-form .ant-picker {
          background: white !important;
          border: 1px solid rgba(26, 26, 26, 0.2) !important;
          border-radius: 12px !important;
          height: 44px !important;
          width: 100% !important;
        }

        .plati-form .ant-picker input {
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          color: #1a1a1a !important;
        }

        /* Radio buttons */
        .plati-form .ant-radio-wrapper {
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #1a1a1a !important;
        }

        .plati-form .ant-radio-inner {
          border-color: #a0a0a8 !important;
          width: 20px !important;
          height: 20px !important;
        }

        .plati-form .ant-radio-checked .ant-radio-inner {
          border-color: #4a90ff !important;
          background: white !important;
        }

        .plati-form .ant-radio-checked .ant-radio-inner::after {
          background: #4a90ff !important;
        }

        /* Radio Button Group (segmented) */
        .plati-form .ant-radio-button-wrapper {
          height: 36px !important;
          line-height: 34px !important;
          padding: 0 16px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          display: inline-flex !important;
          align-items: center !important;
          border-radius: 8px !important;
        }

        .plati-form .ant-radio-button-wrapper:first-child {
          border-radius: 8px 0 0 8px !important;
        }

        .plati-form .ant-radio-button-wrapper:last-child {
          border-radius: 0 8px 8px 0 !important;
        }

        .plati-form .ant-radio-button-wrapper-checked {
          background: #dbeafe !important;
          border-color: #4a90ff !important;
          color: #4a90ff !important;
        }

        /* Checkbox */
        .plati-form .ant-checkbox-wrapper {
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #1a1a1a !important;
        }

        /* Disabled inputs */
        .plati-form .ant-input[disabled],
        .plati-form .ant-input-number-disabled,
        .plati-form .ant-select-disabled .ant-select-selector,
        .plati-form .ant-picker-disabled {
          background: #f3f3f5 !important;
          color: #6b7280 !important;
          cursor: not-allowed !important;
        }

        /* Form item spacing */
        .plati-form .ant-form-item {
          margin-bottom: 16px !important;
        }

        /* Divider inside form */
        .plati-form .ant-divider {
          border-color: #e5e5e5 !important;
        }

        /* Section headings inside form */
        .plati-form-section-title {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .plati-form-section-title .anticon {
          color: #4a90ff;
        }
      `}</style>
    </>
  )
}

export default PlatiFormStyles
