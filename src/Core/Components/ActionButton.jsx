import React from 'react'
import { CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import { Popconfirm } from 'antd'

/**
 * ProcessButton — blue rounded button with checkmark icon
 */
export const ProcessButton = ({ onClick, loading = false, disabled = false, children = 'Process' }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#4a90ff',
        border: 'none',
        borderRadius: 12,
        padding: 8,
        fontSize: 14,
        fontWeight: 400,
        fontFamily: "'Inter', sans-serif",
        color: 'white',
        cursor: loading || disabled ? 'wait' : 'pointer',
        opacity: loading || disabled ? 0.5 : 1,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        lineHeight: '20px',
      }}
    >
      <CheckCircleOutlined /> {loading ? 'Processing...' : children}
    </button>
  )
}

/**
 * DeleteButton — gray rounded square with trash icon + confirmation
 */
export const DeleteButton = ({
  onConfirm,
  loading = false,
  disabled = false,
  title = 'Delete this entry?',
  description = 'This action cannot be undone.',
}) => {
  return (
    <Popconfirm
      title={title}
      description={description}
      onConfirm={onConfirm}
      okText="Yes"
      cancelText="No"
      okButtonProps={{ danger: true }}
    >
      <button
        disabled={loading || disabled}
        style={{
          background: 'rgba(26, 26, 26, 0.2)',
          border: 'none',
          borderRadius: 12,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: loading || disabled ? 'not-allowed' : 'pointer',
          color: '#1a1a1a',
          transition: 'all 0.2s',
          flexShrink: 0,
          fontSize: 16,
        }}
      >
        <DeleteOutlined />
      </button>
    </Popconfirm>
  )
}
