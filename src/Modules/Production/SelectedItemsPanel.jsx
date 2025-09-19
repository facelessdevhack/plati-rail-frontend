import React, { useMemo } from 'react'
import {
  Card,
  Button,
  Select,
  Input,
  Tag,
  Space,
  Empty,
  Divider,
  Typography,
  Tooltip,
  Badge
} from 'antd'
import {
  CloseOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RightOutlined,
  LeftOutlined
} from '@ant-design/icons'
import { FixedSizeList as List } from 'react-window'

const { Text, Title } = Typography
const { Option } = Select

const SelectedItemsPanel = ({
  selectedRows,
  conversionPlans,
  filteredStockData,
  isCollapsed,
  onToggleCollapse,
  onUpdatePlan,
  onRemoveItem,
  onRemoveAll,
  getAvailableTargetFinishes,
  getSelectedFinishesForAlloy
}) => {
  // Get selected items data (now works with plan IDs)
  const selectedItems = useMemo(() => {
    return Array.from(selectedRows).map(planId => {
      const plan = conversionPlans[planId]
      if (!plan) return null
      
      return {
        planId,
        alloy: plan.sourceAlloy,
        plan,
        isConfigured: plan?.targetFinish ? true : false
      }
    }).filter(item => item && item.alloy) // Filter out any items not found in data
  }, [selectedRows, conversionPlans])

  // Calculate statistics
  const stats = useMemo(() => {
    const configured = selectedItems.filter(item => item.isConfigured).length
    const notConfigured = selectedItems.length - configured
    const totalQuantity = selectedItems.reduce((sum, item) => {
      return sum + (item.plan?.quantity || 0)
    }, 0)
    
    return {
      total: selectedItems.length,
      configured,
      notConfigured,
      totalQuantity
    }
  }, [selectedItems])

  // Row renderer for virtual list
  const ItemRow = ({ index, style }) => {
    const item = selectedItems[index]
    if (!item) return null

    const { alloy, plan, isConfigured } = item
    const totalStock = alloy.inHouseStock || 0

    return (
      <div style={style} className="px-3 py-2">
        <div className={`border rounded-lg p-3 ${isConfigured ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-medium text-sm truncate">{alloy.productName}</div>
              <div className="text-xs text-gray-600">
                {alloy.inches}" • {alloy.pcd} • {alloy.finish}
              </div>
            </div>
            <Tooltip title="Remove this plan">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onRemoveItem(item.planId)}
              />
            </Tooltip>
          </div>

          {/* Stock Info */}
          <div className="flex items-center gap-2 mb-2">
            <Tag color={totalStock === 0 ? 'red' : totalStock < 10 ? 'orange' : 'green'}>
              Stock: {totalStock} units
            </Tag>
          </div>

          {/* Configuration */}
          <div className="space-y-2">
            <Select
              size="small"
              placeholder="Select target finish"
              value={plan?.targetFinish}
              onChange={(value) => onUpdatePlan(item.planId, 'targetFinish', value)}
              className="w-full"
              status={!plan?.targetFinish ? 'warning' : ''}
              notFoundContent="No other finishes available for this product"
            >
              {getAvailableTargetFinishes && getAvailableTargetFinishes(alloy).map(finish => (
                <Option key={finish.value} value={finish.value}>
                  <div className="flex justify-between items-center">
                    <span>{finish.label}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({finish.stock} stock)
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
            
            <div className="flex gap-2">
              <Input
                size="small"
                type="number"
                min="1"
                max={totalStock}
                value={plan?.quantity || 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  const clampedValue = Math.max(1, Math.min(value, totalStock))
                  onUpdatePlan(item.planId, 'quantity', clampedValue)
                }}
                className="flex-1"
                addonBefore="Qty"
                placeholder="Enter quantity"
              />
              {isConfigured && (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Ready
                </Tag>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-white border-l flex flex-col items-center py-4 fixed right-0 top-0 z-10" style={{ height: '100vh' }}>
        <Tooltip title="Expand selection panel" placement="left">
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={onToggleCollapse}
            className="mb-4"
          />
        </Tooltip>
        
        <div className="flex flex-col items-center gap-2">
          <Badge count={stats.total} showZero>
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <Text className="text-xs font-bold">{stats.total}</Text>
            </div>
          </Badge>
          
          {stats.configured > 0 && (
            <Tooltip title={`${stats.configured} configured`} placement="left">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <Text className="text-xs font-bold text-green-600">{stats.configured}</Text>
              </div>
            </Tooltip>
          )}
          
          {stats.notConfigured > 0 && (
            <Tooltip title={`${stats.notConfigured} need configuration`} placement="left">
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                <Text className="text-xs font-bold text-orange-600">{stats.notConfigured}</Text>
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    )
  }

  // Expanded view
  return (
    <div className="w-[400px] h-full bg-white border-l flex flex-col fixed right-0 top-0 z-10 shadow-lg" style={{ height: '100vh' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <Title level={5} className="mb-0">
            Selected Items ({stats.total})
          </Title>
          <Space>
            {stats.total > 0 && (
              <Button
                size="small"
                danger
                onClick={onRemoveAll}
              >
                Clear All
              </Button>
            )}
            <Tooltip title="Collapse panel">
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={onToggleCollapse}
              />
            </Tooltip>
          </Space>
        </div>
        
        {/* Statistics */}
        <div className="flex gap-2">
          <Tag color="blue">Total: {stats.total}</Tag>
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Ready: {stats.configured}
          </Tag>
          {stats.notConfigured > 0 && (
            <Tag color="warning" icon={<WarningOutlined />}>
              Need Setup: {stats.notConfigured}
            </Tag>
          )}
        </div>
      </div>


      {/* Items List */}
      <div className="flex-1 overflow-hidden">
        {selectedItems.length === 0 ? (
          <Empty
            description="No items selected"
            className="mt-8"
          />
        ) : selectedItems.length <= 10 ? (
          // Regular list for small number of items
          <div className="overflow-y-auto h-full">
            {selectedItems.map((item, index) => (
              <div key={item.planId} className="px-3 py-2">
                <ItemRow index={index} style={{}} />
              </div>
            ))}
          </div>
        ) : (
          // Virtual list for many items
          <List
            height={window.innerHeight - 200} // Adjust based on header heights
            itemCount={selectedItems.length}
            itemSize={140} // Height of each item
            width="100%"
          >
            {ItemRow}
          </List>
        )}
      </div>

      {/* Footer Summary */}
      {stats.total > 0 && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <Text type="secondary">Total Quantity:</Text>
              <Text strong>{stats.totalQuantity} units</Text>
            </div>
            {stats.configured === stats.total && (
              <div className="mt-2 p-2 bg-green-100 rounded text-center">
                <Text className="text-green-700 font-medium">
                  ✓ All items configured and ready
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SelectedItemsPanel