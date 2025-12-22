
import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Upload,
  Button,
  message,
  Typography,
  Space,
  Alert,
  Divider,
  Tag,
  Descriptions,
  Card,
  Row,
  Col,
  Empty
} from 'antd'
import { UploadOutlined, InfoCircleOutlined, PictureOutlined, DeleteOutlined } from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'
import moment from 'moment'

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input

const DiscardQuantityModal = ({ visible, onCancel, onSuccess, rejectionRecord }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [uploadingSlots, setUploadingSlots] = useState({}) // track loading per slot
  const [itemPhotos, setItemPhotos] = useState([]) // array of strings (urls)
  const [discardQty, setDiscardQty] = useState(1)

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        quantity: 1,
        reason: ''
      })
      setItemPhotos([null]) // initial 1 slot
      setDiscardQty(1)
      setUploadingSlots({})
    }
  }, [visible, form])

  // Adjust slots when quantity changes
  const handleQuantityChange = (val) => {
    const qty = val || 1
    setDiscardQty(qty)
    setItemPhotos(prev => {
      const newPhotos = [...prev]
      if (qty > newPhotos.length) {
        // Add slots
        for (let i = newPhotos.length; i < qty; i++) {
          newPhotos.push(null)
        }
      } else if (qty < newPhotos.length) {
        // Remove slots
        return newPhotos.slice(0, qty)
      }
      return newPhotos
    })
  }

  const handleUpload = async (file, index) => {
    const formData = new FormData()
    formData.append('file', file)

    setUploadingSlots(prev => ({ ...prev, [index]: true }))
    try {
      const response = await client.post('/upload/storej', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const photoUrl = response.data
      setItemPhotos(prev => {
        const next = [...prev]
        next[index] = photoUrl
        return next
      })
      message.success(`Photo for item ${index + 1} uploaded`)
      return false
    } catch (error) {
      console.error('Upload error:', error)
      message.error(`Upload failed for item ${index + 1}`)
      return Upload.LIST_IGNORE
    } finally {
      setUploadingSlots(prev => ({ ...prev, [index]: false }))
    }
  }

  const removePhoto = (index) => {
    setItemPhotos(prev => {
      const next = [...prev]
      next[index] = null
      return next
    })
  }

  const onFinish = async (values) => {
    // Validation: 1 photo per quantity
    const missingPhotos = itemPhotos.some(photo => !photo)
    if (missingPhotos) {
      message.warning(`Please upload a photo for every item (Total: ${values.quantity})`)
      return
    }

    setLoading(true)
    try {
      const response = await client.post('/production/rejected-stock/discard-request', {
        rejectionId: rejectionRecord.rejectionId,
        quantity: values.quantity,
        reason: values.reason,
        photoUrls: itemPhotos
      })

      if (response.data.success) {
        message.success(response.data.message)
        onSuccess()
        onCancel()
      }
    } catch (error) {
      console.error('Discard request error:', error)
      message.error(error.response?.data?.message || 'Failed to submit discard request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={
        <Space>
          <Text strong style={{ fontSize: '18px' }}>Request Discard</Text>
          <Tag color="volcano">Resolution Workflow</Tag>
        </Space>
      }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={750}
      maskClosable={false}
      bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
    >
      {rejectionRecord && (
        <Card size="small" className="bg-gray-50 mb-6" bordered={false}>
          <Descriptions title="Rejected Entry Details" bordered size="small" column={2}>
            <Descriptions.Item label="Alloy">{rejectionRecord.alloyName}</Descriptions.Item>
            <Descriptions.Item label="Finish">{rejectionRecord.finishName}</Descriptions.Item>
            <Descriptions.Item label="Job Card">#{rejectionRecord.jobCardId}</Descriptions.Item>
            <Descriptions.Item label="Rejected Qty">
               <Tag color="red">{rejectionRecord.rejectedQuantity}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Rejection Date">
                {moment(rejectionRecord.rejectionDate).format('DD-MM-YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Reported By">
                {rejectionRecord.createdByFirstName} {rejectionRecord.createdByLastName}
            </Descriptions.Item>
            <Descriptions.Item label="Rejection Reason" span={2}>
                {rejectionRecord.rejectionReason || 'No reason provided'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ quantity: 1 }}
      >
        <Row gutter={16}>
            <Col span={8}>
                <Form.Item
                label="Qty to Discard"
                name="quantity"
                rules={[
                    { required: true, message: 'Required' },
                    { 
                    type: 'number', 
                    min: 1, 
                    max: Math.min(rejectionRecord?.rejectedQuantity || 1, 9),
                    message: `Max: ${Math.min(rejectionRecord?.rejectedQuantity || 1, 9)}` 
                    }
                ]}
                >
                <InputNumber 
                    style={{ width: '100%' }} 
                    size="large"
                    max={9}
                    onChange={handleQuantityChange}
                />
                </Form.Item>
            </Col>
            <Col span={16}>
                <Form.Item
                label="Discard Reason"
                name="reason"
                rules={[{ required: true, message: 'Please provide a reason' }]}
                >
                <Input 
                    placeholder="Briefly explain why this stock is being discarded..." 
                    size="large"
                />
                </Form.Item>
            </Col>
        </Row>

        <Divider orientation="left" style={{ margin: '10px 0 20px 0' }}>
          <Space>
            <PictureOutlined />
            <Text strong>Required Photos ({discardQty})</Text>
          </Space>
        </Divider>

        <div style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            {itemPhotos.map((photo, index) => (
              <Col span={8} key={index}>
                <Card 
                    size="small" 
                    title={`Item ${index + 1}`} 
                    bodyStyle={{ padding: '8px', textAlign: 'center' }}
                    className={!photo ? "border-dashed" : ""}
                >
                    {photo ? (
                        <div style={{ position: 'relative' }}>
                            <img 
                                src={photo} 
                                alt={`Item ${index + 1}`} 
                                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} 
                            />
                            <Button 
                                type="primary" 
                                danger 
                                shape="circle" 
                                icon={<DeleteOutlined />} 
                                size="small"
                                style={{ position: 'absolute', top: '5px', right: '5px' }}
                                onClick={() => removePhoto(index)}
                            />
                        </div>
                    ) : (
                        <Upload
                            listType="picture-card"
                            showUploadList={false}
                            beforeUpload={(file) => handleUpload(file, index)}
                            disabled={uploadingSlots[index]}
                        >
                            <div style={{ padding: '20px 0' }}>
                                {uploadingSlots[index] ? <Text>Uploading...</Text> : (
                                    <>
                                        <UploadOutlined />
                                        <div style={{ marginTop: 8 }}>Upload Photo</div>
                                    </>
                                )}
                            </div>
                        </Upload>
                    )}
                </Card>
              </Col>
            ))}
          </Row>
          
          <div style={{ marginTop: '16px' }}>
            <Alert
                message="One distinct photo is required per discarded item for audit purposes."
                type="warning"
                showIcon
                size="small"
            />
          </div>
        </div>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button 
               type="primary" 
               htmlType="submit" 
               loading={loading}
               danger
               icon={<DeleteOutlined />}
            >
              Confirm Discard Request
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default DiscardQuantityModal
