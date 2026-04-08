import React from 'react'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

/**
 * KpiCard — Reusable KPI metric card matching Figma design
 *
 * @param {string} title - KPI label (e.g. "Total Revenue")
 * @param {string|number} value - Main metric value (e.g. "₹7.45 Cr")
 * @param {React.ReactNode} icon - Optional icon element
 * @param {'blue'|'green'|'orange'|'red'|'purple'} accentColor - Left border + title color
 * @param {object} trend - { value: "14.8%", direction: "up"|"down", label: "vs last month" }
 * @param {object} subMetric - { label: "Average order value:", value: "₹36,077" }
 * @param {string} className - Additional className
 */

const ACCENT_COLORS = {
  blue: { border: '#4a90ff', text: '#4a90ff', icon: '#4a90ff' },
  green: { border: '#4ecb71', text: '#15803d', icon: '#4ecb71' },
  orange: { border: '#f26c2d', text: '#f26c2d', icon: '#f26c2d' },
  red: { border: '#e53e3e', text: '#dc2626', icon: '#e53e3e' },
  purple: { border: '#7c3aed', text: '#7c3aed', icon: '#7c3aed' },
}

const KpiCard = ({
  title,
  value,
  icon,
  accentColor = 'blue',
  trend,
  subMetric,
  className = '',
}) => {
  const colors = ACCENT_COLORS[accentColor] || ACCENT_COLORS.blue

  return (
    <div
      className={className}
      style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #e5e5e5',
        borderLeft: `4px solid ${colors.border}`,
        padding: 16,
        boxShadow: '0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 20 }}>
        {icon && <span style={{ fontSize: 16, color: colors.icon, display: 'flex', alignItems: 'center' }}>{icon}</span>}
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          fontWeight: 400,
          color: colors.text,
          lineHeight: '20px',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
      </div>

      {/* Main value */}
      <div style={{
        fontFamily: "'Staff Wide Test', serif",
        fontSize: 30,
        fontWeight: 400,
        color: '#1a1a1a',
        lineHeight: '36px',
      }}>
        {value}
      </div>

      {/* Trend row */}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 400,
            color: 'rgba(26,26,26,0.6)',
            lineHeight: '16px',
          }}>
            {trend.label || 'vs last month'}
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: trend.direction === 'up' ? '#d9fae6' : '#fef2f2',
            padding: '4px 8px',
            borderRadius: 6,
          }}>
            {trend.direction === 'up'
              ? <ArrowUpOutlined style={{ fontSize: 12, color: '#15803d' }} />
              : <ArrowDownOutlined style={{ fontSize: 12, color: '#e53e3e' }} />
            }
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 400,
              color: trend.direction === 'up' ? '#15803d' : '#e53e3e',
              lineHeight: '12px',
            }}>
              {trend.value}
            </span>
          </span>
        </div>
      )}

      {/* Sub metric row */}
      {subMetric && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 400,
            color: 'rgba(26,26,26,0.6)',
            lineHeight: '16px',
          }}>
            {subMetric.label}
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#dbeafe',
            padding: '4px 8px',
            borderRadius: 6,
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            color: '#1a1a1a',
            lineHeight: '12px',
          }}>
            {subMetric.value}
          </span>
        </div>
      )}
    </div>
  )
}

export default KpiCard
