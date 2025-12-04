import React, { useState } from 'react'
import { Button, message, Spin, Select, DatePicker, Space, Modal, Checkbox } from 'antd'
import { FilePdfOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons'
import moment from 'moment'
import axios from 'axios'

const { RangePicker } = DatePicker
const { Option } = Select

const DispatchPDFExport = ({
  selectedOrderIds = [],
  availableDealers = [],
  onExportComplete
}) => {
  const [loading, setLoading] = useState(false)
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [exportType, setExportType] = useState('single')
  const [selectedDealer, setSelectedDealer] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [includeDealerInfo, setIncludeDealerInfo] = useState(true)
  const [includePricingInfo, setIncludePricingInfo] = useState(true)

  // Handle single order PDF export
  const handleSingleOrderExport = async (orderId) => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/v2/dispatch/pdf/${orderId}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      // Extract filename from response headers or create default
      const contentDisposition = response.headers['content-disposition']
      let filename = `Dispatch_Order_${moment().format('DD-MM-YYYY')}.pdf`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success('Dispatch PDF exported successfully')
      if (onExportComplete) onExportComplete()
    } catch (error) {
      console.error('Error exporting dispatch PDF:', error)
      message.error('Failed to export dispatch PDF')
    } finally {
      setLoading(false)
    }
  }

  // Handle consolidated PDF export
  const handleConsolidatedExport = async () => {
    setLoading(true)
    try {
      const payload = {}

      // Add order IDs if provided
      if (selectedOrderIds.length > 0) {
        payload.orderIds = selectedOrderIds
      }

      // Add dealer filter if selected
      if (selectedDealer) {
        payload.dealerId = selectedDealer
      }

      // Add date range if provided
      if (dateRange && dateRange.length === 2) {
        payload.startDate = dateRange[0].toISOString()
        payload.endDate = dateRange[1].toISOString()
      }

      const response = await axios.post('/api/v2/dispatch/pdf/consolidated', payload, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      const contentDisposition = response.headers['content-disposition']
      let filename = `Consolidated_Dispatch_${moment().format('DD-MM-YYYY')}.pdf`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success('Consolidated dispatch PDF exported successfully')
      setExportModalVisible(false)
      if (onExportComplete) onExportComplete()
    } catch (error) {
      console.error('Error exporting consolidated PDF:', error)
      message.error('Failed to export consolidated dispatch PDF')
    } finally {
      setLoading(false)
    }
  }

  // Render single order export button
  const renderSingleOrderButton = (orderId, orderNumber) => {
    return (
      <Button
        type="primary"
        icon={<FilePdfOutlined />}
        size="small"
        loading={loading}
        onClick={() => handleSingleOrderExport(orderId)}
        title={`Export Order ${orderNumber || orderId}`}
        style={{
          backgroundColor: '#2C3E50',
          borderColor: '#2C3E50',
          color: 'white'
        }}
      >
        Export PDF
      </Button>
    )
  }

  // Render consolidated export button
  const renderConsolidatedButton = () => {
    return (
      <Button
        type="primary"
        icon={<FilePdfOutlined />}
        loading={loading}
        onClick={() => setExportModalVisible(true)}
        style={{
          backgroundColor: '#2C3E50',
          borderColor: '#2C3E50',
          color: 'white'
        }}
      >
        Export Consolidated PDF
      </Button>
    )
  }

  return (
    <div>
      {/* Single Order Export */}
      {typeof selectedOrderIds === 'number' && renderSingleOrderButton(selectedOrderIds)}

      {/* Consolidated Export Button */}
      {Array.isArray(selectedOrderIds) && renderConsolidatedButton()}

      {/* Export Modal */}
      <Modal
        title="Export Consolidated Dispatch PDF"
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="export"
            type="primary"
            loading={loading}
            onClick={handleConsolidatedExport}
            style={{
              backgroundColor: '#2C3E50',
              borderColor: '#2C3E50'
            }}
          >
            Export PDF
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Selected Orders Info */}
          {selectedOrderIds.length > 0 && (
            <div>
              <h4>Selected Orders</h4>
              <p style={{ color: '#666' }}>
                {selectedOrderIds.length} order(s) selected for export
              </p>
            </div>
          )}

          {/* Dealer Filter */}
          <div>
            <h4>
              <FilterOutlined /> Filter by Dealer (Optional)
            </h4>
            <Select
              style={{ width: '100%' }}
              placeholder="Select dealer to filter orders"
              allowClear
              value={selectedDealer}
              onChange={setSelectedDealer}
            >
              {availableDealers.map(dealer => (
                <Option key={dealer.id} value={dealer.id}>
                  {dealer.name}
                </Option>
              ))}
            </Select>
          </div>

          {/* Date Range Filter */}
          <div>
            <h4>
              <FilterOutlined /> Filter by Date Range (Optional)
            </h4>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
            />
          </div>

          {/* Export Options */}
          <div>
            <h4>Export Options</h4>
            <Space direction="vertical">
              <Checkbox
                checked={includeDealerInfo}
                onChange={(e) => setIncludeDealerInfo(e.target.checked)}
              >
                Include complete dealer information
              </Checkbox>
              <Checkbox
                checked={includePricingInfo}
                onChange={(e) => setIncludePricingInfo(e.target.checked)}
              >
                Include pricing and tax information
              </Checkbox>
            </Space>
          </div>

          {/* Export Preview */}
          <div style={{
            backgroundColor: '#F8F9FA',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #DEE2E6'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#2C3E50' }}>
              Professional PDF Features:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '13px' }}>
              <li>Clean corporate design without gradients</li>
              <li>Professional typography and spacing</li>
              <li>Company logo and branding</li>
              <li>Organized table layouts</li>
              <li>Dealer and shipping information</li>
              <li>Itemized product details</li>
              <li>Automatic GST calculations</li>
              <li>Professional footer with company details</li>
            </ul>
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default DispatchPDFExport