import React from 'react'

/**
 * TabBar — horizontal tab navigation with count badges
 *
 * @param {Array} tabs - [{ key, label }]
 * @param {string} activeKey - currently active tab key
 * @param {function} onChange - (key) => void
 * @param {object} counts - { [key]: number } optional badge counts per tab
 */
const TabBar = ({ tabs, activeKey, onChange, counts = {} }) => {
  return (
    <>
      <div className="plati-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`plati-tab ${activeKey === tab.key ? 'active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {counts[tab.key] !== undefined && (
              <span className="plati-tab-count">{counts[tab.key]}</span>
            )}
          </button>
        ))}
      </div>
      <style>{`
        .plati-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #a0a0a8;
          margin-bottom: 16px;
        }

        .plati-tab {
          background: none;
          border: none;
          border-bottom: 1px solid transparent;
          margin-bottom: -1px;
          padding: 12px 24px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #1a1a1a;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
          white-space: nowrap;
          line-height: 24px;
        }

        .plati-tab:hover { color: #000; }

        .plati-tab.active {
          font-weight: 600;
          border-bottom: 2px solid #f55e34;
          margin-bottom: -1px;
        }

        .plati-tab-count {
          background: #f7d6ca;
          color: #f55e34;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 1234px;
          min-width: 24px;
          text-align: center;
          line-height: 16px;
          letter-spacing: -0.06px;
        }
      `}</style>
    </>
  )
}

export default TabBar
