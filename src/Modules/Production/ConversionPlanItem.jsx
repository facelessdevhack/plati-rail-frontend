import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  InputNumber, 
  Tag, 
  Switch, 
  Alert,
  Typography,
  Tooltip 
} from 'antd'
import { 
  ArrowRightOutlined,
  InfoCircleOutlined,
  WarningOutlined 
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { getConversionOptions } from '../../redux/api/stockAPI'

const { Text } = Typography
const { Option } = Select

const ConversionPlanItem = ({ 
  sourceAlloy, 
  index, 
  onConversionChange 
}) => {
  const dispatch = useDispatch()
  const { conversionOptions, loading } = useSelector(state => state.stockDetails)
  
  const [selectedTargetFinish, setSelectedTargetFinish] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [urgent, setUrgent] = useState(false)
  const [conversionOptionsData, setConversionOptionsData] = useState([])

  const sourceStock = (sourceAlloy.inHouseStock || 0) + (sourceAlloy.showroomStock || 0)

  // Load conversion options when component mounts
  useEffect(() => {
    const fetchConversionOptions = async () => {
      try {
        const result = await dispatch(getConversionOptions({ alloyId: sourceAlloy.id })).unwrap()
        setConversionOptionsData(result || [])
      } catch (error) {
        console.error('Error fetching conversion options:', error)
        setConversionOptionsData([])
      }
    }
    
    fetchConversionOptions()
  }, [dispatch, sourceAlloy.id])

  // Update parent when conversion data changes
  useEffect(() => {
    if (selectedTargetFinish && quantity > 0) {
      const targetAlloy = conversionOptionsData.find(option => option.finishName === selectedTargetFinish)
      onConversionChange({
        sourceAlloyId: sourceAlloy.id,
        targetAlloyId: targetAlloy?.id,
        targetFinish: selectedTargetFinish,
        quantity: quantity,
        urgent: urgent,
        sourceAlloy: sourceAlloy,
        targetAlloy: targetAlloy
      })
    } else {
      onConversionChange(null)
    }
  }, [selectedTargetFinish, quantity, urgent, sourceAlloy, conversionOptionsData, onConversionChange])

  return (
    <Card className="mb-4 shadow-sm">
      <Row gutter={[16, 16]} align="middle">
        {/* Source Alloy Info */}
        <Col xs={24} md={8}>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">SOURCE MATERIAL</div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-semibold text-sm text-gray-800">
                {sourceAlloy.productName}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {sourceAlloy.inches}" × {sourceAlloy.pcd} • {sourceAlloy.finish}
              </div>
              <div className="text-xs text-blue-600 mt-1 bg-blue-100 px-2 py-1 rounded">
                Stock: {sourceStock} units
              </div>
            </div>
          </div>
        </Col>

        {/* Conversion Arrow */}
        <Col xs={24} md={2}>
          <div className="text-center">
            <ArrowRightOutlined className="text-green-600 text-xl" />
            <div className="text-xs text-gray-500 mt-1">CONVERT TO</div>
          </div>
        </Col>

        {/* Target Finish Selection */}
        <Col xs={24} md={7}>
          <div>
            <div className="text-xs text-gray-500 mb-2">TARGET FINISH</div>
            <Select
              placeholder="Select target finish"
              value={selectedTargetFinish}
              onChange={setSelectedTargetFinish}
              className="w-full"
              loading={loading}
              showSearch
            >
              {conversionOptionsData.map(option => (
                <Option key={option.finishName} value={option.finishName}>
                  <div className="flex justify-between items-center">
                    <span>{option.finishName}</span>
                    <Tag color={option.totalStock > 0 ? 'green' : 'red'} size="small">
                      {option.totalStock || 0}
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>
            
            {conversionOptionsData.length === 0 && (
              <Alert
                type="warning"
                size="small"
                className="mt-2"
                message="No conversion options available"
                description="This alloy cannot be converted to different finishes"
              />
            )}
          </div>
        </Col>

        {/* Quantity & Settings */}
        <Col xs={24} md={7}>
          <Row gutter={[8, 8]}>
            <Col xs={12}>
              <div className="text-xs text-gray-500 mb-2">QUANTITY</div>
              <InputNumber
                min={1}
                max={sourceStock}
                value={quantity}
                onChange={setQuantity}
                className="w-full"
              />
            </Col>
            <Col xs={12}>
              <div className="text-xs text-gray-500 mb-2">
                PRIORITY
                <Tooltip title="Mark as urgent for high priority">
                  <InfoCircleOutlined className="ml-1 text-gray-400" />
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  size="small" 
                  checked={urgent} 
                  onChange={setUrgent} 
                />
                <span className="text-xs">{urgent ? 'Urgent' : 'Normal'}</span>
              </div>
            </Col>
          </Row>

          {quantity > sourceStock && (
            <Alert
              type="error"
              size="small"
              className="mt-2"
              message={`Insufficient stock (${sourceStock} available)`}
            />
          )}
        </Col>
      </Row>

      {/* Conversion Summary */}
      {selectedTargetFinish && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-green-800">
                <strong>✅ Conversion Plan Ready:</strong> Convert {quantity} units from {sourceAlloy.finish} to {selectedTargetFinish}
              </div>
              {urgent && (
                <Tag color="red" size="small">
                  URGENT
                </Tag>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default ConversionPlanItem