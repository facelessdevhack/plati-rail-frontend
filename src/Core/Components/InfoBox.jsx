import React from 'react'
import { InfoCircleOutlined } from '@ant-design/icons'

/**
 * InfoBox — orange-themed information box with bullet points
 *
 * @param {string} title - e.g. "Information"
 * @param {Array} items - array of text strings
 */
const InfoBox = ({ title = 'Information', items = [] }) => {
  return (
    <div style={{
      marginTop: 24,
      background: '#fff7ed',
      border: '1px solid #fed7aa',
      borderRadius: 16,
      padding: '24px 32px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
      }}>
        <InfoCircleOutlined style={{ fontSize: 18, color: '#f26c2d' }} />
        <span style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#f26c2d',
          fontFamily: "'Inter', sans-serif",
        }}>{title}</span>
      </div>
      <ul style={{
        margin: 0,
        paddingLeft: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {items.map((item, i) => (
          <li key={i} style={{
            fontSize: 13,
            color: '#78350f',
            lineHeight: 1.6,
            fontFamily: "'Inter', sans-serif",
          }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default InfoBox
