import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Alert,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Divider,
  Tag,
  Tooltip,
  notification,
  Radio,
  Steps,
  Timeline,
  Avatar,
  Progress,
  Statistic,
  Badge,
  List,
  Empty,
  Spin,
  Descriptions,
  Switch,
  Segmented
} from 'antd'
import {
  PlayCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FireOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DragOutlined,
  SaveOutlined,
  MinusCircleOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  ToolOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  AppstoreOutlined,
  BarsOutlined,
  CalendarOutlined,
  TeamOutlined,
  AreaChartOutlined,
  NumberOutlined
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import moment from 'moment'

import {
  getProductionPlansWithQuantities,
  createJobCard,
  getStepPresets,
  getPresetDetails,
  getProductionSteps,
  addCustomStepsToProductionPlan
} from '../../redux/api/productionAPI'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

// Step icons mapping
const STEP_ICONS = {
  'Material Request': '📦',
  Painting: '🎨',
  Machining: '⚙️',
  'PVD Powder Coating': '🔧',
  'PVD Process': '⚡',
  Milling: '🏭',
  'Acrylic Coating': '💧',
  'Lacquer Finish': '✨',
  Packaging: '📋',
  'Quality Check': '🔍',
  Dispatch: '🚚'
}

// Step colors
const STEP_COLORS = [
  '#722ed1',
  '#eb2f96',
  '#faad14',
  '#fa8c16',
  '#a0d911',
  '#52c41a',
  '#13c2c2',
  '#1890ff',
  '#2f54eb',
  '#f5222d',
  '#389e0d'
]

const JobCardCreationModal = ({
  visible,
  onCancel,
  onSuccess,
  selectedPlan = null
}) => {
  const dispatch = useDispatch()
  const [form] = Form.useForm()

  // Redux state
  const { productionPlans = [], loading } = useSelector(
    state => state.productionDetails || {}
  )
  const { user } = useSelector(state => state.userDetails || {})

  // Local state
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [selectedProductionPlan, setSelectedProductionPlan] = useState(null)
  const [allocationInfo, setAllocationInfo] = useState({
    totalQuantity: 0,
    allocatedQuantity: 0,
    remainingQuantity: 0,
    completedQuantity: 0,
    percentage: 0
  })

  // Step management - Initialize with default preset
  const DEFAULT_PRESET = {
    id: 'default',
    name: 'Standard 11-Step Process',
    description: 'Complete manufacturing workflow',
    category: 'standard',
    stepCount: 11,
    isActive: true,
    steps: [
      {
        id: 1,
        name: 'Material Request',
        estimatedDuration: 2,
        estimatedDurationUnit: 'hours',
        stepOrder: 1,
        isRequired: true,
        icon: '📦'
      },
      {
        id: 2,
        name: 'Painting',
        estimatedDuration: 4,
        estimatedDurationUnit: 'hours',
        stepOrder: 2,
        isRequired: true,
        icon: '🎨'
      },
      {
        id: 3,
        name: 'Machining',
        estimatedDuration: 6,
        estimatedDurationUnit: 'hours',
        stepOrder: 3,
        isRequired: true,
        icon: '⚙️'
      },
      {
        id: 4,
        name: 'PVD Powder Coating',
        estimatedDuration: 3,
        estimatedDurationUnit: 'hours',
        stepOrder: 4,
        isRequired: true,
        icon: '🔧'
      },
      {
        id: 5,
        name: 'PVD Process',
        estimatedDuration: 5,
        estimatedDurationUnit: 'hours',
        stepOrder: 5,
        isRequired: true,
        icon: '⚡'
      },
      {
        id: 6,
        name: 'Milling',
        estimatedDuration: 4,
        estimatedDurationUnit: 'hours',
        stepOrder: 6,
        isRequired: true,
        icon: '🏭'
      },
      {
        id: 7,
        name: 'Acrylic Coating',
        estimatedDuration: 3,
        estimatedDurationUnit: 'hours',
        stepOrder: 7,
        isRequired: true,
        icon: '💧'
      },
      {
        id: 8,
        name: 'Lacquer Finish',
        estimatedDuration: 2,
        estimatedDurationUnit: 'hours',
        stepOrder: 8,
        isRequired: true,
        icon: '✨'
      },
      {
        id: 9,
        name: 'Packaging',
        estimatedDuration: 1,
        estimatedDurationUnit: 'hours',
        stepOrder: 9,
        isRequired: true,
        icon: '📋'
      },
      {
        id: 10,
        name: 'Quality Check',
        estimatedDuration: 2,
        estimatedDurationUnit: 'hours',
        stepOrder: 10,
        isRequired: true,
        icon: '🔍'
      },
      {
        id: 11,
        name: 'Dispatch',
        estimatedDuration: 1,
        estimatedDurationUnit: 'hours',
        stepOrder: 11,
        isRequired: true,
        icon: '🚚'
      }
    ]
  }

  const [stepPresets, setStepPresets] = useState([DEFAULT_PRESET])
  const [selectedPreset, setSelectedPreset] = useState(DEFAULT_PRESET)
  const [stepMode, setStepMode] = useState('preset')
  const [availableSteps, setAvailableSteps] = useState([])
  const [customSteps, setCustomSteps] = useState([])
  const [showReasonField, setShowReasonField] = useState(false)
  const [loadingPresets, setLoadingPresets] = useState(false)
  const [loadingSteps, setLoadingSteps] = useState(false)
  const [presetDetails, setPresetDetails] = useState([])
  const [loadingPresetDetails, setLoadingPresetDetails] = useState(false)

  // Load initial data
  useEffect(() => {
    if (visible) {
      dispatch(
        getProductionPlansWithQuantities({
          page: 1,
          limit: 100,
          status: 'active'
        })
      )
      loadStepPresets()
      loadAvailableSteps()
    }
  }, [visible, dispatch])

  // Set quantity when allocation info changes or step changes
  useEffect(() => {
    if (allocationInfo.remainingQuantity > 0 && visible && currentStep === 1) {
      // Always set the quantity when on step 1
      setTimeout(() => {
        const currentQuantity = form.getFieldValue('quantity')
        console.log('Current quantity in form:', currentQuantity)
        console.log(
          'Available remaining quantity:',
          allocationInfo.remainingQuantity
        )

        // Set the quantity if it's not set or if we just moved to this step
        if (
          !currentQuantity ||
          currentQuantity !== allocationInfo.remainingQuantity
        ) {
          form.setFieldsValue({
            quantity: allocationInfo.remainingQuantity
          })
          console.log('Setting quantity to:', allocationInfo.remainingQuantity)
        }
      }, 100) // Small delay to ensure form is ready
    }
  }, [allocationInfo.remainingQuantity, visible, currentStep, form])

  // Set selected plan if provided
  useEffect(() => {
    if (selectedPlan && visible) {
      console.log('Setting pre-selected plan:', selectedPlan)
      setSelectedProductionPlan(selectedPlan)

      const tracking = selectedPlan.quantityTracking || {}
      const allocInfo = {
        totalQuantity: selectedPlan.quantity || 0,
        allocatedQuantity: tracking.totalJobCardQuantity || 0,
        remainingQuantity:
          tracking.remainingQuantity || selectedPlan.quantity || 0,
        completedQuantity: tracking.completedQuantity || 0,
        percentage: selectedPlan.quantity
          ? Math.round(
              ((tracking.totalJobCardQuantity || 0) / selectedPlan.quantity) *
                100
            )
          : 0
      }
      setAllocationInfo(allocInfo)

      // Fetch preset details if production plan has a preset assigned
      if (selectedPlan.presetId) {
        const fetchPresetDetails = async () => {
          try {
            setLoadingPresetDetails(true)
            console.log('Fetching preset details for pre-selected plan presetId:', selectedPlan.presetId)
            const response = await dispatch(getPresetDetails({ presetId: selectedPlan.presetId })).unwrap()
            console.log('Preset details loaded for pre-selected plan:', response)
            setPresetDetails(response || [])
          } catch (error) {
            console.error('Error loading preset details for pre-selected plan:', error)
            setPresetDetails([])
          } finally {
            setLoadingPresetDetails(false)
          }
        }
        fetchPresetDetails()
      } else {
        // Clear preset details if no preset assigned
        setPresetDetails([])
      }

      // Set form values with a small delay to ensure form is ready
      setTimeout(() => {
        form.setFieldsValue({
          prodPlanId: selectedPlan.id,
          quantity:
            allocInfo.remainingQuantity > 0 ? allocInfo.remainingQuantity : 1,
          presetId: 'default'
        })
        console.log('Form values set for pre-selected plan:', {
          prodPlanId: selectedPlan.id,
          quantity:
            allocInfo.remainingQuantity > 0 ? allocInfo.remainingQuantity : 1
        })
      }, 100)
    }
  }, [selectedPlan, visible, form, dispatch])

  // Cleanup when modal closes
  useEffect(() => {
    if (!visible) {
      setPresetDetails([])
      setLoadingPresetDetails(false)
    }
  }, [visible])

  // Load step presets
  const loadStepPresets = async () => {
    setLoadingPresets(true)
    try {
      const result = await dispatch(getStepPresets()).unwrap()
      console.log('Step presets loaded:', result)

      // Handle different response structures
      let apiPresets = []
      if (Array.isArray(result)) {
        apiPresets = result
      } else if (result.data && Array.isArray(result.data)) {
        apiPresets = result.data
      } else if (result.presets && Array.isArray(result.presets)) {
        apiPresets = result.presets
      }

      const formattedPresets = apiPresets.map(preset => ({
        id: preset.presetName || preset.name,
        name: preset.presetName || preset.name,
        description:
          preset.presetDescription || preset.description || 'No description',
        category: preset.category || preset.presetCategory || 'standard',
        stepCount: preset.stepCount || preset.steps?.length || 0,
        isActive: preset.isActive !== false,
        steps: preset.steps || [], // Keep original steps if available
        needsLoading: !preset.steps || preset.steps.length === 0 // Flag to load steps later
      }))

      // Always include default preset with full steps
      const defaultPreset = DEFAULT_PRESET

      const allPresets = [defaultPreset, ...formattedPresets]
      setStepPresets(allPresets)
      setSelectedPreset(defaultPreset)
      form.setFieldsValue({ presetId: 'default' })
    } catch (error) {
      console.error('Error loading presets:', error)
      // Fallback to default preset
      setStepPresets([DEFAULT_PRESET])
      setSelectedPreset(DEFAULT_PRESET)
      form.setFieldsValue({ presetId: 'default' })
    } finally {
      setLoadingPresets(false)
    }
  }

  // Load available steps
  const loadAvailableSteps = async () => {
    setLoadingSteps(true)
    try {
      const result = await dispatch(getProductionSteps()).unwrap()
      const steps = result || []
      setAvailableSteps(
        steps.map(step => ({
          ...step,
          icon: STEP_ICONS[step.stepName] || '⚡'
        }))
      )
    } catch (error) {
      console.error('Error loading steps:', error)
      setAvailableSteps([])
    } finally {
      setLoadingSteps(false)
    }
  }

  // Handle plan selection
  const handlePlanSelection = async planId => {
    const plan = productionPlans.find(p => p.id === planId)
    if (plan) {
      setSelectedProductionPlan(plan)

      const tracking = plan.quantityTracking || {}
      const allocInfo = {
        totalQuantity: plan.quantity || 0,
        allocatedQuantity: tracking.totalJobCardQuantity || 0,
        remainingQuantity: tracking.remainingQuantity || plan.quantity || 0,
        completedQuantity: tracking.completedQuantity || 0,
        percentage: plan.quantity
          ? Math.round(
              ((tracking.totalJobCardQuantity || 0) / plan.quantity) * 100
            )
          : 0
      }
      setAllocationInfo(allocInfo)

      // Fetch preset details if production plan has a preset assigned
      if (plan.presetId) {
        try {
          setLoadingPresetDetails(true)
          console.log('Fetching preset details for plan presetId:', plan.presetId)
          const response = await dispatch(getPresetDetails({ presetId: plan.presetId })).unwrap()
          console.log('Preset details loaded:', response)
          setPresetDetails(response || [])
        } catch (error) {
          console.error('Error loading preset details:', error)
          setPresetDetails([])
        } finally {
          setLoadingPresetDetails(false)
        }
      } else {
        // Clear preset details if no preset assigned
        setPresetDetails([])
      }

      // Set quantity with a small delay to ensure the form field is ready
      setTimeout(() => {
        const quantityToSet =
          allocInfo.remainingQuantity > 0 ? allocInfo.remainingQuantity : 1
        form.setFieldsValue({
          quantity: quantityToSet
        })
        console.log('Quantity set to:', quantityToSet)
      }, 100)

      setShowReasonField(false)
      form.setFieldsValue({ reason: '' })
    }
  }

  // Handle preset selection
  const handlePresetSelection = async presetId => {
    console.log('Selecting preset:', presetId)
    const preset = stepPresets.find(p => p.id === presetId)

    if (!preset) {
      console.error('Preset not found:', presetId)
      return
    }

    // If it's the default preset or already has steps, use it directly
    if (presetId === 'default' || (preset.steps && preset.steps.length > 0)) {
      setSelectedPreset(preset)
      form.setFieldsValue({ presetId })
      return
    }

    // Load steps for non-default presets
    try {
      setLoadingPresets(true)
      const result = await dispatch(
        getPresetDetails({ presetName: presetId })
      ).unwrap()
      console.log('Preset details loaded:', result)

      // Handle different response structures
      let presetSteps = []
      if (Array.isArray(result)) {
        presetSteps = result
      } else if (
        result.data &&
        result.data.steps &&
        Array.isArray(result.data.steps)
      ) {
        // Handle nested structure: { data: { steps: [...] } }
        presetSteps = result.data.steps
      } else if (result.data && Array.isArray(result.data)) {
        presetSteps = result.data
      } else if (result.steps && Array.isArray(result.steps)) {
        presetSteps = result.steps
      } else if (result.result && Array.isArray(result.result)) {
        presetSteps = result.result
      }

      console.log('Extracted preset steps:', presetSteps)

      // Log first step to see structure
      if (presetSteps.length > 0) {
        console.log('First step structure:', presetSteps[0])
      }

      // Create a copy of the array to avoid read-only issues
      const stepsCopy = [...presetSteps]

      // Format the steps - handle various field name possibilities
      const formattedSteps = stepsCopy
        .sort(
          (a, b) =>
            (a.stepOrder || a.step_order || 0) -
            (b.stepOrder || b.step_order || 0)
        )
        .map((step, index) => ({
          id: step.stepId || step.step_id || step.id || index + 1,
          name:
            step.stepName ||
            step.step_name ||
            step.name ||
            'Step ' + (index + 1),
          stepOrder: step.stepOrder || step.step_order || index + 1,
          isRequired:
            step.isRequired !== undefined
              ? step.isRequired
              : step.is_required !== undefined
              ? step.is_required
              : true,
          estimatedDuration:
            step.estimatedDuration || step.estimated_duration || 2,
          estimatedDurationUnit:
            step.estimatedDurationUnit ||
            step.estimated_duration_unit ||
            'hours',
          icon: STEP_ICONS[step.stepName || step.step_name || step.name] || '⚡'
        }))

      console.log('Formatted steps:', formattedSteps)

      // Update the preset with loaded steps
      const updatedPreset = {
        ...preset,
        steps: formattedSteps,
        needsLoading: false
      }

      // Update the preset in the list
      setStepPresets(prevPresets =>
        prevPresets.map(p => (p.id === presetId ? updatedPreset : p))
      )

      setSelectedPreset(updatedPreset)
      form.setFieldsValue({ presetId })

      notification.success({
        message: 'Preset Loaded',
        description: `${formattedSteps.length} steps loaded for ${preset.name}`,
        duration: 2
      })
    } catch (error) {
      console.error('Error loading preset details:', error)
      notification.error({
        message: 'Failed to Load Preset Steps',
        description:
          'Please try selecting another preset or use the default workflow.'
      })
      // Fallback to default preset
      const defaultPreset = stepPresets.find(p => p.id === 'default')
      if (defaultPreset) {
        setSelectedPreset(defaultPreset)
        form.setFieldsValue({ presetId: 'default' })
      }
    } finally {
      setLoadingPresets(false)
    }
  }

  // Handle drag end for custom steps
  const handleDragEnd = result => {
    if (!result.destination) return

    const items = Array.from(customSteps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update step orders
    items.forEach((step, index) => {
      step.stepOrder = index + 1
    })

    setCustomSteps(items)
  }

  // Add custom step
  const addCustomStep = step => {
    if (customSteps.find(s => s.stepId === step.id)) {
      notification.warning({
        message: 'Step Already Added',
        description: `"${step.stepName}" is already in your workflow`
      })
      return
    }

    const newStep = {
      id: Date.now(),
      stepId: step.id,
      stepName: step.stepName,
      stepOrder: customSteps.length + 1,
      estimatedDuration: 2,
      estimatedDurationUnit: 'hours',
      isRequired: true,
      icon: step.icon || '⚡',
      notes: ''
    }

    setCustomSteps([...customSteps, newStep])
  }

  // Remove custom step
  const removeCustomStep = stepId => {
    const updatedSteps = customSteps
      .filter(s => s.id !== stepId)
      .map((step, index) => ({ ...step, stepOrder: index + 1 }))
    setCustomSteps(updatedSteps)
  }

  // Update custom step
  const updateCustomStep = (stepId, field, value) => {
    setCustomSteps(
      customSteps.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    )
  }

  // Calculate total duration
  const calculateTotalDuration = steps => {
    const totalHours = steps.reduce((sum, step) => {
      const duration = step.estimatedDuration || 2
      const unit = step.estimatedDurationUnit || 'hours'
      const hoursMultiplier =
        unit === 'days' ? 24 : unit === 'minutes' ? 1 / 60 : 1
      return sum + duration * hoursMultiplier
    }, 0)

    if (totalHours >= 24) {
      return `${Math.round(totalHours / 24)} days`
    }
    return `${Math.round(totalHours)} hours`
  }

  // Handle quantity change
  const handleQuantityChange = value => {
    const shouldShowReason =
      value &&
      allocationInfo.remainingQuantity &&
      value < allocationInfo.remainingQuantity
    setShowReasonField(shouldShowReason)

    if (!shouldShowReason) {
      form.setFieldsValue({ reason: '' })
    }
  }

  // Validate form
  const validateSteps = () => null

  // Handle form submission
  const handleSubmit = async values => {
    try {
      setSubmitting(true)

      console.log('Form values on submit:', values)
      console.log('Selected production plan:', selectedProductionPlan)
      console.log('Selected plan (prop):', selectedPlan)

      const stepError = validateSteps()
      if (stepError) {
        notification.error({
          message: 'Validation Error',
          description: stepError
        })
        return
      }

      // Ensure we have prodPlanId
      const prodPlanId =
        values.prodPlanId || selectedProductionPlan?.id || selectedPlan?.id

      if (!prodPlanId) {
        notification.error({
          message: 'Production Plan Required',
          description: 'Please select a production plan'
        })
        return
      }
      console.log('VALUES:', values)
      console.log('Form quantity field value:', form.getFieldValue('quantity'))

      // Get quantity from form if not in values
      const quantity = values.quantity || form.getFieldValue('quantity')

      // Ensure we have quantity
      if (!quantity) {
        notification.error({
          message: 'Quantity Required',
          description: 'Please enter the quantity for this job card'
        })
        return
      }

      const payload = {
        prodPlanId: parseInt(prodPlanId),
        quantity: parseInt(quantity),
        notes: values.notes || '',
        isPartialQuantity: showReasonField,
        reason: showReasonField ? values.reason : '',
        createdBy: user?.id || user?.name || 'System'
      }

      console.log('Payload being sent:', payload)

      // Create job card
      const result = await dispatch(createJobCard(payload)).unwrap()

      // Workflow is inherited from the production plan; no custom step assignment here

      notification.success({
        message: 'Job Card Created Successfully',
        description: (
          <div>
            <div>Job card created for plan #{prodPlanId}</div>
            <div className='text-xs text-gray-500 mt-1'>
              Quantity: {values.quantity} units
            </div>
          </div>
        )
      })

      onSuccess && onSuccess()
      handleReset()
    } catch (error) {
      console.error('Job card creation error:', error)
      notification.error({
        message: 'Creation Failed',
        description: error.message || 'Failed to create job card'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Reset form
  const handleReset = () => {
    form.resetFields()
    setSelectedProductionPlan(null)
    setSelectedPreset(DEFAULT_PRESET)
    setCustomSteps([])
    setStepMode('preset')
    setShowReasonField(false)
    setCurrentStep(0)
    setPresetDetails([])
    setLoadingPresetDetails(false)
    form.setFieldsValue({ presetId: 'default' })
    onCancel()
  }

  // Wizard steps
  const wizardSteps = [
    { title: 'Production Plan', icon: <DashboardOutlined /> },
    { title: 'Quantity', icon: <AreaChartOutlined /> },
    { title: 'Workflow', icon: <BranchesOutlined /> },
    { title: 'Review', icon: <CheckCircleOutlined /> }
  ]

  // Get status color
  const getStatusColor = status => {
    const colors = {
      Pending: 'orange',
      'In Progress': 'blue',
      'Quality Check': 'purple',
      Completed: 'green',
      Cancelled: 'red',
      'On Hold': 'gray'
    }
    return colors[status] || 'default'
  }

  // Get category color
  const getCategoryColor = category => {
    const colors = {
      basic: 'blue',
      standard: 'green',
      premium: 'purple',
      chrome: 'orange',
      urgent: 'red',
      custom: 'cyan'
    }
    return colors[category] || 'default'
  }

  return (
    <Drawer
      title={
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Avatar
              icon={<RocketOutlined />}
              style={{ backgroundColor: '#1890ff' }}
              size={40}
            />
            <div>
              <Title level={4} className='mb-0'>
                Create Job Card
              </Title>
              <Text type='secondary' className='text-xs'>
                Set up a new production job card
              </Text>
            </div>
          </div>
        </div>
      }
      placement='right'
      width={900}
      open={visible}
      onClose={handleReset}
      footer={
        <div className='flex justify-between'>
          <Button onClick={handleReset} size='large'>
            Cancel
          </Button>
          <Space>
            {currentStep > 0 && (
              <Button
                onClick={() => setCurrentStep(currentStep - 1)}
                size='large'
              >
                Previous
              </Button>
            )}
            {currentStep < wizardSteps.length - 1 ? (
              <Button
                type='primary'
                onClick={() => {
                  const fields =
                    currentStep === 0
                      ? ['prodPlanId']
                      : currentStep === 1
                      ? ['quantity']
                      : []

                  form
                    .validateFields(fields)
                    .then(values => {
                      console.log(
                        'Validated values for step',
                        currentStep,
                        ':',
                        values
                      )
                      // Ensure quantity is preserved when moving forward
                      if (currentStep === 1 && values.quantity) {
                        console.log('Preserving quantity:', values.quantity)
                      }
                      setCurrentStep(currentStep + 1)
                    })
                    .catch(error => {
                      console.error('Validation error:', error)
                      notification.error({
                        message: 'Validation Error',
                        description: 'Please complete all required fields'
                      })
                    })
                }}
                size='large'
              >
                Next
              </Button>
            ) : (
              <Button
                type='primary'
                onClick={() => {
                  // Validate all fields before submitting
                  form
                    .validateFields()
                    .then(values => {
                      console.log('All form values before submit:', values)
                      handleSubmit(values)
                    })
                    .catch(error => {
                      console.error('Form validation error:', error)
                      notification.error({
                        message: 'Validation Error',
                        description: 'Please complete all required fields'
                      })
                    })
                }}
                loading={submitting}
                icon={<PlayCircleOutlined />}
                size='large'
                className='bg-gradient-to-r from-blue-500 to-purple-500 border-0'
                disabled={allocationInfo.remainingQuantity === 0}
              >
                Create Job Card
              </Button>
            )}
          </Space>
        </div>
      }
      destroyOnClose
    >
      {/* Progress Steps */}
      <Steps current={currentStep} items={wizardSteps} className='mb-6' />

      <Form form={form} layout='vertical' onFinish={handleSubmit}>
        {/* Step 1: Production Plan Selection */}
        {currentStep === 0 && (
          <div>
            {selectedPlan ? (
              <div>
                <Alert
                  message='Production Plan Pre-Selected'
                  description='This job card will be created for the following production plan'
                  type='info'
                  showIcon
                  className='mb-4'
                />
                <Form.Item
                  name='prodPlanId'
                  hidden
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </div>
            ) : (
              <Form.Item
                name='prodPlanId'
                label='Select Production Plan'
                rules={[
                  { required: true, message: 'Please select a production plan' }
                ]}
              >
                <Select
                  placeholder='Choose a production plan'
                  size='large'
                  loading={loading}
                  onChange={handlePlanSelection}
                  showSearch
                  filterOption={(input, option) =>
                    option.searchtext
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {productionPlans
                    .filter(
                      plan =>
                        plan.status !== 'Completed' &&
                        plan.status !== 'Cancelled'
                    )
                    .map(plan => (
                      <Option
                        key={plan.id}
                        value={plan.id}
                        searchtext={`${plan.id} ${
                          plan.sourceproductname || plan.alloyName
                        } ${plan.targetproductname || plan.convertName}`}
                      >
                        <div className='py-2'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <Text strong>#{plan.id}</Text>
                              <Text>
                                {plan.sourceproductname || plan.alloyName} →{' '}
                                {plan.targetproductname || plan.convertName}
                              </Text>
                              {plan.isUrgent && (
                                <Tag color='red' size='small'>
                                  URGENT
                                </Tag>
                              )}
                            </div>
                            <div className='text-right'>
                              <Tag
                                color={getStatusColor(plan.status)}
                                size='small'
                              >
                                {plan.status}
                              </Tag>
                              <div className='text-xs text-gray-500 mt-1'>
                                Qty: {plan.quantity}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            )}

            {/* Production Plan Details - Show for both pre-selected and manually selected plans */}
            {(selectedProductionPlan || selectedPlan) && (
              <div className='mt-4'>
                <Card
                  title={
                    <div className='flex items-center justify-between'>
                      <span className='flex items-center gap-2'>
                        <DashboardOutlined />
                        Production Plan Details
                      </span>
                      <Tag
                        color={
                          (selectedProductionPlan || selectedPlan)?.isUrgent ||
                          (selectedProductionPlan || selectedPlan)?.urgent
                            ? 'red'
                            : 'blue'
                        }
                      >
                        Plan #{selectedProductionPlan?.id || selectedPlan?.id}
                      </Tag>
                    </div>
                  }
                  className='shadow-sm'
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div className='bg-gray-50 p-3 rounded'>
                        <div className='text-xs text-gray-500 mb-1'>
                          Source Alloy
                        </div>
                        <div className='font-medium text-base'>
                          {console.log(selectedProductionPlan, 'SELECTED')}
                          {(selectedProductionPlan || selectedPlan)
                            ?.sourceProductName || 'N/A'}
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className='bg-gray-50 p-3 rounded'>
                        <div className='text-xs text-gray-500 mb-1'>
                          Target Product
                        </div>
                        <div className='font-medium text-base'>
                          {(selectedProductionPlan || selectedPlan)
                            ?.targetProductName || 'N/A'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className='bg-blue-50 p-3 rounded'>
                        <div className='text-xs text-gray-500 mb-1'>
                          Total Quantity
                        </div>
                        <div className='font-bold text-xl text-blue-600'>
                          {(
                            selectedProductionPlan || selectedPlan
                          )?.quantity?.toLocaleString() || 0}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className='bg-green-50 p-3 rounded'>
                        <div className='text-xs text-gray-500 mb-1'>Status</div>
                        <Tag
                          color={getStatusColor(
                            (selectedProductionPlan || selectedPlan)?.status
                          )}
                        >
                          {(selectedProductionPlan || selectedPlan)?.status ||
                            'Pending'}
                        </Tag>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className='bg-purple-50 p-3 rounded'>
                        <div className='text-xs text-gray-500 mb-1'>
                          Priority
                        </div>
                        <Tag
                          icon={
                            (selectedProductionPlan || selectedPlan)
                              ?.isUrgent ||
                            (selectedProductionPlan || selectedPlan)?.urgent ? (
                              <FireOutlined />
                            ) : null
                          }
                          color={
                            (selectedProductionPlan || selectedPlan)
                              ?.isUrgent ||
                            (selectedProductionPlan || selectedPlan)?.urgent
                              ? 'red'
                              : 'default'
                          }
                        >
                          {(selectedProductionPlan || selectedPlan)?.isUrgent ||
                          (selectedProductionPlan || selectedPlan)?.urgent
                            ? 'URGENT'
                            : 'Normal'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>

                  {/* Additional Details */}
                  <Divider className='my-3' />
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <div className='flex items-center gap-2'>
                        <CalendarOutlined className='text-gray-400' />
                        <span className='text-xs text-gray-500'>Created:</span>
                        <span className='text-sm'>
                          {moment(
                            (selectedProductionPlan || selectedPlan)?.createdAt
                          ).format('MMM DD, YYYY HH:mm')}
                        </span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className='flex items-center gap-2'>
                        <UserOutlined className='text-gray-400' />
                        <span className='text-xs text-gray-500'>Dealer:</span>
                        <span className='text-sm'>
                          {(selectedProductionPlan || selectedPlan)
                            ?.dealerName || 'Direct'}
                        </span>
                      </div>
                    </Col>
                  </Row>

                  {(selectedProductionPlan || selectedPlan)?.notes && (
                    <Alert
                      message='Plan Notes'
                      description={
                        (selectedProductionPlan || selectedPlan)?.notes
                      }
                      type='info'
                      className='mt-3'
                    />
                  )}
                </Card>

                {/* Quantity Tracking Card */}
                {(selectedProductionPlan?.quantityTracking ||
                  selectedPlan?.quantityTracking) && (
                  <Card className='mt-3 bg-gradient-to-r from-blue-50 to-purple-50'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <AreaChartOutlined className='text-blue-500' />
                        <Text strong>Quantity Tracking</Text>
                      </div>
                      <Progress
                        type='circle'
                        percent={allocationInfo.percentage}
                        width={60}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068'
                        }}
                      />
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Quantity Allocation */}
        {currentStep === 1 && (
          <div>
            {/* Allocation Status */}
            <Card
              className='mb-4'
              style={{
                background:
                  allocationInfo.remainingQuantity === 0
                    ? 'linear-gradient(135deg, #fff2f0 0%, #ffebe6 100%)'
                    : 'linear-gradient(135deg, #f0f9ff 0%, #e6f4ff 100%)'
              }}
            >
              <Title level={5} className='mb-4'>
                <AreaChartOutlined className='mr-2' />
                Quantity Allocation Status
              </Title>

              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title='Total Plan'
                    value={allocationInfo.totalQuantity}
                    suffix='units'
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title='Already Allocated'
                    value={allocationInfo.allocatedQuantity}
                    suffix='units'
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title='Available'
                    value={allocationInfo.remainingQuantity}
                    suffix='units'
                    valueStyle={{
                      color:
                        allocationInfo.remainingQuantity > 0
                          ? '#52c41a'
                          : '#ff4d4f'
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title='Completed'
                    value={allocationInfo.completedQuantity}
                    suffix='units'
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>

              <Progress
                percent={allocationInfo.percentage}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068'
                }}
                className='mt-4'
              />

              {allocationInfo.remainingQuantity === 0 && (
                <Alert
                  message='No Quantity Available'
                  description='This plan has been fully allocated. No additional job cards can be created.'
                  type='error'
                  showIcon
                  className='mt-4'
                />
              )}
            </Card>

            {/* Quantity Input */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name='quantity'
                  label='Job Card Quantity'
                  rules={[
                    { required: true, message: 'Please enter quantity' },
                    {
                      type: 'number',
                      min: 1,
                      message: 'Minimum quantity is 1'
                    },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve()
                        if (value > allocationInfo.remainingQuantity) {
                          return Promise.reject(
                            `Cannot exceed ${allocationInfo.remainingQuantity} units`
                          )
                        }
                        return Promise.resolve()
                      }
                    }
                  ]}
                >
                  <InputNumber
                    placeholder='Enter quantity'
                    size='large'
                    min={1}
                    max={allocationInfo.remainingQuantity || 1}
                    className='w-full'
                    formatter={value =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    onChange={handleQuantityChange}
                    disabled={allocationInfo.remainingQuantity === 0}
                    addonAfter='units'
                  />
                </Form.Item>

                {allocationInfo.remainingQuantity > 0 && (
                  <Space className='-mt-4 mb-4'>
                    <Button
                      size='small'
                      onClick={() => {
                        form.setFieldsValue({
                          quantity: Math.floor(
                            allocationInfo.remainingQuantity / 4
                          )
                        })
                        handleQuantityChange(
                          Math.floor(allocationInfo.remainingQuantity / 4)
                        )
                      }}
                    >
                      25%
                    </Button>
                    <Button
                      size='small'
                      onClick={() => {
                        form.setFieldsValue({
                          quantity: Math.floor(
                            allocationInfo.remainingQuantity / 2
                          )
                        })
                        handleQuantityChange(
                          Math.floor(allocationInfo.remainingQuantity / 2)
                        )
                      }}
                    >
                      50%
                    </Button>
                    <Button
                      size='small'
                      onClick={() => {
                        form.setFieldsValue({
                          quantity: Math.floor(
                            allocationInfo.remainingQuantity * 0.75
                          )
                        })
                        handleQuantityChange(
                          Math.floor(allocationInfo.remainingQuantity * 0.75)
                        )
                      }}
                    >
                      75%
                    </Button>
                    <Button
                      size='small'
                      type='primary'
                      onClick={() => {
                        form.setFieldsValue({
                          quantity: allocationInfo.remainingQuantity
                        })
                        handleQuantityChange(allocationInfo.remainingQuantity)
                      }}
                    >
                      100%
                    </Button>
                  </Space>
                )}
              </Col>

              <Col span={12}>
                <Form.Item name='notes' label='Job Card Notes (Optional)'>
                  <TextArea
                    placeholder='Add any special instructions or notes...'
                    rows={3}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Partial Quantity Reason */}
            {showReasonField && (
              <Alert
                message='Partial Quantity Allocation'
                description={
                  <Form.Item
                    name='reason'
                    label="Please explain why you're creating a partial quantity job card"
                    rules={[
                      {
                        required: true,
                        message: 'Reason is required for partial quantities'
                      }
                    ]}
                    className='mb-0 mt-3'
                  >
                    <TextArea
                      placeholder='Provide reason for partial quantity allocation...'
                      rows={2}
                      maxLength={300}
                      showCount
                    />
                  </Form.Item>
                }
                type='warning'
                showIcon
              />
            )}
          </div>
        )}

        {/* Step 3: Workflow Configuration */}
        {currentStep === 2 && (
          <div>
            <Alert
              message='Workflow'
              description='This job card will use the workflow preset already assigned to the production plan.'
              type='info'
              showIcon
              icon={<SettingOutlined />}
              className='mb-4'
            />

            <Card size='small'>
              <Descriptions column={2} bordered size='small'>
                <Descriptions.Item label='Preset Name'>
                  {(selectedProductionPlan || selectedPlan)?.workflowInfo
                    ?.presetName ||
                    (selectedProductionPlan || selectedPlan)?.presetName ||
                    'Standard'}
                </Descriptions.Item>
                <Descriptions.Item label='Total Steps'>
                  {(selectedProductionPlan || selectedPlan)?.workflowInfo
                    ?.totalSteps ??
                    (selectedProductionPlan || selectedPlan)?.stepCount ??
                    11}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {currentStep === 3 && (
          <div>
            <Alert
              message='Review Job Card Details'
              description='Please review all details before creating the job card'
              type='info'
              showIcon
              className='mb-4'
            />

            <Card>
              <Descriptions column={2} bordered size='small'>
                <Descriptions.Item label='Production Plan' span={2}>
                  <div className='flex items-center gap-2'>
                    <Text strong>
                      #{selectedProductionPlan?.id || selectedPlan?.id}
                    </Text>
                    <Text>
                      {(selectedProductionPlan || selectedPlan)
                        ?.sourceproductname ||
                        (selectedProductionPlan || selectedPlan)
                          ?.alloyName}{' '}
                      →
                      {(selectedProductionPlan || selectedPlan)
                        ?.targetproductname ||
                        (selectedProductionPlan || selectedPlan)?.convertName}
                    </Text>
                    {(selectedProductionPlan || selectedPlan)?.isUrgent && (
                      <Tag color='red' size='small'>
                        URGENT
                      </Tag>
                    )}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label='Quantity'>
                  <Text strong>
                    {form.getFieldValue('quantity')?.toLocaleString()} units
                  </Text>
                  {showReasonField && (
                    <Tag color='warning' size='small' className='ml-2'>
                      PARTIAL
                    </Tag>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label='Allocation'>
                  <Progress
                    percent={Math.round(
                      ((form.getFieldValue('quantity') || 0) /
                        allocationInfo.totalQuantity) *
                        100
                    )}
                    size='small'
                    strokeColor='#1890ff'
                  />
                </Descriptions.Item>

                <Descriptions.Item label='Workflow'>
                  {(selectedProductionPlan || selectedPlan)?.workflowInfo
                    ?.presetName ||
                    (selectedProductionPlan || selectedPlan)?.presetName ||
                    'Standard'}
                </Descriptions.Item>
                <Descriptions.Item label='Total Steps'>
                  <Badge
                    count={
                      (selectedProductionPlan || selectedPlan)?.workflowInfo
                        ?.totalSteps ??
                      (selectedProductionPlan || selectedPlan)?.stepCount ??
                      11
                    }
                    style={{ backgroundColor: '#52c41a' }}
                  />
                </Descriptions.Item>

                {form.getFieldValue('notes') && (
                  <Descriptions.Item label='Notes' span={2}>
                    {form.getFieldValue('notes')}
                  </Descriptions.Item>
                )}

                {showReasonField && form.getFieldValue('reason') && (
                  <Descriptions.Item label='Partial Reason' span={2}>
                    <Text type='warning'>{form.getFieldValue('reason')}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {/* Workflow Summary - Show preset steps from production plan */}
              <div className='mt-4'>
                <Title level={5}>
                  <BranchesOutlined className='mr-2' />
                  Workflow Steps
                </Title>
                <div className='max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4'>
                  {loadingPresetDetails ? (
                    <div className='flex justify-center py-4'>
                      <Spin size='small' />
                      <Text className='ml-2'>Loading preset steps...</Text>
                    </div>
                  ) : presetDetails.length > 0 ? (
                    <Timeline mode='left' className='mt-2'>
                      {presetDetails.map((step, index) => (
                        <Timeline.Item
                          key={step.stepId || index}
                          color={step.isRequired ? 'blue' : 'green'}
                          dot={
                            <Avatar
                              size='small'
                              className={
                                step.isRequired ? 'bg-blue-500' : 'bg-green-500'
                              }
                            >
                              {index + 1}
                            </Avatar>
                          }
                          className='pb-2'
                        >
                          <div className='font-semibold text-gray-800'>
                            {step.stepName}
                          </div>
                          <div className='text-sm text-gray-600 mt-1'>
                            {step.estimatedDuration && (
                              <span className='inline-flex items-center'>
                                <ClockCircleOutlined className='mr-1 text-gray-400' />
                                {step.estimatedDuration}{' '}
                                {step.estimatedDurationUnit}
                              </span>
                            )}
                            <span className='inline-flex items-center ml-4'>
                              <NumberOutlined className='mr-1 text-gray-400' />
                              Order: {step.stepOrder}
                            </span>
                          </div>
                          {step.isRequired && (
                            <div className='mt-1'>
                              <Tag color='blue' size='small'>
                                Required
                              </Tag>
                            </div>
                          )}
                          {step.notes && (
                            <div className='mt-1 text-xs text-gray-500 italic'>
                              Notes: {step.notes}
                            </div>
                          )}
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <div className='text-center py-8'>
                      <Empty
                        description={
                          <div>
                            <div className='text-gray-500 mb-2'>
                              No preset steps available
                            </div>
                            <div className='text-xs text-gray-400'>
                              {(selectedProductionPlan || selectedPlan)
                                ?.presetName ||
                                (selectedProductionPlan || selectedPlan)
                                  ?.presetName ||
                                'Standard'}{' '}
                              workflow
                            </div>
                          </div>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {allocationInfo.remainingQuantity === 0 && (
              <Alert
                message='Cannot Create Job Card'
                description='No quantity is available for allocation. Please adjust the production plan.'
                type='error'
                showIcon
                className='mt-4'
              />
            )}
          </div>
        )}
      </Form>
    </Drawer>
  )
}

export default JobCardCreationModal
