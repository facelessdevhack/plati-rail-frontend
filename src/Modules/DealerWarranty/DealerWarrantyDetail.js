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
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dealer-warranty')}
              size='large'
            >
              Back to List
            </Button>
            <div>
              <Title level={2} className='mb-0'>
                Edit Warranty Registration
              </Title>
              <Text type='secondary'>Warranty Card: {data.warrantyCardNo}</Text>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <Tag
              color={getStatusColor(data.register_status)}
              className='text-sm px-3 py-1'
            >
              {data.registerStatus || 'Unknown'}
            </Tag>
            <Tag
              color={getOtpStatusColor(data.otpVerified)}
              className='text-sm px-3 py-1'
            >
              {data.otpVerified === 'NotVerified'
                ? 'OTP Pending'
                : 'OTP Verified'}
            </Tag>

            {data.otpVerified === 'NotVerified' && (
              <Button
                type='primary'
                icon={<SendOutlined />}
                onClick={handleSendOtp}
                loading={sendingOtp}
                className='bg-orange-500 hover:bg-orange-600 border-orange-500'
              >
                Send OTP
              </Button>
            )}
          </div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Dealer Info (Read-only) */}
        <Col xs={24} lg={8}>
          {/* Dealer Information Card */}
          <Card
            className='mb-6 shadow-lg border-0 rounded-xl'
            title={
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-8 bg-purple-500 rounded-full'></div>
                <span className='text-lg font-semibold'>
                  Dealer Information
                </span>
                <Text type='secondary' className='text-sm'>
                  (Read-only)
                </Text>
              </div>
            }
            bordered={false}
          >
            <div className='p-4 bg-gray-50 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                  <ShopOutlined className='text-purple-600' />
                </div>
                <div>
                  <Text strong className='text-lg'>
                    {data.dealerName || 'Loading...'}
                  </Text>
                  <br />
                  <Text type='secondary' className='text-sm'>
                    Authorized Dealer
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Vehicle Information Card */}
          <Card
            className='mb-6 shadow-lg border-0 rounded-xl'
            title={
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-8 bg-green-500 rounded-full'></div>
                <span className='text-lg font-semibold'>Vehicle Images</span>
              </div>
            }
            bordered={false}
          >
            <div className='space-y-4'>
              {data.vehicleImage && (
                <div>
                  <Text strong>Vehicle Image:</Text>
                  <div
                    className='mt-2 cursor-pointer'
                    onClick={() =>
                      handlePreview(
                        data.vehicleImage,
                        `Vehicle - ${data.vehicleNo}`
                      )
                    }
                  >
                    <Image
                      width='100%'
                      height={150}
                      src={data.vehicleImage}
                      alt='Vehicle'
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                      preview={false}
                    />
                  </div>
                </div>
              )}

              {data.warrantyCardImage && (
                <div>
                  <Text strong>Warranty Card Image:</Text>
                  <div
                    className='mt-2 cursor-pointer'
                    onClick={() =>
                      handlePreview(
                        data.warrantyCardImage,
                        `Warranty Card - ${data.warrantyCardNo}`
                      )
                    }
                  >
                    <Image
                      width='100%'
                      height={150}
                      src={data.warrantyCardImage}
                      alt='Warranty Card'
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                      preview={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Right Column - Editable Form */}
        <Col xs={24} lg={16}>
          <Card
            className='shadow-lg border-0 rounded-xl'
            title={
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-8 bg-yellow-500 rounded-full'></div>
                <span className='text-lg font-semibold'>Warranty Details</span>
                <EditOutlined className='text-gray-500' />
              </div>
            }
            bordered={false}
          >
            <Form form={form} layout='vertical' className='space-y-6'>
              {/* Form Data Debug Info (Development only) */}
              {process.env.NODE_ENV === 'development' && data && (
                <div className='bg-yellow-100 p-4 rounded-lg mb-4 text-xs'>
                  <Text strong>Debug - API Response Sample:</Text>
                  <pre className='mt-2 whitespace-pre-wrap overflow-auto max-h-40'>
                    {JSON.stringify(
                      {
                        customerName: data.customerName,
                        mobileNo: data.mobileNo,
                        emailAddress: data.emailAddress,
                        warrantyCardNo: data.warrantyCardNo,
                        registerStatus: data.registerStatus,
                        productType: data.productType,
                        vehicleNo: data.vehicleNo,
                        dealerName: data.dealerName,
                        amount: data.amount,
                        otpVerified: data.otpVerified
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              {/* Customer Information Section - Mixed (Name read-only, Mobile editable) */}
              <div className='bg-blue-50 p-6 rounded-lg'>
                <Title
                  level={4}
                  className='text-blue-800 mb-4 flex items-center'
                >
                  <UserOutlined className='mr-2' />
                  Customer Information
                  {data && (
                    <Text type='secondary' className='ml-2 text-sm'>
                      ({data.customerName ? '✓ Data Loaded' : '⚠ No Data'})
                    </Text>
                  )}
                </Title>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item label='Customer Name'>
                      <Input
                        value={data?.customerName || 'Loading...'}
                        disabled
                        className='bg-gray-100'
                        suffix={
                          <Text type='secondary' className='text-xs'>
                            Read-only
                          </Text>
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Mobile Number'
                      name='mobileNo'
                      rules={[
                        {
                          required: true,
                          message: 'Please enter mobile number'
                        },
                        {
                          pattern: /^[0-9]{10}$/,
                          message: 'Mobile number must be exactly 10 digits'
                        }
                      ]}
                    >
                      <Input
                        placeholder='Enter 10-digit mobile number'
                        maxLength={10}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Email Address'
                      name='emailAddress'
                      rules={[
                        {
                          type: 'email',
                          message: 'Please enter a valid email address'
                        }
                      ]}
                    >
                      <Input placeholder='Enter email address' />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Warranty Card Section */}
              <div className='bg-indigo-50 p-6 rounded-lg'>
                <Title
                  level={4}
                  className='text-indigo-800 mb-4 flex items-center'
                >
                  <CreditCardOutlined className='mr-2' />
                  Warranty Card Information
                </Title>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Warranty Card Number'
                      name='warrantyCardNo'
                      rules={[
                        {
                          required: true,
                          message: 'Please enter warranty card number'
                        }
                      ]}
                    >
                      <Input placeholder='Enter warranty card number' />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Registration Status'
                      name='registerStatus'
                      rules={[
                        { required: true, message: 'Please select status' }
                      ]}
                    >
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

              {/* Product Information Section */}
              <div className='bg-green-50 p-6 rounded-lg'>
                <Title level={4} className='text-green-800 mb-4'>
                  Product Information
                </Title>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Product Type'
                      name='productType'
                      rules={[
                        {
                          required: true,
                          message: 'Please select product type'
                        }
                      ]}
                    >
                      <Select placeholder='Select product type'>
                        <Option value='Alloy'>Alloy Wheels</Option>
                        <Option value='Tyre'>Tyres</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* Alloy-specific fields */}
                  <Col xs={24} md={12}>
                    <Form.Item label='Wheel Size (Inches)' name='inchesId'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allSizes || []}
                        placeholder='Select wheel size'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='PCD (Pitch Circle Diameter)' name='pcdId'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allPcd || []}
                        placeholder='Select PCD'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Number of Holes' name='holesId'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allHoles || []}
                        placeholder='Select holes'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Finish Type' name='finishId'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allFinishes || []}
                        placeholder='Select finish'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Alloy Model' name='alloyModel'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allModels || []}
                        placeholder='Select model'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Number of Alloys' name='noOfAlloys'>
                      <InputNumber
                        placeholder='Enter number of alloys'
                        style={{ width: '100%' }}
                        min={1}
                        max={10}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Center Bore (CB)' name='cbId'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allCbs || []}
                        placeholder='Select center bore'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Offset' name='offsetId'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allOffsets || []}
                        placeholder='Select offset'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Width' name='widthId'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allWidths || []}
                        placeholder='Select width'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  {/* Tyre-specific fields */}
                  <Col xs={24} md={8}>
                    <Form.Item label='Tyre Pattern' name='patternId'>
                      <InputNumber
                        placeholder='Enter pattern ID'
                        style={{ width: '100%' }}
                        min={0}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Tyre Width' name='widthId'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allWidths || []}
                        placeholder='Select width'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Tyre Profile' name='profileId'>
                      <InputNumber
                        placeholder='Enter profile ID'
                        style={{ width: '100%' }}
                        min={0}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Tyre Size (Diameter)' name='sizeId'>
                      <CustomSelect
                        showSearch={true}
                        className='w-full'
                        options={allSizes || []}
                        placeholder='Select size'
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label='Number of Tyres' name='noOfTyres'>
                      <InputNumber
                        placeholder='Enter number of tyres'
                        style={{ width: '100%' }}
                        min={1}
                        max={10}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Purchase Information Section */}
              <div className='bg-yellow-50 p-6 rounded-lg'>
                <Title
                  level={4}
                  className='text-yellow-800 mb-4 flex items-center'
                >
                  <CalendarOutlined className='mr-2' />
                  Purchase Information
                </Title>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Date of Purchase'
                      name='dop'
                      rules={[
                        {
                          required: true,
                          message: 'Please select purchase date'
                        }
                      ]}
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        format='DD/MM/YYYY'
                        placeholder='Select purchase date'
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Amount'
                      name='amount'
                      rules={[
                        { required: false, message: 'Please enter amount' }
                      ]}
                    >
                      <InputNumber
                        placeholder='Enter amount'
                        style={{ width: '100%' }}
                        min={0}
                        formatter={value =>
                          `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        }
                        parser={value => value.replace(/₹\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label='Meter Reading' name='meterReading'>
                      <InputNumber
                        placeholder='Enter meter reading'
                        style={{ width: '100%' }}
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Vehicle Details Section */}
              <div className='bg-cyan-50 p-6 rounded-lg'>
                <Title
                  level={4}
                  className='text-cyan-800 mb-4 flex items-center'
                >
                  <CarOutlined className='mr-2' />
                  Vehicle Details
                </Title>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Vehicle Number'
                      name='vehicleNo'
                      rules={[
                        {
                          required: true,
                          message: 'Please enter vehicle number'
                        }
                      ]}
                    >
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

              {/* Notes Section */}
              <div className='bg-gray-50 p-6 rounded-lg'>
                <Title level={4} className='text-gray-800 mb-4'>
                  Additional Notes
                </Title>

                <Form.Item label='Notes' name='notes'>
                  <TextArea
                    rows={4}
                    placeholder='Enter any additional notes...'
                  />
                </Form.Item>
              </div>

              {/* Action Buttons */}
              <div className='flex justify-end space-x-4 pt-6 border-t'>
                <Button
                  size='large'
                  onClick={() => navigate('/dealer-warranty')}
                >
                  Cancel
                </Button>
                <Button
                  type='primary'
                  size='large'
                  loading={saving}
                  icon={<SaveOutlined />}
                  className='bg-blue-600 hover:bg-blue-700'
                  onClick={async () => {
                    console.log('💡 Save Changes button clicked!')
                    try {
                      // Validate form fields first
                      const values = await form.validateFields()
                      console.log('✅ Form validation passed:', values)

                      // Call handleSave with validated values
                      await handleSave(values)
                    } catch (error) {
                      console.error('❌ Form validation failed:', error)
                      message.error(
                        'Please fill in all required fields correctly'
                      )
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>

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
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width='80%'
        centered
      >
        <img alt='preview' style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  )
}

export default DealerWarrantyDetail
