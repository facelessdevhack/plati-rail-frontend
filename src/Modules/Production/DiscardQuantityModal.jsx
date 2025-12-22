
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
  Tag
} from 'antd'
import { UploadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input

const DiscardQuantityModal = ({ visible, onCancel, onSuccess, rejectionRecord }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [discardQty, setDiscardQty] = useState(1)

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        quantity: 1,
        reason: ''
      })
      setFileList([])
      setDiscardQty(1)
    }
  }, [visible, form])

  const handleUpload = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const response = await client.post('/upload/storej', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // The API returns the path as a string (e.g. "/temp/filename.jpg")
      const photoUrl = response.data
      const newFile = {
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: photoUrl,
        thumbUrl: photoUrl
      }

      setFileList(prev => [...prev, newFile])
      message.success(`${file.name} uploaded successfully`)
      return false // Prevent default antd upload
    } catch (error) {
      console.error('Upload error:', error)
      message.error(`${file.name} upload failed`)
      return Upload.LIST_IGNORE
    } finally {
      setUploading(false)
    }
  }

  const onFinish = async (values) => {
    // Validation: 1 photo per quantity
    if (fileList.length < values.quantity) {
      message.warning(`Please upload at least ${values.quantity} photos (one for each item discarded)`)
      return
    }

    setLoading(true)
    try {
      const photoUrls = fileList.map(file => file.url)
      
      const response = await client.post('/production/rejected-stock/discard-request', {
        rejectionId: rejectionRecord.rejectionId,
        quantity: values.quantity,
        reason: values.reason,
        photoUrls: photoUrls
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
          <Tag color="volcano">Rejected Stock</Tag>
        </Space>
      }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      maskClosable={false}
    >
      {rejectionRecord && (
        <div style={{ marginBottom: '20px' }}>
          <Alert
            message={
              <Space direction="vertical" size={0}>
                <Text strong>{rejectionRecord.alloyName}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {rejectionRecord.finishName} | Job Card #{rejectionRecord.jobCardId}
                </Text>
              </Space>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ quantity: 1 }}
      >
        <Form.Item
          label="Quantity to Discard"
          name="quantity"
          rules={[
            { required: true, message: 'Please enter quantity' },
            { 
              type: 'number', 
              min: 1, 
              max: rejectionRecord?.rejectedQuantity || 1,
              message: `Max available: ${rejectionRecord?.rejectedQuantity || 1}` 
            }
          ]}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            size="large"
            onChange={val => setDiscardQty(val || 1)}
          />
        </Form.Item>

        <Form.Item
          label="Discard Reason"
          name="reason"
          rules={[{ required: true, message: 'Please provide a reason' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="Describe why these items are being discarded..." 
          />
        </Form.Item>

        <Divider orientation="left" style={{ marginTop: 0 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>Photo Documentation</Text>
        </Divider>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>Evidence Photos</Text>
            <Text type={fileList.length < discardQty ? "danger" : "success"}>
              {fileList.length} / {discardQty} photos uploaded
            </Text>
          </div>
          
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={handleUpload}
            onRemove={file => {
              setFileList(prev => prev.filter(item => item.uid !== file.uid))
            }}
            multiple
          >
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <InfoCircleOutlined style={{ marginRight: '4px' }} />
            You must upload at least one distinct photo for each discarded item.
          </Text>
        </div>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button 
               type="primary" 
               htmlType="submit" 
               loading={loading || uploading}
               danger
            >
              Submit Discard Request
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default DiscardQuantityModal
