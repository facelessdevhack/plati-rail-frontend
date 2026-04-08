import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Image,
  Tag,
  Space,
  message,
  Modal,
  Spin,
  Alert,
  Row,
  Col,
  Typography,
  Divider,
  Upload,
  InputNumber,
  Descriptions
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  PhoneOutlined,
  MailOutlined,
  CarOutlined,
  CreditCardOutlined,
  ShopOutlined,
  CalendarOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons'
import { warrantyOTPClient, warrantyService } from './services/warrantyService'
import { useDispatch, useSelector } from 'react-redux'
import {
  getAllPcd,
  getAllFinishes,
  getAllSizes,
  getAllHoles,
  getAllModels,
  getAllWidths,
  getAllCbs,
  getAllOffsets
} from '../../redux/api/stockAPI'
import CustomSelect from '../../Core/Components/CustomSelect'
import PlatiFormStyles from '../../Core/Components/FormStyles'
import moment from 'moment'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const DealerWarrantyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState(null)
  const [otpModalVisible, setOtpModalVisible] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [activeFormTab, setActiveFormTab] = useState('customer')
  const [previewTitle, setPreviewTitle] = useState('')

  // Get dropdown options from Redux store
  const {
    allPcd,
    allFinishes,
    allSizes,
    allHoles,
    allModels,
    allWidths,
    allCbs,
    allOffsets
  } = useSelector(state => state.stockDetails)

  // Helper function to get display name from dropdown options
  const getDisplayName = (options, value) => {
    if (!options || !value) return 'N/A'
    const option = options.find(opt => opt.value === value)
    return option ? option.label : value
  }

  // Fetch warranty details
  const fetchWarrantyDetails = async () => {
    setLoading(true)
    try {
      const response = await warrantyService.getProductRegistrationById(id)

      if (response.success) {
        console.log('response', response)
        const warrantyData = response.data
        setData(warrantyData)

        // Populate form with existing data - map API fields (camelCase) to form fields
        const formData = {
          id: warrantyData.id || '',
          // Customer Information (API uses camelCase)
          customerName: warrantyData.customerName || '',
          mobileNo: warrantyData.mobileNo || '',
          emailAddress: warrantyData.emailAddress || '',

          // Warranty Card Information
          warrantyCardNo: warrantyData.warrantyCardNo || '',
          registerStatus: warrantyData.registerStatus || 'Draft',

          // Product Information
          productType: warrantyData.productType || '',

          // Alloy-specific fields
          inchesId: warrantyData.inchesId || null,
          pcdId: warrantyData.pcdId || null,
          holesId: warrantyData.holesId || null,
          finishId: warrantyData.finishId || null,
          alloyModel: warrantyData.alloyModel || null,
          noOfAlloys: warrantyData.noOfAlloys || null,
          cbId: warrantyData.cbId || null,
          offsetId: warrantyData.offsetId || null,
          widthId: warrantyData.widthId || null,

          // Tyre-specific fields
          patternId: warrantyData.patternId || null,
          profileId: warrantyData.profileId || null,
          sizeId: warrantyData.sizeId || null,
          noOfTyres: warrantyData.noOfTyres || null,

          // Purchase Information
          dop: warrantyData.dop ? moment(warrantyData.dop) : null,
          amount: warrantyData.amount || null,
          meterReading: warrantyData.meterReading || null,

          // Vehicle Details
          vehicleNo: warrantyData.vehicleNo || '',
          vehicleModel: warrantyData.vehicleModel || '',

          // Additional fields from API response
          registerType: warrantyData.registerType || '',
          otp: warrantyData.otp || '',
          otpDate: warrantyData.otpDate || '',
          otpVerified: warrantyData.otpVerified || '',
          otpVerifiedDate: warrantyData.otpVerifiedDate || '',

          // Images and documents
          warrantyCardImage: warrantyData.warrantyCardImage || '',
          invoiceImage: warrantyData.invoiceImage || '',
          vehicleImage: warrantyData.vehicleImage || '',
          productSpecification: warrantyData.productSpecification || '',

          // Additional fields
          enteredAt: warrantyData.enteredAt || '',
          enteredBy: warrantyData.enteredBy || null,
          enteredDateGmt: warrantyData.enteredDateGmt || '',
          dealerId: warrantyData.dealerId || null,
          dealerName: warrantyData.dealerName || '',

          // Master data names
          inchesName: warrantyData.inchesName || '',
          pcdName: warrantyData.pcdName || '',
          holesName: warrantyData.holesName || '',
          finishName: warrantyData.finishName || '',
          alloyModelName: warrantyData.alloyModelName || ''
        }

        // Set form values and force update
        form.setFieldsValue(formData)

        // Force form to re-render with new values
        form.validateFields().catch(() => {
          // Ignore validation errors during initial load
        })

        console.log('Form prefilled with data:', formData)
      } else {
        message.error(response.message || 'Failed to fetch warranty details')
      }
    } catch (error) {
      console.error('Error fetching warranty details:', error)
      message.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch dropdown options on component mount
  useEffect(() => {
    dispatch(getAllPcd({}))
    dispatch(getAllFinishes({}))
    dispatch(getAllSizes({}))
    dispatch(getAllHoles({}))
    dispatch(getAllModels({}))
    dispatch(getAllWidths({}))
    dispatch(getAllCbs({}))
    dispatch(getAllOffsets({}))
  }, [dispatch])

  useEffect(() => {
    if (id) {
      // Reset form before fetching new data
      form.resetFields()
      fetchWarrantyDetails()
    }
  }, [id, form])

  // Additional effect to ensure form updates when data changes
  useEffect(() => {
    if (data) {
      const formData = {
        // Customer Information (camelCase from API)
        id: data.id || '',
        customerName: data.customerName || '',
        mobileNo: data.mobileNo || '',
        emailAddress: data.emailAddress || '',

        // Warranty Card Information
        warrantyCardNo: data.warrantyCardNo || '',
        registerStatus: data.registerStatus || 'Draft',

        // Product Information
        productType: data.productType || '',

        // Alloy-specific fields
        inchesId: data.inchesId || null,
        pcdId: data.pcdId || null,
        holesId: data.holesId || null,
        finishId: data.finishId || null,
        alloyModel: data.alloyModel || null,
        noOfAlloys: data.noOfAlloys || null,
        cbId: data.cbId || null,
        offsetId: data.offsetId || null,
        widthId: data.widthId || null,

        // Tyre-specific fields
        patternId: data.patternId || null,
        profileId: data.profileId || null,
        sizeId: data.sizeId || null,
        noOfTyres: data.noOfTyres || null,

        // Purchase Information
        dop: data.dop ? moment(data.dop) : null,
        amount: data.amount || null,
        meterReading: data.meterReading || null,

        // Vehicle Details
        vehicleNo: data.vehicleNo || '',
        vehicleModel: data.vehicleModel || ''
      }

      form.setFieldsValue(formData)
    }
  }, [data, form])

  // Handle form submission
  const handleSave = async values => {
    console.log('🔥 handleSave called with values:', values)

    console.log('Step 1: Setting saving state')
    setSaving(true)

    try {
      console.log('Step 2: Entering try block')
      console.log('Form values received:', values)
      console.log('Form ID for update:', id)

      // Check if id exists
      if (!id) {
        console.error('❌ ID is missing!')
        alert('Error: ID is missing!')
        message.error('Error: Record ID is missing')
        return
      }

      console.log('Step 3: Preparing data for API - Converting to snake_case')

      // Prepare data for API - convert to snake_case format
      let updateData
      try {
        // Convert all camelCase fields to snake_case for API
        updateData = {
          // Customer Information
          mobile_no: values.mobileNo ? String(values.mobileNo).trim() : null,
          email_address: values.emailAddress || null,

          // Warranty Card Information
          warranty_card_no: values.warrantyCardNo || null,
          register_status: values.registerStatus || null,

          // Product Information
          product_type: values.productType || null,

          // Alloy-specific fields
          inches_id: values.inchesId || null,
          pcd_id: values.pcdId || null,
          holes_id: values.holesId || null,
          finish_id: values.finishId || null,
          alloy_model: values.alloyModel || null,
          no_of_alloys: values.noOfAlloys || null,
          cb_id: values.cbId || null,
          offset_id: values.offsetId || null,
          width_id: values.widthId || null,

          // Tyre-specific fields
          pattern_id: values.patternId || null,
          profile_id: values.profileId || null,
          size_id: values.sizeId || null,
          no_of_tyres: values.noOfTyres || null,

          // Purchase Information
          dop: values.dop ? values.dop.format('YYYY-MM-DD') : null,
          amount: values.amount || null,
          meter_reading: values.meterReading || null,

          // Vehicle Details
          vehicle_no: values.vehicleNo || null,
          vehicle_model: values.vehicleModel || null,

          // Additional fields
          notes: values.notes || null
        }

        // Remove null values to avoid sending unnecessary data
        Object.keys(updateData).forEach(key => {
          if (
            updateData[key] === null ||
            updateData[key] === undefined ||
            updateData[key] === ''
          ) {
            delete updateData[key]
          }
        })

        console.log('Step 3a: Data converted to snake_case:', updateData)
      } catch (dateError) {
        console.error('❌ Error preparing data:', dateError)
        alert('Error preparing data: ' + dateError.message)
        message.error('Error preparing data')
        return
      }

      console.log('Step 4: Data preparation completed')
      console.log('Step 5: Ready to send to API')

      console.log('Step 6: Final data prepared for API:', updateData)
      console.log('API endpoint will be:', `/warranty/registrations/${id}`)

      console.log('Step 7: About to make API call')

      const response = await warrantyService.updateProductRegistration(
        id,
        updateData
      )

      console.log('Step 8: API call completed')
      console.log('API Response:', response)

      if (response && response.success) {
        message.success('Warranty details updated successfully')
        fetchWarrantyDetails() // Refresh data
      } else if (response && response.message) {
        message.error(response.message || 'Failed to update warranty details')
        console.error('API Error:', response)
      } else {
        message.error('Failed to update warranty details - Invalid response')
        console.error('Invalid API Response:', response)
      }
    } catch (error) {
      console.error('❌ Error in handleSave:', error)
      console.error('Error details:', error.response?.data || error.message)

      // Show more specific error messages
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else if (error.message) {
        message.error(`Network Error: ${error.message}`)
      } else {
        message.error('Failed to update warranty details')
      }
    } finally {
      console.log('Step 9: Setting saving state to false')
      setSaving(false)
    }
  }

  // Handle OTP sending
  const handleSendOtp = async () => {
    if (!data?.mobileNo) {
      message.error('Mobile number not found')
      return
    }
    console.log('data', data)
    setSendingOtp(true)
    try {
      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()

      const updateOTP = await warrantyOTPClient.updateOtp(id, otp)
      console.log('updateOTP', updateOTP)
      if (updateOTP === 1) {
        message.success('OTP updated successfully')
        setOtpModalVisible(false)
        const response = await warrantyOTPClient.sendOtpVerification({
          otp,
          mobileNumber: data.mobileNo
        })
        if (response.success) {
          message.success('OTP sent successfully to registered mobile number')
          setOtpModalVisible(true)
        } else {
          message.error(response.message || 'Failed to send OTP')
        }
      } else {
        message.error(updateOTP.message || 'Failed to update OTP')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      message.error('Failed to send OTP. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      message.error('Please enter a valid 6-digit OTP')
      return
    }

    if (!data?.mobileNo) {
      message.error('Mobile number not found')
      return
    }

    setVerifyingOtp(true)
    try {
      console.log('🔐 Verifying OTP with params:', {
        id: +id,
        otp: otpCode
      })

      const response = await warrantyService.verifyOtp({
        id: +id,
        otp: otpCode
      })

      console.log('🔐 OTP Verification Response:', response)
      console.log('🔐 Response success:', response?.success)
      console.log('🔐 Response structure:', Object.keys(response || {}))

      // Check different possible response structures
      if (
        response &&
        (response.status === 200 || response.success === 1 || response === 1)
      ) {
        console.log('✅ OTP verification successful')
        message.success('OTP verified successfully')
        setOtpModalVisible(false)
        setOtpCode('')
        fetchWarrantyDetails() // Refresh data
      } else {
        console.log('❌ OTP verification failed:', response)
        message.error(response?.message || 'Invalid OTP. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error verifying OTP:', error)
      console.error('❌ Error response:', error.response?.data)
      message.error('Failed to verify OTP. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  // Handle image preview
  const handlePreview = (imageUrl, title) => {
    setPreviewImage(imageUrl)
    setPreviewTitle(title)
    setPreviewVisible(true)
  }

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'verified':
        return 'green'
      case 'pending':
        return 'orange'
      case 'draft':
        return 'blue'
      case 'inactive':
      case 'rejected':
        return 'red'
      default:
        return 'default'
    }
  }

  const getOtpStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'green'
      case 'notverified':
        return 'red'
      default:
        return 'orange'
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-96'>
        <Spin size='large' />
      </div>
    )
  }

  if (!data) {
    return (
      <div className='flex justify-center items-center min-h-96'>
        <Alert
          message='Warranty Record Not Found'
          description="The warranty record you're looking for could not be found."
          type='error'
          showIcon
          action={
            <Button onClick={() => navigate('/dealer-warranty')}>
              Back to List
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Staff Wide Test', serif", fontSize: 42, fontWeight: 400, color: '#1a1a1a', margin: '0 0 8px', lineHeight: '30px' }}>
            Edit Warranty Registration
          </h1>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 500, color: '#1a1a1a', marginTop: 4 }}>
            Dealer - {data.dealerName || 'N/A'}
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(26,26,26,0.5)', marginTop: 2 }}>
            Warranty Card: {data.warrantyCardNo}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 8, alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 13px', borderRadius: 33554400, fontSize: 12,
            fontWeight: 400, fontFamily: "'Inter', sans-serif", lineHeight: '16px', color: '#1a1a1a',
            background: data.registerStatus === 'Active' || data.registerStatus === 'Verified' ? '#d9fae6' : data.registerStatus === 'Pending' ? '#fff7ed' : '#f3f3f5',
            border: `1px solid ${data.registerStatus === 'Active' || data.registerStatus === 'Verified' ? 'rgba(78,203,113,0.2)' : data.registerStatus === 'Pending' ? 'rgba(242,108,45,0.2)' : 'rgba(160,160,168,0.3)'}`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: data.registerStatus === 'Active' || data.registerStatus === 'Verified' ? '#4ecb71' : data.registerStatus === 'Pending' ? '#f26c2d' : '#9ca3af' }} />
            {data.registerStatus || 'Unknown'}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 13px', borderRadius: 33554400, fontSize: 12,
            fontWeight: 400, fontFamily: "'Inter', sans-serif", lineHeight: '16px', color: '#1a1a1a',
            background: data.otpVerified === 'NotVerified' ? '#fef2f2' : '#d9fae6',
            border: `1px solid ${data.otpVerified === 'NotVerified' ? 'rgba(229,62,62,0.2)' : 'rgba(78,203,113,0.2)'}`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: data.otpVerified === 'NotVerified' ? '#e53e3e' : '#4ecb71' }} />
            {data.otpVerified === 'NotVerified' ? 'OTP Pending' : 'OTP Verified'}
          </span>
          {data.otpVerified === 'NotVerified' && (
            <button onClick={handleSendOtp} disabled={sendingOtp} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f26c2d', border: 'none', borderRadius: 123,
              padding: '6px 16px', fontSize: 14, fontWeight: 500,
              fontFamily: "'Inter', sans-serif", color: 'white',
              cursor: 'pointer', height: 32,
            }}>
              <SendOutlined style={{ fontSize: 14 }} /> {sendingOtp ? 'Sending...' : 'Send OTP'}
            </button>
          )}
          <button onClick={() => navigate('/dealer-warranty')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#f3f3f5', border: 'none', borderRadius: 123,
            padding: '6px 16px', fontSize: 14, fontWeight: 400,
            fontFamily: "'Inter', sans-serif", color: '#1a1a1a',
            cursor: 'pointer', height: 32,
          }}>
            <ArrowLeftOutlined style={{ fontSize: 14 }} /> Back to List
          </button>
        </div>
      </div>

      {/* Tabs */}
      {(() => {
        const FORM_TABS = [
          { key: 'customer', label: 'Customer & Warranty' },
          { key: 'product', label: 'Product Information' },
          { key: 'purchase', label: 'Purchase & Vehicle' },
          { key: 'images', label: 'Images & Documents' },
        ]

        return (
          <>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #a0a0a8', marginBottom: 16 }}>
              {FORM_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFormTab(tab.key)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: activeFormTab === tab.key ? '2px solid #f55e34' : '1px solid transparent',
                    marginBottom: -1, padding: '12px 24px',
                    fontFamily: "'Inter', sans-serif", fontSize: 16,
                    fontWeight: activeFormTab === tab.key ? 600 : 400,
                    color: '#1a1a1a', cursor: 'pointer',
                    whiteSpace: 'nowrap', lineHeight: '24px',
                  }}
                >{tab.label}</button>
              ))}
            </div>

            <PlatiFormStyles />
            <div className="plati-form" style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, padding: 32, boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' }}>
              <Form form={form} layout='vertical'>

                {/* ─── TAB: Customer & Warranty ─── */}
                {activeFormTab === 'customer' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <h3 className="plati-form-section-title">
                        <UserOutlined style={{ color: '#4a90ff' }} /> Customer Information
                      </h3>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item label='Customer Name'>
                            <Input value={data?.customerName || ''} disabled style={{ background: '#f9fafb', borderRadius: 12 }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label='Mobile Number' name='mobileNo' rules={[{ required: true, message: 'Required' }, { pattern: /^[0-9]{10}$/, message: '10 digits required' }]}>
                            <Input placeholder='Enter 10-digit mobile' maxLength={10} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label='Email Address' name='emailAddress' rules={[{ type: 'email', message: 'Invalid email' }]}>
                            <Input placeholder='Enter email' />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <Divider style={{ margin: 0 }} />

                    <div>
                      <h3 className="plati-form-section-title">
                        <CreditCardOutlined style={{ color: '#4a90ff' }} /> Warranty Card Information
                      </h3>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item label='Warranty Card Number' name='warrantyCardNo' rules={[{ required: true, message: 'Required' }]}>
                            <Input placeholder='Enter warranty card number' />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label='Registration Status' name='registerStatus' rules={[{ required: true, message: 'Required' }]}>
                            <Select placeholder='Select status'>
                              <Option value='Draft'>Draft</Option>
                              <Option value='Active'>Active</Option>
                              <Option value='Pending'>Pending</Option>
                              <Option value='Verified'>Verified</Option>
                              <Option value='Inactive'>Inactive</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  </div>
                )}

                {/* ─── TAB: Product Information ─── */}
                {activeFormTab === 'product' && (
                  <div>
                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 }}>
                      Product Information
                    </h3>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item label='Product Type' name='productType' rules={[{ required: true, message: 'Required' }]}>
                          <Select placeholder='Select type'><Option value='Alloy'>Alloy Wheels</Option><Option value='Tyre'>Tyres</Option></Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label='Wheel Size (Inches)' name='inchesId'>
                          <CustomSelect showSearch className='w-full' options={allSizes || []} placeholder='Select size' allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label='PCD' name='pcdId'>
                          <CustomSelect showSearch className='w-full' options={allPcd || []} placeholder='Select PCD' allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label='Number of Holes' name='holesId'>
                          <CustomSelect showSearch className='w-full' options={allHoles || []} placeholder='Select holes' allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label='Finish Type' name='finishId'>
                          <CustomSelect showSearch className='w-full' options={allFinishes || []} placeholder='Select finish' allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label='Alloy Model' name='alloyModel'>
                          <CustomSelect showSearch className='w-full' options={allModels || []} placeholder='Select model' allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label='Number of Alloys' name='noOfAlloys'>
                          <InputNumber placeholder='Qty' style={{ width: '100%' }} min={1} max={10} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label='Center Bore (CB)' name='cbId'>
                          <CustomSelect showSearch className='w-full' options={allCbs || []} placeholder='Select CB' allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label='Offset' name='offsetId'>
                          <CustomSelect showSearch className='w-full' options={allOffsets || []} placeholder='Select offset' allowClear />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label='Width' name='widthId'>
                          <CustomSelect showSearch className='w-full' options={allWidths || []} placeholder='Select width' allowClear />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* ─── TAB: Purchase & Vehicle ─── */}
                {activeFormTab === 'purchase' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <h3 className="plati-form-section-title">
                        <CalendarOutlined style={{ color: '#4a90ff' }} /> Purchase Information
                      </h3>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item label='Date of Purchase' name='dop' rules={[{ required: true, message: 'Required' }]}>
                            <DatePicker style={{ width: '100%', borderRadius: 12 }} format='DD/MM/YYYY' placeholder='Select date' />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label='Amount' name='amount'>
                            <InputNumber placeholder='Enter amount' style={{ width: '100%' }} min={0} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/₹\s?|(,*)/g, '')} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label='Meter Reading' name='meterReading'>
                            <InputNumber placeholder='Enter reading' style={{ width: '100%' }} min={0} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <Divider style={{ margin: 0 }} />

                    <div>
                      <h3 className="plati-form-section-title">
                        <CarOutlined style={{ color: '#4a90ff' }} /> Vehicle Details
                      </h3>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item label='Vehicle Number' name='vehicleNo' rules={[{ required: true, message: 'Required' }]}>
                            <Input placeholder='Enter vehicle number' />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label='Vehicle Model' name='vehicleModel'>
                            <Input placeholder='Enter vehicle model' />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>

                    <Divider style={{ margin: 0 }} />

                    <div>
                      <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 }}>Additional Notes</h3>
                      <Form.Item label='Notes' name='notes'>
                        <TextArea rows={4} placeholder='Enter any additional notes...' />
                      </Form.Item>
                    </div>
                  </div>
                )}

                {/* ─── TAB: Images & Documents ─── */}
                {activeFormTab === 'images' && (
                  <div>
                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 }}>Images & Documents</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Vehicle Image</div>
                        {data.vehicleImage ? (
                          <div style={{ cursor: 'pointer', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e5e5' }} onClick={() => handlePreview(data.vehicleImage, `Vehicle - ${data.vehicleNo}`)}>
                            <img src={data.vehicleImage} alt='Vehicle' style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                          </div>
                        ) : (
                          <div style={{ height: 200, background: '#f3f3f5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>No vehicle image</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Warranty Card Image</div>
                        {data.warrantyCardImage ? (
                          <div style={{ cursor: 'pointer', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e5e5' }} onClick={() => handlePreview(data.warrantyCardImage, `Warranty Card - ${data.warrantyCardNo}`)}>
                            <img src={data.warrantyCardImage} alt='Warranty Card' style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                          </div>
                        ) : (
                          <div style={{ height: 200, background: '#f3f3f5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>No warranty card image</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 24, borderTop: '1px solid #e5e5e5', marginTop: 24 }}>
                  <button onClick={() => navigate('/dealer-warranty')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f3f3f5', border: 'none', borderRadius: 123, padding: '10px 24px', fontSize: 14, fontWeight: 400, fontFamily: "'Inter', sans-serif", color: '#1a1a1a', cursor: 'pointer' }}>Cancel</button>
                  <button disabled={saving} onClick={async () => { try { const values = await form.validateFields(); await handleSave(values) } catch (error) { message.error('Please fill in all required fields') } }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4a90ff', border: 'none', borderRadius: 123, padding: '10px 24px', fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", color: 'white', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.5 : 1 }}>
                    <SaveOutlined style={{ fontSize: 14 }} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </Form>
            </div>
          </>
        )
      })()}


      {/* OTP Verification Modal */}
      <Modal
        title={
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
              <SendOutlined className='text-blue-600' />
            </div>
            <span>OTP Verification</span>
          </div>
        }
        open={otpModalVisible}
        onCancel={() => {
          setOtpModalVisible(false)
          setOtpCode('')
        }}
        footer={null}
        centered
        width={450}
      >
        <div className='py-4'>
          <Alert
            message='OTP sent to registered mobile number'
            description={`Please enter the 6-digit OTP sent to ${data.mobileNo}`}
            type='info'
            showIcon
            className='mb-6'
          />

          <div className='space-y-4'>
            <div>
              <Text strong>Enter OTP Code:</Text>
              <Input
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder='Enter 6-digit OTP'
                maxLength={6}
                size='large'
                className='mt-2'
                style={{
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                  fontSize: '18px'
                }}
              />
            </div>

            <div className='flex justify-between items-center pt-4'>
              <Button onClick={handleSendOtp} loading={sendingOtp} type='link'>
                Resend OTP
              </Button>

              <Space>
                <Button
                  onClick={() => {
                    setOtpModalVisible(false)
                    setOtpCode('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type='primary'
                  onClick={handleVerifyOtp}
                  loading={verifyingOtp}
                  disabled={!otpCode || otpCode.length !== 6}
                  icon={<CheckCircleOutlined />}
                >
                  Verify OTP
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={<span style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>{previewTitle}</span>}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={540}
        centered
        styles={{ body: { padding: '24px 32px 32px' } }}
      >
        <div style={{ background: '#f3f3f5', borderRadius: 16, overflow: 'hidden' }}>
          <img alt='preview' style={{ width: '100%', display: 'block', borderRadius: 16, objectFit: 'contain' }} src={previewImage} />
        </div>
      </Modal>
    </div>
  )
}

export default DealerWarrantyDetail
