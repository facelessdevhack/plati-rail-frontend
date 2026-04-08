import React from 'react'

/**
 * StatusBadge — pill badge with colored dot and text
 *
 * @param {'paid'|'unpaid'|'dispatched'|'pending'|'inprod'|'outofstock'} variant
 * @param {string} children - badge text
 * @param {string} subText - optional sub text (e.g. "Rs. 500")
 */

const VARIANTS = {
  paid: { bg: '#d9fae6', border: 'rgba(78, 203, 113, 0.2)', dot: '#4ecb71' },
  unpaid: { bg: '#fef2f2', border: 'rgba(229, 62, 62, 0.2)', dot: '#e53e3e' },
  dispatched: { bg: '#d9fae6', border: 'rgba(78, 203, 113, 0.2)', dot: '#4ecb71' },
  pending: { bg: '#fff7ed', border: 'rgba(242, 108, 45, 0.2)', dot: '#f26c2d' },
  inprod: { bg: '#ecfeff', border: 'rgba(8, 145, 178, 0.2)', dot: '#0891b2' },
  outofstock: { bg: '#fff7ed', border: 'rgba(194, 65, 12, 0.2)', dot: '#c2410c' },
}

const StatusBadge = ({ variant = 'paid', children, subText }) => {
  const v = VARIANTS[variant] || VARIANTS.paid

  return (
    <div>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 13px',
        borderRadius: 33554400,
        fontSize: 12,
        fontWeight: 400,
        fontFamily: "'Inter', sans-serif",
        lineHeight: '16px',
        color: '#1a1a1a',
        background: v.bg,
        border: `1px solid ${v.border}`,
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: v.dot,
          flexShrink: 0,
        }} />
        {children}
      </span>
      {subText && (
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{subText}</div>
      )}
    </div>
  )
}

export default StatusBadge
