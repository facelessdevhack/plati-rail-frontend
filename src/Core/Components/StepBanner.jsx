import React, { useState } from 'react'
import { DownOutlined, SendOutlined } from '@ant-design/icons'

/**
 * StepBanner — collapsible blue guidance banner
 *
 * @param {string} title - e.g. "Step 1: Awaiting Approval"
 * @param {Array} steps - array of guidance text strings
 * @param {React.ReactNode} icon - optional icon, defaults to SendOutlined
 * @param {boolean} defaultExpanded - default expanded state
 */
const StepBanner = ({ title, steps = [], icon, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const Icon = icon || <SendOutlined className="plati-step-icon" />

  return (
    <>
      <div className="plati-step-banner" onClick={() => setExpanded(!expanded)}>
        <div className="plati-step-top">
          <div className="plati-step-inner">
            {Icon}
            <span className="plati-step-text">{title}</span>
          </div>
          <span className={`plati-step-chevron ${expanded ? 'expanded' : ''}`}>
            <DownOutlined />
          </span>
        </div>
        {expanded && steps.length > 0 && (
          <ul className="plati-step-list">
            {steps.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        )}
      </div>
      <style>{`
        .plati-step-banner {
          background: #eff6ff;
          border: 1px solid #cee2ff;
          border-radius: 20px;
          padding: 16px 32px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .plati-step-banner:hover { background: #e8f1ff; }

        .plati-step-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .plati-step-inner {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .plati-step-icon { color: #4a90ff; font-size: 18px; }

        .plati-step-text {
          font-family: 'Inter', sans-serif;
          font-size: 18px;
          font-weight: 500;
          color: #4a90ff;
          line-height: 24px;
        }

        .plati-step-chevron {
          color: #4a90ff;
          font-size: 12px;
          transition: transform 0.2s;
        }

        .plati-step-chevron.expanded { transform: rotate(180deg); }

        .plati-step-list {
          margin: 0;
          padding-left: 18px;
          list-style: disc;
        }

        .plati-step-list li {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: #1a1a1a;
          line-height: 18px;
        }
      `}</style>
    </>
  )
}

export default StepBanner
